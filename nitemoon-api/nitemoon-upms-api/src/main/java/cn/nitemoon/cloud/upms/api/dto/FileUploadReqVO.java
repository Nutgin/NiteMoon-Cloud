package cn.nitemoon.cloud.upms.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class FileUploadReqVO {

     @Schema(description = "文件附件", required = true)
    @NotNull(message = "文件附件不能为空")
    private MultipartFile file;

     @Schema(description = "文件附件", example = "dicpyuanma.png")
    private String path;

}
