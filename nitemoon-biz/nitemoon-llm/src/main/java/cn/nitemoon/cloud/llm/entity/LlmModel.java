package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;

@Data
@Accessors(chain = true)
@TableName("llm_model")
@Schema(description = "AI模型对象")
public class LlmModel implements Serializable {
    private static final long serialVersionUID = -19545329638997333L;

    @Schema(description= "主键ID")
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @Schema(description= "模型类型")   private String type;
    @Schema(description= "模型标识")   private String model;
    @Schema(description= "模型提供方") private String provider;
    @Schema(description= "模型名称")   private String name;
    @Schema(description= "响应限制")   private Integer responseLimit;
    @Schema(description= "温度参数")   private Double temperature = 0.2;
    @Schema(description= "Top-P参数")  private Double topP = 0.0;
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

    @Schema(description= "MIMO视频抽帧率") private Double fps;
    @Schema(description= "MIMO媒体分辨率") private String mediaResolution;
}
