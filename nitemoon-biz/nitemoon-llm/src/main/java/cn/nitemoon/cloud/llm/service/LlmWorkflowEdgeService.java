package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.dto.LlmWfEdgeReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowEdge;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

public interface LlmWorkflowEdgeService extends IService<LlmWorkflowEdge> {

    List<LlmWfEdgeReq> listDtoByWorkflowId(Long workflowId);

    List<LlmWorkflowEdge> listByWorkflowId(Long workflowId);

    void createOrUpdateEdges(Long workflowId, List<LlmWfEdgeReq> edges);
}
