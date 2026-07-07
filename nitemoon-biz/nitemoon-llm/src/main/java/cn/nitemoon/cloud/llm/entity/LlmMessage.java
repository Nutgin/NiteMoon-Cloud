

package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

/**
 * @author hetao
 * @date 2025/1/4
 */
@Data
@Accessors(chain = true)
public class LlmMessage implements Serializable {

    private static final long serialVersionUID = -19545329638997333L;

    /**
     * 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 消息ID
     */
    private String chatId;

    /**
     * 会话ID
     */
    private String conversationId;

    /**
     * 用户ID
     */
    private String userId;
    /**
     * 用户名
     */
    private String username;

    /**
     * 请求IP
     */
    private String ip;

    @TableField("tokens")
    private Integer completionTokens;
    private Integer promptTokens;

    /**
     * 角色，user、assistant
     */
    private String role;

    /**
     * 模型名称
     */
    private String modelName;

    /**
     * 应用ID
     */
    private String appId;

    /**
     * 消息内容
     */
    private String message;

    /**
     * 附件文件列表（JSON格式）
     */
    private String files;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

}

