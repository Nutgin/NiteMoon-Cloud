package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("llm_workflow")
@Accessors(chain = true)
public class LlmWorkflow implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String uuid;

    private String appId;
    private String title;
    private String remark;
    private Boolean isEnable;
    private Boolean isDeleted;
    private Date createTime;
    private Date updateTime;
}
