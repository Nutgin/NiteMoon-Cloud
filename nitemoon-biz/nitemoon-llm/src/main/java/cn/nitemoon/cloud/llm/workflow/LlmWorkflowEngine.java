package cn.nitemoon.cloud.llm.workflow;

import cn.nitemoon.cloud.llm.api.remote.RemoteLlmService;
import cn.nitemoon.cloud.llm.config.ChatProps;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmExecution;
import cn.nitemoon.cloud.llm.entity.LlmExecutionNode;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.entity.LlmWorkflow;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowEdge;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.enums.WfNodeTypeEnum;
import cn.nitemoon.cloud.llm.provider.EmbeddingProvider;
import cn.nitemoon.cloud.llm.provider.ModelProvider;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import cn.nitemoon.cloud.llm.service.LlmExecutionNodeService;
import cn.nitemoon.cloud.llm.service.LlmExecutionService;
import cn.nitemoon.cloud.llm.service.LlmToolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import cn.nitemoon.cloud.llm.service.LlmWorkflowEdgeService;
import cn.nitemoon.cloud.llm.service.LlmWorkflowNodeService;
import cn.nitemoon.cloud.llm.service.LlmWorkflowService;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.node.*;
import cn.nitemoon.cloud.llm.workflow.parallel.ParallelBranchExecutor;
import cn.nitemoon.cloud.llm.workflow.tools.ToolRegistry;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class LlmWorkflowEngine {

    private final LlmWorkflowService workflowService;
    private final LlmWorkflowNodeService nodeService;
    private final LlmWorkflowEdgeService edgeService;
    private final ModelProvider modelProvider;
    private final EmbeddingProvider embeddingProvider;
    private final ChatProps chatProps;
    private final ToolRegistry toolRegistry;
    private final LlmToolService toolService;
    private final LlmMessageMapper messageMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @DubboReference
    private RemoteLlmService remoteLlmService;

    @Autowired(required = false)
    private LlmExecutionService executionService;

    @Autowired(required = false)
    private LlmExecutionNodeService executionNodeService;

    private static final ThreadLocal<String> currentExecutionId = new ThreadLocal<>();
    private static final ThreadLocal<Integer> currentSortOrder = ThreadLocal.withInitial(() -> 0);

    public void initExecution(ChatReq req, String triggerType) {
        if (executionService == null) return;
        LlmExecution execution = new LlmExecution()
                .setAppId(req.getAppId())
                .setConversationId(req.getConversationId())
                .setUserId(req.getUserId())
                .setUserName(req.getUsername())
                .setRequestMessage(req.getMessage())
                .setStatus("running")
                .setTriggerType(triggerType)
                .setTotalInputTokens(0)
                .setTotalOutputTokens(0)
                .setTotalDuration(0L)
                .setCreateTime(new java.util.Date());
        executionService.save(execution);
        currentExecutionId.set(execution.getId());
        currentSortOrder.set(0);
    }

    public void completeExecution(WfNodeResult result, long startTime, String executionPath) {
        String executionId = currentExecutionId.get();
        if (executionId == null || executionService == null) return;
        try {
            LlmExecution execution = executionService.getById(executionId);
            if (execution != null) {
                execution.setResponseMessage(result.getOutput() != null ?
                        result.getOutput().substring(0, Math.min(result.getOutput().length(), 500)) : null)
                        .setStatus("success")
                        .setTotalInputTokens(result.getInputTokens())
                        .setTotalOutputTokens(result.getOutputTokens())
                        .setTotalDuration(System.currentTimeMillis() - startTime)
                        .setExecutionPath(executionPath);
                executionService.updateById(execution);
            }
        } finally {
            currentExecutionId.remove();
            currentSortOrder.remove();
        }
    }

    public void failExecution(Exception e, long startTime) {
        String executionId = currentExecutionId.get();
        if (executionId == null || executionService == null) return;
        try {
            LlmExecution execution = executionService.getById(executionId);
            if (execution != null) {
                execution.setStatus("failed")
                        .setErrorMessage(e.getMessage() != null ?
                                e.getMessage().substring(0, Math.min(e.getMessage().length(), 500)) : null)
                        .setTotalDuration(System.currentTimeMillis() - startTime);
                executionService.updateById(execution);
            }
        } finally {
            currentExecutionId.remove();
            currentSortOrder.remove();
        }
    }

    public WfNodeResult execute(ChatReq req, String workflowUuid) {
        log.info("工作流引擎开始执行, workflowUuid: {}", workflowUuid);

        Long workflowId = resolveWorkflowId(workflowUuid);

        List<LlmWorkflowNode> nodes = nodeService.listByWorkflowId(workflowId);
        List<LlmWorkflowEdge> edges = edgeService.listByWorkflowId(workflowId);

        if (nodes.isEmpty()) {
            throw new RuntimeException("工作流没有节点, workflowUuid: " + workflowUuid);
        }

        // 构建节点映射
        Map<String, LlmWorkflowNode> nodeMap = new LinkedHashMap<>();
        for (LlmWorkflowNode node : nodes) {
            nodeMap.put(node.getUuid(), node);
        }

        // 构建出边映射（一个节点可能有多条出边，如IfElse分支）
        Map<String, List<LlmWorkflowEdge>> edgesBySource = new LinkedHashMap<>();
        for (LlmWorkflowEdge edge : edges) {
            edgesBySource.computeIfAbsent(edge.getSourceNodeUuid(), k -> new ArrayList<>()).add(edge);
        }

        // Build incoming edges map (for merge node detection)
        Map<String, List<LlmWorkflowEdge>> edgesByTarget = new LinkedHashMap<>();
        for (LlmWorkflowEdge edge : edges) {
            edgesByTarget.computeIfAbsent(edge.getTargetNodeUuid(), k -> new ArrayList<>()).add(edge);
        }

        // Create parallel branch executor
        ParallelBranchExecutor parallelExecutor = new ParallelBranchExecutor(nodeMap, edgesBySource, edgesByTarget);

        // 找到开始节点
        LlmWorkflowNode startNode = nodes.stream()
                .filter(n -> WfNodeTypeEnum.START.getValue().equals(n.getNodeType()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("工作流缺少开始节点"));

        StreamEmitter emitter = req.getEmitter();

        String lastOutput = null;
        int totalInputTokens = 0;
        int totalOutputTokens = 0;
        Set<String> modelNames = new LinkedHashSet<>();
        List<LlmMessage> allNodeMessages = new ArrayList<>();

        // 图遍历执行：从START开始，根据边（含分支）决定下一个节点
        String currentUuid = startNode.getUuid();
        Set<String> visited = new HashSet<>();
        List<String> executionPath = new ArrayList<>();
        // 记录到达 End 节点时，实际执行过的直接上游节点
        Set<String> endDirectPredecessors = new HashSet<>();

        while (currentUuid != null) {
            if (visited.contains(currentUuid)) {
                throw new RuntimeException("工作流存在环路，不支持循环执行");
            }
            visited.add(currentUuid);

            LlmWorkflowNode currentNode = nodeMap.get(currentUuid);
            if (currentNode == null) {
                throw new RuntimeException("工作流节点不存在, uuid: " + currentUuid);
            }

            executionPath.add(currentNode.getNodeType() + "(" + currentNode.getTitle() + ")");

            // 解析当前节点的输入参数
            Map<String, Object> inputParams = resolveInputParams(currentNode, req);

            // End 节点注入直接上游节点UUID列表，用于精确收集分支输出
            // 只包含实际执行路径中直接指向 End 的上游节点，排除未走过的分支
            if (WfNodeTypeEnum.END.getValue().equalsIgnoreCase(currentNode.getNodeType())) {
                if (!endDirectPredecessors.isEmpty()) {
                    req.putContext("__end_upstream_uuids__", new ArrayList<>(endDirectPredecessors));
                }
                // End 节点如果没有配置 ref_inputs，自动接收上一个节点的输出
                if (inputParams.isEmpty() && lastOutput != null) {
                    inputParams.put("llm_output", lastOutput);
                }
            }

            // Record node execution start
            LlmExecutionNode nodeRecord = null;
            long nodeStartTime = System.currentTimeMillis();
            String execId = currentExecutionId.get();
            if (execId != null && executionNodeService != null) {
                int order = currentSortOrder.get();
                currentSortOrder.set(order + 1);
                nodeRecord = new LlmExecutionNode()
                        .setExecutionId(execId)
                        .setNodeUuid(currentNode.getUuid())
                        .setNodeType(currentNode.getNodeType())
                        .setNodeTitle(currentNode.getTitle())
                        .setStatus("running")
                        .setSortOrder(order)
                        .setCreateTime(new java.util.Date());
                if (inputParams != null && !inputParams.isEmpty()) {
                    try {
                        nodeRecord.setInputParams(cn.nitemoon.cloud.common.core.util.JsonUtils.toJsonString(inputParams));
                    } catch (Exception ex) { /* ignore serialization errors */ }
                }
                executionNodeService.save(nodeRecord);
            }

            // Execute node
            // 只有 End 节点使用真实 emitter 向用户输出，中间节点不直接向用户发送内容
            AbstractLlmWfNode executor = createNode(currentNode);
            boolean isEndNode = WfNodeTypeEnum.END.getValue().equalsIgnoreCase(currentNode.getNodeType());
            log.info("执行节点: {} ({})", currentNode.getTitle(), currentNode.getNodeType());
            WfNodeResult result = executor.execute(inputParams, isEndNode ? emitter : null, req);

            // Record node execution completion
            if (nodeRecord != null && executionNodeService != null) {
                try {
                    long nodeDuration = System.currentTimeMillis() - nodeStartTime;
                    nodeRecord.setOutputText(result.getOutput() != null ?
                            result.getOutput().substring(0, Math.min(result.getOutput().length(), 2000)) : null);
                    nodeRecord.setInputTokens(result.getInputTokens());
                    nodeRecord.setOutputTokens(result.getOutputTokens());
                    nodeRecord.setDuration(nodeDuration);
                    nodeRecord.setStatus("success");
                    if (result.getOutputParams() != null && !result.getOutputParams().isEmpty()) {
                        nodeRecord.setOutputParams(cn.nitemoon.cloud.common.core.util.JsonUtils.toJsonString(result.getOutputParams()));
                    }
                    // Special: record command execution details in logs
                    if (WfNodeTypeEnum.COMMAND_EXEC_TOOL.getValue().equalsIgnoreCase(currentNode.getNodeType())) {
                        java.util.Map<String, Object> logData = new java.util.HashMap<>();
                        logData.put("output", result.getOutput());
                        logData.put("status", result.getOutputParam("status"));
                        nodeRecord.setLogs(cn.nitemoon.cloud.common.core.util.JsonUtils.toJsonString(logData));
                    }
                    executionNodeService.updateById(nodeRecord);
                } catch (Exception ex) {
                    // Don't let recording failures break the workflow
                    log.warn("记录节点执行信息失败: {}", ex.getMessage());
                }
            }

            // 将输出参数写入 context
            if (result.getOutputParams() != null) {
                result.getOutputParams().forEach((key, value) -> {
                    req.putContext(currentNode.getUuid() + "." + key, value);
                });
            }

            // 主输出也写入 context（兼容 output 引用）
            req.putContext(currentNode.getUuid() + ".output", result.getOutput());
            lastOutput = result.getOutput();

            totalInputTokens += result.getInputTokens();
            totalOutputTokens += result.getOutputTokens();

            // Collect model names
            if (cn.hutool.core.util.StrUtil.isNotBlank(result.getModelName())) {
                modelNames.add(result.getModelName());
            }

            // Collect per-node message records
            if (result.getNodeMessages() != null) {
                allNodeMessages.addAll(result.getNodeMessages());
            }

            // 传播 metadata（如 tools）到下游节点
            if (result.getMetadata() != null) {
                result.getMetadata().forEach((key, value) -> {
                    if ("tools".equals(key) && value instanceof List) {
                        Object existing = req.getContext(key);
                        if (existing instanceof List) {
                            ((List<Object>) existing).addAll((List<Object>) value);
                        } else {
                            req.putContext(key, value);
                        }
                    } else {
                        req.putContext(key, value);
                    }
                });
            }

            // 到达END节点则结束
            if (WfNodeTypeEnum.END.getValue().equalsIgnoreCase(currentNode.getNodeType())) {
                break;
            }

            // Determine next node(s)
            List<LlmWorkflowEdge> outEdges = edgesBySource.get(currentUuid);
            if (outEdges == null || outEdges.isEmpty()) {
                log.warn("节点 {} 没有出边，工作流终止", currentNode.getTitle());
                break;
            }

            String branchResult = result.getMetadata() != null
                    ? (String) result.getMetadata().get("branchResult")
                    : null;

            if (branchResult != null) {
                // IfElse branch - select single edge
                String finalBranchResult = branchResult;
                String fromUuid = currentNode.getUuid();
                currentUuid = outEdges.stream()
                        .filter(e -> finalBranchResult.equals(e.getSourceHandle()))
                        .map(LlmWorkflowEdge::getTargetNodeUuid)
                        .findFirst()
                        .orElseGet(() -> {
                            log.warn("未找到匹配的分支边 sourceHandle={}, 使用默认出边", finalBranchResult);
                            return outEdges.stream()
                                    .filter(e -> e.getSourceHandle() == null || e.getSourceHandle().isEmpty())
                                    .map(LlmWorkflowEdge::getTargetNodeUuid)
                                    .findFirst()
                                    .orElse(outEdges.get(0).getTargetNodeUuid());
                        });
                // 记录到达 End 节点的直接上游
                if (isEndNodeType(currentUuid, nodeMap)) {
                    endDirectPredecessors.add(fromUuid);
                }
            } else if (shouldExecuteParallel(outEdges, result)) {
                // Parallel execution - fork into multiple branches
                log.info("检测到并行分叉，节点: {}, 出边数: {}", currentNode.getTitle(), outEdges.size());

                WfNodeResult parallelResult = parallelExecutor.executeParallelBranches(
                    outEdges, req, currentNode,
                    (startNodeUuid, branchContext) -> executeBranch(startNodeUuid, branchContext, nodeMap, edgesBySource, edgesByTarget, emitter)
                );

                // Update token counts
                totalInputTokens += parallelResult.getInputTokens();
                totalOutputTokens += parallelResult.getOutputTokens();

                // Collect model names from parallel result
                if (cn.hutool.core.util.StrUtil.isNotBlank(parallelResult.getModelName())) {
                    modelNames.add(parallelResult.getModelName());
                }

                // Collect node messages from parallel branches
                if (parallelResult.getNodeMessages() != null) {
                    allNodeMessages.addAll(parallelResult.getNodeMessages());
                }

                // Find merge node or end node
                String nextNode = findNextNodeAfterParallel(outEdges, edgesBySource, edgesByTarget, nodeMap);
                if (nextNode == null) {
                    break; // No merge node, workflow ends
                }
                currentUuid = nextNode;
                // 记录到达 End 节点的直接上游（使用各分支最后一个执行节点的UUID）
                if (isEndNodeType(currentUuid, nodeMap)) {
                    // 从context中查找并行分支写入的输出key（格式: "uuid.output"）
                    // 排除分叉节点自身的输出，找到各分支实际执行节点的UUID
                    String forkNodeOutput = currentNode.getUuid() + ".output";
                    for (Map.Entry<String, Object> entry : req.getContext().entrySet()) {
                        if (entry.getKey().endsWith(".output") && !entry.getKey().equals(forkNodeOutput)) {
                            String nodeUuid = entry.getKey().substring(0, entry.getKey().length() - ".output".length());
                            endDirectPredecessors.add(nodeUuid);
                        }
                    }
                    // 如果没有找到分支输出，回退使用分叉节点UUID
                    if (endDirectPredecessors.isEmpty()) {
                        endDirectPredecessors.add(currentNode.getUuid());
                    }
                }
            } else {
                // Single edge - continue sequential
                currentUuid = outEdges.get(0).getTargetNodeUuid();
                // 记录到达 End 节点的直接上游
                if (isEndNodeType(currentUuid, nodeMap)) {
                    endDirectPredecessors.add(currentNode.getUuid());
                }
            }
        }

        log.info("工作流执行完成, 路径: {}, 总token统计 - input: {}, output: {}",
                String.join(" -> ", executionPath), totalInputTokens, totalOutputTokens);
        WfNodeResult finalResult = new WfNodeResult(lastOutput, totalInputTokens, totalOutputTokens);
        if (!modelNames.isEmpty()) {
            finalResult.setModelName(String.join(", ", modelNames));
        }
        finalResult.setNodeMessages(allNodeMessages);
        return finalResult;
    }

    /**
     * 解析节点的输入参数：从 inputConfig.ref_inputs 中读取绑定关系，
     * 从 req.context 中获取上游节点的输出值。
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> resolveInputParams(LlmWorkflowNode node, ChatReq req) {
        Map<String, Object> inputParams = new HashMap<>();

        String inputConfigJson = node.getInputConfig();
        if (inputConfigJson == null || inputConfigJson.isEmpty()) {
            return inputParams;
        }

        try {
            com.fasterxml.jackson.databind.JsonNode root = cn.nitemoon.cloud.common.core.util.JsonUtils.parseObject(inputConfigJson, com.fasterxml.jackson.databind.JsonNode.class);
            if (root == null || !root.has("ref_inputs")) {
                return inputParams;
            }

            com.fasterxml.jackson.databind.JsonNode refInputs = root.get("ref_inputs");
            if (!refInputs.isArray()) {
                return inputParams;
            }

            for (com.fasterxml.jackson.databind.JsonNode ref : refInputs) {
                String name = ref.has("name") ? ref.get("name").asText() : null;
                String sourceNodeUuid = ref.has("source_node_uuid") ? ref.get("source_node_uuid").asText() : null;
                String sourceParam = ref.has("source_param") ? ref.get("source_param").asText() : null;

                if (name != null && sourceNodeUuid != null && sourceParam != null) {
                    String contextKey = sourceNodeUuid + "." + sourceParam;
                    Object value = req.getContext(contextKey);
                    inputParams.put(name, value);
                    log.debug("解析输入参数: {} = {} (from {})", name, value, contextKey);
                }
            }
        } catch (Exception e) {
            log.warn("解析节点 inputConfig 失败: nodeUuid={}, error={}", node.getUuid(), e.getMessage());
        }

        return inputParams;
    }

    private Long resolveWorkflowId(String workflowUuid) {
        LlmWorkflow workflow = workflowService.getOne(Wrappers.<LlmWorkflow>lambdaQuery()
                .eq(LlmWorkflow::getUuid, workflowUuid)
                .eq(LlmWorkflow::getIsDeleted, false)
                .last("limit 1"));
        if (workflow == null) {
            throw new RuntimeException("工作流不存在, uuid: " + workflowUuid);
        }
        return workflow.getId();
    }

    private WfNodeTypeEnum resolveNodeType(String nodeType) {
        String normalized = nodeType.replace("-", "");
        for (WfNodeTypeEnum e : WfNodeTypeEnum.values()) {
            if (e.getValue().equalsIgnoreCase(normalized)) {
                return e;
            }
        }
        throw new RuntimeException("不支持的节点类型: " + nodeType);
    }

    private boolean isEndNodeType(String nodeUuid, Map<String, LlmWorkflowNode> nodeMap) {
        LlmWorkflowNode node = nodeMap.get(nodeUuid);
        return node != null && WfNodeTypeEnum.END.getValue().equalsIgnoreCase(node.getNodeType());
    }

    private AbstractLlmWfNode createNode(LlmWorkflowNode node) {
        WfNodeTypeEnum nodeType = resolveNodeType(node.getNodeType());
        switch (nodeType) {
            case START:
                return new StartWfNode(node);
            case DATETIME_TOOL:
                return new DateTimeToolWfNode(node, toolRegistry);
            case WEB_SEARCH_TOOL:
                return new WebSearchToolWfNode(node, toolRegistry);
            case HTTP_REQUEST_TOOL:
                return new HttpRequestToolWfNode(node, toolRegistry);
            case CUSTOM_TOOL:
                return new CustomToolWfNode(node, toolService);
            case COMMAND_EXEC_TOOL:
                return new CommandExecToolWfNode(node, toolRegistry);
            case KNOWLEDGE_RETRIEVAL:
                return new KnowledgeRetrievalWfNode(node, embeddingProvider);
            case LLM:
                return new LLMAnswerWfNode(node, modelProvider, chatProps, messageMapper, redisTemplate);
            case MULTIMODAL_LLM:
                return new MultimodalLlmWfNode(node, modelProvider, chatProps, messageMapper, redisTemplate);
            case IF_ELSE:
                return new IfElseWfNode(node);
            case DOC_EXTRACTOR:
                return new DocExtractorWfNode(node);
            case END:
                return new EndWfNode(node);
            default:
                throw new RuntimeException("不支持的节点类型: " + node.getNodeType());
        }
    }

    /**
     * Check if node should trigger parallel execution
     */
    private boolean shouldExecuteParallel(List<LlmWorkflowEdge> outEdges, WfNodeResult result) {
        if (outEdges == null || outEdges.size() <= 1) {
            return false;
        }

        // Check if this is an IfElse branch (has branchResult)
        String branchResult = result.getMetadata() != null
                ? (String) result.getMetadata().get("branchResult")
                : null;

        // If it has branchResult, it's IfElse - don't parallel
        if (branchResult != null) {
            return false;
        }

        // Multiple outgoing edges without branchResult = parallel execution
        return true;
    }

    /**
     * Execute a single branch from start to end or merge point
     */
    private WfNodeResult executeBranch(
            String startNodeUuid,
            ChatReq branchContext,
            Map<String, LlmWorkflowNode> nodeMap,
            Map<String, List<LlmWorkflowEdge>> edgesBySource,
            Map<String, List<LlmWorkflowEdge>> edgesByTarget,
            StreamEmitter emitter) {

        String currentUuid = startNodeUuid;
        String lastExecutedNodeUuid = null;
        Set<String> visited = new HashSet<>();
        String lastOutput = null;
        int totalInputTokens = 0;
        int totalOutputTokens = 0;
        Map<String, Object> allOutputParams = new HashMap<>();
        List<LlmMessage> branchNodeMessages = new ArrayList<>();

        while (currentUuid != null) {
            if (visited.contains(currentUuid)) {
                throw new RuntimeException("分支存在环路");
            }
            visited.add(currentUuid);

            LlmWorkflowNode currentNode = nodeMap.get(currentUuid);
            if (currentNode == null) {
                throw new RuntimeException("节点不存在: " + currentUuid);
            }

            // Check if this is a merge node (multiple incoming edges) BEFORE executing
            // Merge nodes and end nodes should be handled by the main engine after all branches complete
            List<LlmWorkflowEdge> inEdges = edgesByTarget.get(currentUuid);
            if (inEdges != null && inEdges.size() > 1) {
                // This is a merge node - stop here, main engine will handle it
                break;
            }

            // Check if reached end node BEFORE executing
            // End nodes collect branch outputs from main context, so they must run after all branches
            if (WfNodeTypeEnum.END.getValue().equalsIgnoreCase(currentNode.getNodeType())) {
                break;
            }

            // Record node execution start
            Map<String, Object> inputParams = resolveInputParams(currentNode, branchContext);
            LlmExecutionNode nodeRecord = null;
            long nodeStartTime = System.currentTimeMillis();
            String execId = currentExecutionId.get();
            if (execId != null && executionNodeService != null) {
                int order = currentSortOrder.get();
                currentSortOrder.set(order + 1);
                nodeRecord = new LlmExecutionNode()
                        .setExecutionId(execId)
                        .setNodeUuid(currentNode.getUuid())
                        .setNodeType(currentNode.getNodeType())
                        .setNodeTitle(currentNode.getTitle())
                        .setStatus("running")
                        .setSortOrder(order)
                        .setCreateTime(new java.util.Date());
                if (inputParams != null && !inputParams.isEmpty()) {
                    try {
                        nodeRecord.setInputParams(cn.nitemoon.cloud.common.core.util.JsonUtils.toJsonString(inputParams));
                    } catch (Exception ex) { /* ignore serialization errors */ }
                }
                executionNodeService.save(nodeRecord);
            }

            // Execute node - use branchContext's emitter (BranchStreamEmitter) for branch-tagged output
            AbstractLlmWfNode executor = createNode(currentNode);
            StreamEmitter branchEmitter = branchContext.getEmitter() != null ? branchContext.getEmitter() : emitter;
            WfNodeResult result = executor.execute(inputParams, branchEmitter, branchContext);

            // Record node execution completion
            if (nodeRecord != null && executionNodeService != null) {
                try {
                    long nodeDuration = System.currentTimeMillis() - nodeStartTime;
                    nodeRecord.setOutputText(result.getOutput() != null ?
                            result.getOutput().substring(0, Math.min(result.getOutput().length(), 2000)) : null);
                    nodeRecord.setInputTokens(result.getInputTokens());
                    nodeRecord.setOutputTokens(result.getOutputTokens());
                    nodeRecord.setDuration(nodeDuration);
                    nodeRecord.setStatus("success");
                    if (result.getOutputParams() != null && !result.getOutputParams().isEmpty()) {
                        nodeRecord.setOutputParams(cn.nitemoon.cloud.common.core.util.JsonUtils.toJsonString(result.getOutputParams()));
                    }
                    // Special: record command execution details in logs
                    if (WfNodeTypeEnum.COMMAND_EXEC_TOOL.getValue().equalsIgnoreCase(currentNode.getNodeType())) {
                        java.util.Map<String, Object> logData = new java.util.HashMap<>();
                        logData.put("output", result.getOutput());
                        logData.put("status", result.getOutputParam("status"));
                        nodeRecord.setLogs(cn.nitemoon.cloud.common.core.util.JsonUtils.toJsonString(logData));
                    }
                    executionNodeService.updateById(nodeRecord);
                } catch (Exception ex) {
                    // Don't let recording failures break the workflow
                    log.warn("记录节点执行信息失败: {}", ex.getMessage());
                }
            }

            lastExecutedNodeUuid = currentUuid;

            // Update branch context
            if (result.getOutputParams() != null) {
                result.getOutputParams().forEach((key, value) -> {
                    branchContext.putContext(currentNode.getUuid() + "." + key, value);
                });
            }
            branchContext.putContext(currentNode.getUuid() + ".output", result.getOutput());
            lastOutput = result.getOutput();

            totalInputTokens += result.getInputTokens();
            totalOutputTokens += result.getOutputTokens();

            // Collect all output params from executed nodes
            if (result.getOutputParams() != null) {
                allOutputParams.putAll(result.getOutputParams());
            }

            // Collect node messages
            if (result.getNodeMessages() != null) {
                branchNodeMessages.addAll(result.getNodeMessages());
            }

            // Get outgoing edges
            List<LlmWorkflowEdge> outEdges = edgesBySource.get(currentUuid);
            if (outEdges == null || outEdges.isEmpty()) {
                break;
            }

            // Check for nested parallel
            String branchResult = result.getMetadata() != null
                    ? (String) result.getMetadata().get("branchResult")
                    : null;

            if (branchResult != null) {
                // IfElse branch
                String finalBranchResult = branchResult;
                currentUuid = outEdges.stream()
                        .filter(e -> finalBranchResult.equals(e.getSourceHandle()))
                        .map(LlmWorkflowEdge::getTargetNodeUuid)
                        .findFirst()
                        .orElse(outEdges.get(0).getTargetNodeUuid());
            } else if (outEdges.size() > 1) {
                // Nested parallel - would need recursive handling
                // For now, take first edge
                log.warn("嵌套并行暂不支持，取第一条出边");
                currentUuid = outEdges.get(0).getTargetNodeUuid();
            } else {
                currentUuid = outEdges.get(0).getTargetNodeUuid();
            }
        }

        WfNodeResult branchResult = new WfNodeResult(lastOutput, totalInputTokens, totalOutputTokens);
        branchResult.setOutputParams(allOutputParams);
        branchResult.setLastExecutedNodeUuid(lastExecutedNodeUuid);
        branchResult.setNodeMessages(branchNodeMessages);
        return branchResult;
    }

    /**
     * Find the next node after parallel branches (merge node or end)
     */
    private String findNextNodeAfterParallel(
            List<LlmWorkflowEdge> outEdges,
            Map<String, List<LlmWorkflowEdge>> edgesBySource,
            Map<String, List<LlmWorkflowEdge>> edgesByTarget,
            Map<String, LlmWorkflowNode> nodeMap) {

        // Collect all direct targets of the fork node (branch start nodes)
        Set<String> branchStartNodes = outEdges.stream()
                .map(LlmWorkflowEdge::getTargetNodeUuid)
                .collect(Collectors.toSet());

        // Find ALL reachable nodes downstream of branches by following edges
        // Then check which ones receive edges from multiple branch paths
        Set<String> allReachable = new HashSet<>();
        Queue<String> queue = new LinkedList<>(branchStartNodes);
        while (!queue.isEmpty()) {
            String uuid = queue.poll();
            if (allReachable.contains(uuid)) continue;
            allReachable.add(uuid);
            List<LlmWorkflowEdge> out = edgesBySource.get(uuid);
            if (out != null) {
                for (LlmWorkflowEdge e : out) {
                    if (!allReachable.contains(e.getTargetNodeUuid())) {
                        queue.add(e.getTargetNodeUuid());
                    }
                }
            }
        }

        // Among reachable nodes, find merge nodes (nodes with multiple incoming edges
        // where at least 2 come from different branch paths)
        for (String uuid : allReachable) {
            List<LlmWorkflowEdge> inEdges = edgesByTarget.get(uuid);
            if (inEdges != null && inEdges.size() > 1) {
                long fromBranches = inEdges.stream()
                        .filter(e -> allReachable.contains(e.getSourceNodeUuid())
                                || branchStartNodes.contains(e.getSourceNodeUuid()))
                        .count();
                if (fromBranches > 1) {
                    return uuid;
                }
            }
        }

        // No merge node found - check for end nodes among reachable
        for (String uuid : allReachable) {
            LlmWorkflowNode node = nodeMap.get(uuid);
            if (node != null && WfNodeTypeEnum.END.getValue().equalsIgnoreCase(node.getNodeType())) {
                return uuid;
            }
        }

        return null;
    }
}
