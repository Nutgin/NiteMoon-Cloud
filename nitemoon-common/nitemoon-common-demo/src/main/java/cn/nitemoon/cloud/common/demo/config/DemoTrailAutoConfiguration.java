package cn.nitemoon.cloud.common.demo.config;

import cn.nitemoon.cloud.common.demo.aspect.DemoTrailAspect;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Demo模式自动配置
 */
@AutoConfiguration
@ConditionalOnProperty(prefix = "demo.trail", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(DemoTrailProperties.class)
public class DemoTrailAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public DemoTrailAspect demoTrailAspect(StringRedisTemplate stringRedisTemplate,
                                           DemoTrailProperties properties) {
        return new DemoTrailAspect(stringRedisTemplate, properties);
    }

}
