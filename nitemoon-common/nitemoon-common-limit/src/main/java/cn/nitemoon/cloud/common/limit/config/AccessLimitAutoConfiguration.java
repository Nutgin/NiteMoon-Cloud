package cn.nitemoon.cloud.common.limit.config;

import cn.nitemoon.cloud.common.limit.aspect.AccessLimitAspect;
import cn.nitemoon.cloud.common.redis.config.RedisTemplateConfiguration;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * HTTP API 签名的自动配置类
 *
 * @author Zhougang
 */
@AutoConfiguration(after = RedisTemplateConfiguration.class)
public class AccessLimitAutoConfiguration {

    private final StringRedisTemplate stringRedisTemplate;

    public AccessLimitAutoConfiguration(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Bean
    public AccessLimitAspect accessLimitAspect() {
        return new AccessLimitAspect(stringRedisTemplate);
    }
}
