package cn.nitemoon.cloud.llm.workflow.parallel;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowEdge;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
public class ParallelBranchExecutor {

    private final Map<String, LlmWorkflowNode> nodeMap;
    private final Map<String, List<LlmWorkflowEdge>> edgesBySource;
    private final Map<String, List<LlmWorkflowEdge>> edgesByTarget;

    /**
     * Execute parallel branches and collect results
     */
    public WfNodeResult executeParallelBranches(
            List<LlmWorkflowEdge> outEdges,
            ChatReq mainContext,
            LlmWorkflowNode forkNode,
            BranchExecutor branchExecutor) {

        log.info("开始并行执行 {} 个分支，分叉节点: {}", outEdges.size(), forkNode.getTitle());

        // Send parallel status
        StreamEmitter emitter = mainContext.getEmitter();
        if (emitter != null) {
            emitter.sendParallelStatus(outEdges.size(), 0, "started");
        }

        // Create branch executions
        List<BranchExecution> branches = new ArrayList<>();
        for (LlmWorkflowEdge edge : outEdges) {
            LlmWorkflowNode targetNode = nodeMap.get(edge.getTargetNodeUuid());
            String branchTitle = targetNode != null ? targetNode.getTitle() : edge.getTargetNodeUuid();
            ChatReq branchContext = createBranchContext(mainContext, edge.getTargetNodeUuid(), branchTitle);
            CompletableFuture<WfNodeResult> future = CompletableFuture.supplyAsync(() -> {
                try {
                    return branchExecutor.execute(edge.getTargetNodeUuid(), branchContext);
                } catch (Exception e) {
                    log.error("分支执行失败，起始节点: {}, 错误: {}", edge.getTargetNodeUuid(), e.getMessage());
                    throw new RuntimeException("分支执行失败 [" + edge.getTargetNodeUuid() + "]: " + e.getMessage(), e);
                }
            });
            branches.add(new BranchExecution(edge, branchContext, future));
        }

        // Wait for all branches and collect results
        return collectBranchResults(branches, mainContext, forkNode);
    }

    /**
     * Create isolated context for a branch with branch-aware stream emitter
     */
    private ChatReq createBranchContext(ChatReq original, String branchId, String branchTitle) {
        ChatReq branchReq = new ChatReq();
        branchReq.setAppId(original.getAppId());
        branchReq.setModelId(original.getModelId());
        branchReq.setModelName(original.getModelName());
        branchReq.setModelProvider(original.getModelProvider());
        branchReq.setMessage(original.getMessage());
        branchReq.setConversationId(original.getConversationId());
        branchReq.setUserId(original.getUserId());
        branchReq.setUsername(original.getUsername());
        branchReq.setChatId(original.getChatId());
        branchReq.setPromptText(original.getPromptText());
        branchReq.setDocsName(original.getDocsName());
        branchReq.setKnowledgeId(original.getKnowledgeId());
        branchReq.setKnowledgeIds(new ArrayList<>(original.getKnowledgeIds()));
        branchReq.setDocsId(original.getDocsId());
        branchReq.setUrl(original.getUrl());
        branchReq.setIp(original.getIp());
        branchReq.setRole(original.getRole());
        branchReq.setFiles(new ArrayList<>(original.getFiles()));
        branchReq.setEnableMemory(original.getEnableMemory());
        branchReq.setMemoryWindowSize(original.getMemoryWindowSize());
        branchReq.setPrompt(original.getPrompt());
        branchReq.setExecutor(original.getExecutor());
        // Create branch-aware stream emitter instead of sharing the original
        BranchStreamEmitter branchEmitter = new BranchStreamEmitter(branchId, branchTitle, original.getEmitter());
        branchReq.setEmitter(branchEmitter);
        // Deep copy context
        branchReq.setContext(new HashMap<>(original.getContext()));
        return branchReq;
    }

