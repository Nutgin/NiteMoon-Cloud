package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.dto.LlmWorkflowResp;
import cn.nitemoon.cloud.llm.dto.LlmWorkflowUpdateReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflow;
import com.baomidou.mybatisplus.extension.service.IService;

public interface LlmWorkflowService extends IService<LlmWorkflow> {

    LlmWorkflowResp getDetailByAppId(String appId);

    LlmWorkflowResp getDetailByUuid(String uuid);

    LlmWorkflowResp update(LlmWorkflowUpdateReq req);

    LlmWorkflow createForApp(String appId);
}
