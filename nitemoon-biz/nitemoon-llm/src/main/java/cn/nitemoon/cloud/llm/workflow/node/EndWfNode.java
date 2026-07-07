package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import cn.nitemoon.cloud.llm.workflow.config.EndNodeOutputConfig;
import cn.nitemoon.cloud.llm.workflow.config.BranchOutputConfig;
import cn.nitemoon.cloud.common.core.util.JsonUtils;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class EndWfNode extends AbstractLlmWfNode {

    public EndWfNode(LlmWorkflowNode node) {
        super(node);
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        // Parse output configuration
        EndNodeOutputConfig config = parseOutputConfig(node.getNodeConfig());

        // Must have output_config
        if (config == null || config.getMode() == null) {
            throw new RuntimeException("结束节点必须配置output_config，节点: " + node.getUuid());
        }

        WfNodeResult result;
        switch (config.getMode()) {
            case "select":
                result = selectBranchOutputs(config, req);
                break;
            case "merge":
                result = mergeBranchOutputs(config, req);
                break;
            case "first":
                result = firstBranchOutput(config, req);
                break;
            default:
                throw new RuntimeException("不支持的输出模式: " + config.getMode());
        }

        // Propagate parallel branch stats (tokens, model names) from context
        propagateParallelStats(result, req);

        // Send merged output as ChatRes (consistent with other nodes)
        if (emitter != null && result.getOutput() != null) {
            emitter.send(new ChatRes(result.getOutput()));
        }

        return result;
    }

    private EndNodeOutputConfig parseOutputConfig(String nodeConfigJson) {
        if (nodeConfigJson == null) {
            return null;
        }
        try {
            Map<String, Object> configMap = JsonUtils.parseObject(nodeConfigJson, Map.class);
            if (configMap != null) {
                Object outputConfig = configMap.get("output_config");
                if (outputConfig != null) {
                    return JsonUtils.parseObject(JsonUtils.toJsonString(outputConfig), EndNodeOutputConfig.class);
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("解析结束节点配置失败: {}", e.getMessage());
            return null;
        }
    }

    private WfNodeResult selectBranchOutputs(EndNodeOutputConfig config, ChatReq req) {
        if (config.getBranchOutputs() == null || config.getBranchOutputs().isEmpty()) {
            throw new RuntimeException("select模式必须配置branch_outputs");
        }

        StringBuilder output = new StringBuilder();
        for (BranchOutputConfig branchConfig : config.getBranchOutputs()) {
            String contextKey = branchConfig.getBranchId() + "." + branchConfig.getParam();
            Object value = req.getContext(contextKey);
            if (value != null) {
                if (output.length() > 0) {
                    output.append("\n");
                }
                String prefix = branchConfig.getAlias() != null ? branchConfig.getAlias() + ": " : "";
                output.append(prefix).append(value.toString());
            }
        }

        return new WfNodeResult(output.toString());
    }

    private WfNodeResult mergeBranchOutputs(EndNodeOutputConfig config, ChatReq req) {
        List<String> outputs = getAllBranchOutputs(req);

        if (outputs.isEmpty()) {
            throw new RuntimeException("没有找到分支输出");
        }

        String merged;
        switch (config.getMergeStrategy()) {
            case "concat":
                merged = String.join("", outputs);
                break;
            case "join":
                String separator = config.getSeparator() != null ? config.getSeparator() : "\n";
                merged = String.join(separator, outputs);
                break;
            case "json_array":
                merged = JsonUtils.toJsonString(outputs);
                break;
            default:
                throw new RuntimeException("不支持的合并策略: " + config.getMergeStrategy());
        }

        return new WfNodeResult(merged);
    }

    private WfNodeResult firstBranchOutput(EndNodeOutputConfig config, ChatReq req) {
        List<String> outputs = getAllBranchOutputs(req);

        if (outputs.isEmpty()) {
            throw new RuntimeException("没有找到分支输出");
        }

        return new WfNodeResult(outputs.get(0));
    }

    @SuppressWarnings("unchecked")
    private void propagateParallelStats(WfNodeResult result, ChatReq req) {
        Map<String, Object> context = req.getContext();
        // Only propagate model name — tokens are already counted by the engine
        // from the parallel branch executor's combined result
        Object modelNames = context.get("__parallel_model_names__");
        if (modelNames instanceof String) {
            result.setModelName((String) modelNames);
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> getAllBranchOutputs(ChatReq req) {
        List<String> outputs = new ArrayList<>();
        Map<String, Object> context = req.getContext();

        // 只收集直接指向End节点的上游节点的输出
        Object upstreamObj = context.get("__end_upstream_uuids__");
        if (upstreamObj instanceof List) {
            List<String> upstreamUuids = (List<String>) upstreamObj;
            for (String uuid : upstreamUuids) {
                Object value = context.get(uuid + ".output");
                if (value != null) {
                    outputs.add(value.toString());
                }
            }
            return outputs;
        }

        // 回退：收集所有 .output 结尾的（排除自身），用于无边信息的场景
        String endOutputKey = node.getUuid() + ".output";
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            String key = entry.getKey();
            if (key.endsWith(".output") && !key.equals(endOutputKey) && entry.getValue() != null) {
                outputs.add(entry.getValue().toString());
            }
        }

        return outputs;
    }
}
