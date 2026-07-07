package cn.nitemoon.cloud.llm.dto;

import dev.langchain4j.model.input.Prompt;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * @author hetao
 * @date 2025/1/6
 */
@Data
@Accessors(chain = true)
@Schema(description = "AI生图请求对象")
public class ImageR {

    @Schema(description= "模型ID")
    private String modelId;
    @Schema(description= "模型名称")
    private String modelName;
    @Schema(description= "模型提供方")
    private String modelProvider;

    @Schema(description= "提示词")
    private Prompt prompt;

    /**
     * 内容
     */
    @Schema(description= "图片内容")
    private String message;

    /**
     * 质量
     */
    @Schema(description= "图片质量")
    private String quality;

    /**
     * 尺寸
     */
    @Schema(description= "图片尺寸")
    private String size;

    /**
     * 风格
     */
    @Schema(description= "图片风格")
    private String style;
}
