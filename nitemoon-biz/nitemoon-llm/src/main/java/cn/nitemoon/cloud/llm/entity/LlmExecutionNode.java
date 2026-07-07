package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName
@Accessors(chain = true)
public class LlmExecutionNode implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String executionId;
    private String nodeUuid;
    private String nodeType;
    private String nodeTitle;
    private String inputParams;
    private String outputParams;
    private String outputText;
    private String logs;
    private String status;
    private String errorMessage;
    private Integer inputTokens;
    private Integer outputTokens;
    private Long duration;
    private Integer sortOrder;
    private Date createTime;
}
