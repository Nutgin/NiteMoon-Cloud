package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("llm_workflow_node")
@Accessors(chain = true)
public class LlmWorkflowNode implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String uuid;
    private Long workflowId;
    private String nodeType;
    private String title;
    private String remark;
    private String inputConfig;
    private String nodeConfig;
    private String outputConfig;
    private Double positionX;
    private Double positionY;
    private Boolean isDeleted;
    private Date createTime;
    private Date updateTime;
}
