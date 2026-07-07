package cn.nitemoon.cloud.onnx.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 视频配置类
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "nitemoon.onnx")
public class VideoConfig {

    /**
     * 默认视频文件路径
     */
    private String defaultVideoPath;
}