    /**
     * Wait for all branches and collect results
     */
    private WfNodeResult collectBranchResults(
            List<BranchExecution> branches,
            ChatReq mainContext,
            LlmWorkflowNode forkNode) {

        // Send parallel status - all branches started
        StreamEmitter emitter = mainContext.getEmitter();
        if (emitter != null) {
            emitter.sendParallelStatus(branches.size(), 0, "running");
        }

        // Wait for all branches to complete
        CompletableFuture<Void> allBranches = CompletableFuture.allOf(
            branches.stream()
                .map(BranchExecution::getFuture)
                .toArray(CompletableFuture[]::new)
        );

        try {
            // Wait with timeout (30 minutes)
            allBranches.get(30, TimeUnit.MINUTES);
        } catch (TimeoutException e) {
            cancelAllBranches(branches);
            throw new RuntimeException("并行分支执行超时", e);
        } catch (ExecutionException e) {
            cancelAllBranches(branches);
            Throwable cause = e.getCause();
            throw new RuntimeException("并行分支执行失败: " + cause.getMessage(), cause);
        } catch (InterruptedException e) {
            cancelAllBranches(branches);
            Thread.currentThread().interrupt();
            throw new RuntimeException("并行分支执行被中断", e);
        }

        // Collect results and write to main context
        Map<String, WfNodeResult> branchResults = new HashMap<>();
        int totalInputTokens = 0;
        int totalOutputTokens = 0;
        int completedCount = 0;
        Set<String> modelNames = new LinkedHashSet<>();
        List<LlmMessage> allNodeMessages = new ArrayList<>();

        for (BranchExecution branch : branches) {
            try {
                WfNodeResult result = branch.getFuture().get();
                String branchId = branch.getEdge().getTargetNodeUuid();
                branchResults.put(branchId, result);

                // 使用分支最后一个执行节点的UUID存储输出
                String outputUuid = result.getLastExecutedNodeUuid() != null
                        ? result.getLastExecutedNodeUuid() : branchId;

                // Write branch results to main context
                mainContext.putContext(outputUuid + ".output", result.getOutput());
                if (result.getOutputParams() != null) {
                    result.getOutputParams().forEach((key, value) -> {
                        mainContext.putContext(outputUuid + "." + key, value);
                    });
                }

                totalInputTokens += result.getInputTokens();
                totalOutputTokens += result.getOutputTokens();

                // Collect model names from branch results
                if (cn.hutool.core.util.StrUtil.isNotBlank(result.getModelName())) {
                    modelNames.add(result.getModelName());
                }

                // Collect node messages from branch results
                if (result.getNodeMessages() != null) {
                    allNodeMessages.addAll(result.getNodeMessages());
                }

                // Send progress update
                completedCount++;
                if (emitter != null) {
                    emitter.sendParallelStatus(branches.size(), completedCount, "progress");
                }
            } catch (Exception e) {
                throw new RuntimeException("获取分支结果失败", e);
            }
        }

        log.info("并行分支执行完成，分叉节点: {}, 分支数: {}", forkNode.getTitle(), branches.size());

        // Send parallel status - all completed
        if (emitter != null) {
            emitter.sendParallelStatus(branches.size(), branches.size(), "completed");
        }

        // Store aggregated stats in context so EndWfNode can access them
        mainContext.putContext("__parallel_total_input_tokens__", totalInputTokens);
        mainContext.putContext("__parallel_total_output_tokens__", totalOutputTokens);
        if (!modelNames.isEmpty()) {
            mainContext.putContext("__parallel_model_names__", String.join(", ", modelNames));
        }

        // Return combined result (actual merge will happen at end node)
        WfNodeResult combinedResult = new WfNodeResult();
        combinedResult.setInputTokens(totalInputTokens);
        combinedResult.setOutputTokens(totalOutputTokens);
        // Merge model names: deduplicate and comma-separate
        if (!modelNames.isEmpty()) {
            combinedResult.setModelName(String.join(", ", modelNames));
        }
        combinedResult.setNodeMessages(allNodeMessages);
        return combinedResult;
    }

    private void cancelAllBranches(List<BranchExecution> branches) {
        for (BranchExecution branch : branches) {
            if (!branch.getFuture().isDone()) {
                branch.getFuture().cancel(true);
            }
        }
    }

    /**
     * Functional interface for branch execution
     */
    @FunctionalInterface
    public interface BranchExecutor {
        WfNodeResult execute(String startNodeUuid, ChatReq branchContext);
    }
}
