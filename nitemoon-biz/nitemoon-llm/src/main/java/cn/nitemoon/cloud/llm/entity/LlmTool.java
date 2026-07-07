package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

@Data
@Accessors(chain = true)
@TableName("llm_tool")
@Schema(description = "自定义工具对象")
public class LlmTool implements Serializable {
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键ID")
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @Schema(description = "工具名称")
    private String name;

    @Schema(description = "工具描述")
    private String description;

    @Schema(description = "工具类型")
    private String toolType;

    @Schema(description = "参数JSON Schema")
    private String parametersSchema;

    @Schema(description = "HTTP端点URL")
    private String endpointUrl;

    @Schema(description = "HTTP方法")
    private String httpMethod;

    @Schema(description = "自定义请求头JSON")
    private String headers;

    @Schema(description = "是否删除")
    private Boolean isDeleted;

    @Schema(description = "创建时间")
    private Date createTime;

    @Schema(description = "更新时间")
    private Date updateTime;
}
