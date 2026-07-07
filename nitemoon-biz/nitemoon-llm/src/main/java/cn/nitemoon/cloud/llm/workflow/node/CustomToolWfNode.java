package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmTool;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.service.LlmToolService;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import cn.nitemoon.cloud.llm.workflow.tools.CustomToolRouter;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class CustomToolWfNode extends AbstractLlmWfNode {

    private final LlmToolService toolService;

    public CustomToolWfNode(LlmWorkflowNode node, LlmToolService toolService) {
        super(node);
        this.toolService = toolService;
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        // nodeConfig 中存储选中的自定义工具 ID 列表: { "toolIds": ["id1", "id2"] }
        Map<String, Object> config = parseNodeConfig(Map.class);
        List<String> toolIds = config != null && config.get("toolIds") instanceof List
                ? (List<String>) config.get("toolIds") : Collections.emptyList();

        Map<String, LlmTool> customToolMap = new HashMap<>();
        if (!toolIds.isEmpty()) {
            List<LlmTool> tools = toolService.list(Wrappers.<LlmTool>lambdaQuery()
                    .in(LlmTool::getId, toolIds)
                    .eq(LlmTool::getIsDeleted, false));
            for (LlmTool tool : tools) {
                customToolMap.put(tool.getName(), tool);
            }
            log.info("CustomTool节点加载了 {} 个自定义工具: {}", customToolMap.size(), customToolMap.keySet());
        }

        List<Object> toolObjects = new ArrayList<>();
        if (!customToolMap.isEmpty()) {
            toolObjects.add(new CustomToolRouter(customToolMap));
        }

        WfNodeResult result = new WfNodeResult(getInputText(inputParams, req));
        result.putMetadata("tools", toolObjects);
        return result;
    }
}
