package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("llm_workflow_edge")
@Accessors(chain = true)
public class LlmWorkflowEdge implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String uuid;
    private Long workflowId;
    private String sourceNodeUuid;
    private String sourceHandle;
    private String targetNodeUuid;
    private Boolean isDeleted;
    private Date createTime;
    private Date updateTime;
}
