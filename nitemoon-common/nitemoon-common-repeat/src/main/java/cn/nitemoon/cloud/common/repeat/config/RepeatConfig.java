package cn.nitemoon.cloud.common.repeat.config;

import cn.nitemoon.cloud.common.repeat.aspectj.RepeatSubmitAspect;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConfiguration;
import org.springframework.data.redis.core.RedisTemplate;

/**
 * 幂等功能配置
 *
 * @author Lion Li
 */
@AutoConfiguration(after = RedisConfiguration.class)
@RequiredArgsConstructor
public class RepeatConfig {

    private final RedisTemplate<String, Object> redisTemplate;

    @Bean
    public RepeatSubmitAspect repeatSubmitAspect() {
        return new RepeatSubmitAspect(redisTemplate);
    }

}
