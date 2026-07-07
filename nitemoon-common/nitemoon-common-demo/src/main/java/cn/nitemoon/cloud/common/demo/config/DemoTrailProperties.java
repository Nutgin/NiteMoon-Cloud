package cn.nitemoon.cloud.common.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Demo模式配置属性
 */
@Data
@ConfigurationProperties(prefix = "demo.trail")
public class DemoTrailProperties {

    /**
     * 是否启用demo模式
     */
    private boolean enabled = false;

    /**
     * 每日调用次数上限
     */
    private int maxCount = 3;

}
