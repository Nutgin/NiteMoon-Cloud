package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.workflow.tools.ToolRegistry;

/**
 * HTTP请求工具节点
 *
 * @author hetao
 */
public class HttpRequestToolWfNode extends AbstractToolWfNode {

    public HttpRequestToolWfNode(LlmWorkflowNode node, ToolRegistry toolRegistry) {
        super(node, toolRegistry);
    }

    @Override
    protected String getToolName() {
        return "HTTP_REQUEST";
    }
}
