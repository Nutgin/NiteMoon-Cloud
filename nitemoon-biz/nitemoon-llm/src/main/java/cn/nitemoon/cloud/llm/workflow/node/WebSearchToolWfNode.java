package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.workflow.tools.ToolRegistry;

/**
 * 网页搜索工具节点
 *
 * @author hetao
 */
public class WebSearchToolWfNode extends AbstractToolWfNode {

    public WebSearchToolWfNode(LlmWorkflowNode node, ToolRegistry toolRegistry) {
        super(node, toolRegistry);
    }

    @Override
    protected String getToolName() {
        return "WEB_SEARCH";
    }
}
