package cn.nitemoon.cloud.llm.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @author hetao
 * @date 2025/11/16
 */
@Configuration
@EnableConfigurationProperties({
        ChatProps.class,
})
public class CommonAiAutoConfiguration {
}
