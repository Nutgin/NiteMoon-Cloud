package cn.nitemoon.cloud.llm.dto;

import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class LlmWfEdgeReq {
    private Long id;
    private String uuid;
    private Long workflowId;
    private String sourceNodeUuid;
    private String sourceHandle;
    private String targetNodeUuid;
}
