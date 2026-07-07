package cn.nitemoon.cloud.upms.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class FileConfigSaveReqVO {

     @Schema(description = "编号", example = "1")
    private Long id;

     @Schema(description = "配置名", required = true, example = "S3 - 阿里云")
    @NotNull(message = "配置名不能为空")
    private String name;

     @Schema(description = "存储器，参见 FileStorageEnum 枚举类", required = true, example = "1")
    @NotNull(message = "存储器不能为空")
    private Integer storage;

     @Schema(description = "存储配置,配置是动态参数，所以使用 Map 接收", required = true)
    @NotNull(message = "存储配置不能为空")
    private Map<String, Object> config;

     @Schema(description = "备注", example = "我是备注")
    private String remark;

}
