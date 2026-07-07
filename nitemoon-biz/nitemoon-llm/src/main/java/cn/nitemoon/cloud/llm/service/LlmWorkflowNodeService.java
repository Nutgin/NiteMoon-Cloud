package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.dto.LlmWfNodeDto;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

public interface LlmWorkflowNodeService extends IService<LlmWorkflowNode> {

    List<LlmWfNodeDto> listDtoByWorkflowId(Long workflowId);

    List<LlmWorkflowNode> listByWorkflowId(Long workflowId);

    void createOrUpdateNodes(Long workflowId, List<LlmWfNodeDto> nodes);

    LlmWorkflowNode getByUuid(Long workflowId, String uuid);
}
