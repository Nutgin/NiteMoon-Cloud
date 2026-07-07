package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.workflow.tools.ToolRegistry;

/**
 * 日期时间工具节点
 *
 * @author hetao
 */
public class DateTimeToolWfNode extends AbstractToolWfNode {

    public DateTimeToolWfNode(LlmWorkflowNode node, ToolRegistry toolRegistry) {
        super(node, toolRegistry);
    }

    @Override
    protected String getToolName() {
        return "DATETIME";
    }
}
