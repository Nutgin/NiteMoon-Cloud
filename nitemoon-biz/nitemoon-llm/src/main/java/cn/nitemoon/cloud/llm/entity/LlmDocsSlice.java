package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@Accessors(chain = true)
@TableName("llm_docs_slice")
public class LlmDocsSlice implements Serializable {
    private static final long serialVersionUID = -3093489071059867065L;

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String vectorId;
    private String docsId;
    private String knowledgeId;
    private String name;
    private String content;
    private Integer wordNum;
    private Boolean status = false;
    /**
     * 元数据JSON(标题/关键词/摘要等)
     */
    private String metadata;
    /**
     * 在文档中的分块序号
     */
    private Integer chunkIndex;
    private Date createTime;
}
