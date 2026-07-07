package cn.nitemoon.cloud.llm.config;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @author hetao
 * @date 2025/05/15
 */
@Slf4j
@Configuration
@EnableConfigurationProperties({
        LlmChatProps.class,
})
@AllArgsConstructor
public class CoreAutoConfiguration {

}
