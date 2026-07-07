package cn.nitemoon.cloud.llm.api.dto;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@Accessors(chain = true)
public class LlmDocsDTO implements Serializable {
    private static final long serialVersionUID = 548724967827903686L;

    private String id;
    private String knowledgeId;
    private String name;
    private String type;
    private String origin;
    private String url;
    private Long size;
    private Integer sliceNum;
    private Boolean sliceStatus;
    private String content;
    private Date createTime;
}
