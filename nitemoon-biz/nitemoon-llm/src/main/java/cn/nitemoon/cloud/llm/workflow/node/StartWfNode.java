package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
public class StartWfNode extends AbstractLlmWfNode {

    public StartWfNode(LlmWorkflowNode node) {
        super(node);
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        log.info("Start节点执行, 提取默认输出参数");

        WfNodeResult result = new WfNodeResult(req.getMessage());
        result.putOutputParam("text", req.getMessage());
        result.putOutputParam("files", req.getFiles());
        result.putOutputParam("conversationId", req.getConversationId());
        result.putOutputParam("appId", req.getAppId());

        return result;
    }
}
