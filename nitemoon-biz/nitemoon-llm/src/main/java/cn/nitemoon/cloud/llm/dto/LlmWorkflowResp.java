package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class LlmWorkflowResp {
    private Long id;
    private String uuid;
    private String appId;
    private String title;
    private String remark;
    private List<LlmWfNodeDto> nodes;
    private List<LlmWfEdgeReq> edges;
    private Date createTime;
    private Date updateTime;
}
