package cn.nitemoon.cloud.llm.api.dto;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@Accessors(chain = true)
public class LlmDocsSliceDTO implements Serializable {
    private static final long serialVersionUID = -3093489071059867066L;

    private String id;
    private String vectorId;
    private String docsId;
    private String knowledgeId;
    private String name;
    private String content;
    private Integer wordNum;
    private Boolean status;
    /** 元数据JSON */
    private String metadata;
    /** 分块序号 */
    private Integer chunkIndex;
    private Date createTime;
}
