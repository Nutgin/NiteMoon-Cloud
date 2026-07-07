package cn.nitemoon.cloud.upms.api.dto;

import cn.nitemoon.cloud.common.storage.core.client.FileClientConfig;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FileConfigRespVO {

     @Schema(description = "编号", required = true, example = "1")
    private Long id;

     @Schema(description = "配置名", required = true, example = "S3 - 阿里云")
    private String name;

     @Schema(description = "存储器，参见 FileStorageEnum 枚举类", required = true, example = "1")
    private Integer storage;

     @Schema(description = "是否为主配置", required = true, example = "true")
    private Boolean master;

     @Schema(description = "存储配置", required = true)
    private FileClientConfig config;

     @Schema(description = "备注", example = "我是备注")
    private String remark;

     @Schema(description = "创建时间", required = true)
    private LocalDateTime createTime;

}
