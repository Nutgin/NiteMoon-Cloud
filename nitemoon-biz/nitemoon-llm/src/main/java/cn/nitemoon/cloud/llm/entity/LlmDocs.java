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
@TableName("llm_docs")
public class LlmDocs implements Serializable {
    private static final long serialVersionUID = 548724967827903685L;

    @TableId(type = IdType.ASSIGN_UUID)
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
