package cn.nitemoon.cloud.llm.dto;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class LlmWfNodeDto {
    private Long id;
    private String uuid;
    private Long workflowId;
    private String nodeType;
    private String title;
    private String remark;
    private ObjectNode inputConfig;
    private ObjectNode nodeConfig;
    private ObjectNode outputConfig;
    private Double positionX;
    private Double positionY;
}
