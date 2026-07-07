package cn.nitemoon.cloud.llm.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;

@Data
@Accessors(chain = true)
@Schema(description = "AI模型DTO")
public class LlmModelDTO implements Serializable {
    private static final long serialVersionUID = -19545329638997334L;

    @Schema(description= "主键ID")
    private String id;

    @Schema(description= "模型类型")   private String type;
    @Schema(description= "模型标识")   private String model;
    @Schema(description= "模型提供方") private String provider;
    @Schema(description= "模型名称")   private String name;
    @Schema(description= "响应限制")   private Integer responseLimit;
    @Schema(description= "温度参数")   private Double temperature;
    @Schema(description= "Top-P参数")  private Double topP;
    private String apiKey;
    private String secretKey;
    private String baseUrl;
    private String endpoint;
    private String geminiLocation;
    private String geminiProject;
    private String azureDeploymentName;
    private String imageSize;
    private String imageQuality;
    private String imageStyle;
    private Integer dimension;
}
