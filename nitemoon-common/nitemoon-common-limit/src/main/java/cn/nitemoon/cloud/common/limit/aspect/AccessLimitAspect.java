package cn.nitemoon.cloud.common.limit.aspect;

import cn.nitemoon.cloud.common.core.util.IpUtils;
import cn.nitemoon.cloud.common.limit.annotation.AccessLimit;
import cn.nitemoon.cloud.common.limit.constants.RedisLimitConstants;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.concurrent.TimeUnit;

@Slf4j
@Aspect
@RequiredArgsConstructor
public class AccessLimitAspect {

    private final StringRedisTemplate stringRedisTemplate;

    @Around("@annotation(accessLimit)")
    public Object doAround(ProceedingJoinPoint joinPoint, AccessLimit accessLimit) throws Throwable {
        Long time = (long) accessLimit.time();

        HttpServletRequest request = IpUtils.getHttpServletRequest();
        // 拼接redis key = IP + Api限流
        String key = RedisLimitConstants.RATE_LIMIT_KEY + IpUtils.getHttpServletRequestIpAddress() + request.getRequestURI();
        // 获取redis的value
        Integer maxTimes = null;
        Object value = stringRedisTemplate.opsForValue().get(key);
        if (value != null) {
            maxTimes = Integer.parseInt(value.toString());
        }
        if (maxTimes == null) {
            // 如果redis中没有该ip对应的时间则表示第一次调用，保存key到redis
            stringRedisTemplate.opsForValue().set(key,"1",time, TimeUnit.SECONDS);
        } else if (maxTimes < accessLimit.count()) {
            // 如果redis中的时间比注解上的时间小则表示可以允许访问,这是修改redis的value时间
            stringRedisTemplate.opsForValue().set(key, (maxTimes + 1) + "", time, TimeUnit.SECONDS);
        } else {
            // 请求过于频繁
            log.info("API请求限流拦截启动,{} 请求过于频繁", key);
            throw new CommonBusinessException("请求过于频繁,稍后重试");
        }

        // 继续执行目标方法
        return joinPoint.proceed();
    }
}
