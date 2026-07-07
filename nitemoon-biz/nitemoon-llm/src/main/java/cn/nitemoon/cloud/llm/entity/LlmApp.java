package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

/**
 * @author hetao
 * @date 2025/7/26
 */
@Data
@TableName
@Accessors(chain = true)
public class LlmApp implements Serializable {
    private static final long serialVersionUID = -94917153262781949L;

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String name;
    private String cover;
    private String des;

    private String workflowUuid;

    /**
     * 是否启用web页面
     */
    private Boolean enableWebPage;

    /**
     * Web页面访问密钥
     */
    private String webPageKey;

    /**
     * 是否开启记忆
     */
    private Boolean enableMemory;

    /**
     * 记忆窗口大小
     */
    private Integer memoryWindowSize;

    private Date saveTime;
    private Date createTime;
}
