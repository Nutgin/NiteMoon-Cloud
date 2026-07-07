package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import cn.nitemoon.cloud.llm.workflow.tools.ToolRegistry;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 内置工具节点基类，统一工具加载模式
 *
 * @author hetao
 */
@Slf4j
public abstract class AbstractToolWfNode extends AbstractLlmWfNode {

    protected final ToolRegistry toolRegistry;

    protected AbstractToolWfNode(LlmWorkflowNode node, ToolRegistry toolRegistry) {
        super(node);
        this.toolRegistry = toolRegistry;
    }

    /**
     * 返回在 ToolRegistry 中注册的工具名称
     */
    protected abstract String getToolName();

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        List<Object> toolObjects = new ArrayList<>();
        Object tool = toolRegistry.getTool(getToolName());
        if (tool != null) {
            toolObjects.add(tool);
            log.info("{}节点加载了 {} 工具", getClass().getSimpleName(), getToolName());
        } else {
            log.warn("{}节点未找到 {} 内置工具", getClass().getSimpleName(), getToolName());
        }
        WfNodeResult result = new WfNodeResult(getInputText(inputParams, req));
        result.putMetadata("tools", toolObjects);
        return result;
    }
}
