package cn.nitemoon.cloud.llm.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * @author hetao
 * @date 2025/6/26
 */
@Data
@Accessors(chain = true)
@Schema(description = "多模态文件内容")
public class FileContent {

    @Schema(description = "变量名称，对应开始节点的用户输入变量名")
    private String variableName;

    @Schema(description = "文件类型: image, audio, video")
    private String type;

    @Schema(description = "文件URL（上传后的访问地址或base64 data URL）")
    private String url;

    @Schema(description = "原始文件名")
    private String name;

    @Schema(description = "MIME类型，如 image/png, audio/mp3")
    private String mimeType;
}
