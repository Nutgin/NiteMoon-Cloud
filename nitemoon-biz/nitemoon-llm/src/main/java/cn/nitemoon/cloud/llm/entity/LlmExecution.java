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
public class LlmExecution implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String appId;
    private String conversationId;
    private String userId;
    private String userName;
    private String requestMessage;
    private String responseMessage;
    private String status;
    private String errorMessage;
    private Integer totalInputTokens;
    private Integer totalOutputTokens;
    private Long totalDuration;
    private String executionPath;
    private String triggerType;
    private Date createTime;
    private Date updateTime;
}
