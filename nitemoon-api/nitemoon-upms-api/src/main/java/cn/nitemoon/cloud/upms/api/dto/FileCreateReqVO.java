package cn.nitemoon.cloud.upms.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

@Data
public class FileCreateReqVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "文件配置编号不能为空")
     @Schema(description = "文件配置编号", required = true, example = "11")
    private Long configId;

    @NotNull(message = "文件路径不能为空")
     @Schema(description = "文件路径", required = true, example = "dicp.jpg")
    private String path;

    @NotNull(message = "原文件名不能为空")
     @Schema(description = "原文件名", required = true, example = "dicp.jpg")
    private String name;

    @NotNull(message = "文件 URL不能为空")
     @Schema(description = "文件 URL", required = true, example = "https://www.unicom.cn/dicp.jpg")
    private String url;

     @Schema(description = "文件 MIME 类型", example = "application/octet-stream")
    private String type;

     @Schema(description = "文件大小", example = "2048", required = true)
    private Integer size;

     @Schema(description = "文件ID")
    private Long id;

     @Schema(description = "文件内容")
    private byte[] content;
}
