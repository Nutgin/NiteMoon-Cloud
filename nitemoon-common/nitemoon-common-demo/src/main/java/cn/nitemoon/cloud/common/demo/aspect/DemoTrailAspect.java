package cn.nitemoon.cloud.common.demo.aspect;

import cn.nitemoon.cloud.common.core.util.IpUtils;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.common.demo.config.DemoTrailProperties;
import cn.nitemoon.cloud.common.demo.constants.DemoConstants;
import cn.nitemoon.cloud.common.security.entity.LoginUser;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

/**
 * Demo模式限流切面
 */
@Slf4j
@Aspect
@RequiredArgsConstructor
public class DemoTrailAspect {

    private final StringRedisTemplate stringRedisTemplate;
    private final DemoTrailProperties properties;

    @Around("@annotation(demoTrail)")
    public Object doAround(ProceedingJoinPoint joinPoint, DemoTrail demoTrail) throws Throwable {
        // 检查是否启用demo模式
        if (!properties.isEnabled()) {
            return joinPoint.proceed();
        }

        // 检查当前用户是否为admin，admin用户跳过校验
        LoginUser loginUser = SecurityUtils.getUser();
        if (loginUser != null && "admin".equals(loginUser.getUsername())) {
            return joinPoint.proceed();
        }

        // 检查是否为仅查看模式
        if (demoTrail.onlyView()) {
            log.info("Demo模式禁止调用, URI: {}", IpUtils.getHttpServletRequest().getRequestURI());
            // 检查是否为SSE接口
            if (isSseEmitterReturnType(joinPoint)) {
                return createSseLimitEmitter("演示模式资源有限，该功能不支持调用，请本地部署体验");
            }
            throw new CommonBusinessException("演示模式资源有限，该功能不支持调用，请本地部署体验");
        }

        HttpServletRequest request = IpUtils.getHttpServletRequest();
        String ip = IpUtils.getHttpServletRequestIpAddress();
        String uri = request.getRequestURI();

        // 拼接redis key = IP + URI
        String key = DemoConstants.RATE_LIMIT_KEY + ip + ":" + uri;

        // 获取当天剩余秒数
        long secondsUntilMidnight = getSecondsUntilMidnight();

        // 获取当前访问次数
        Long count = stringRedisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            // 首次访问，设置过期时间
            stringRedisTemplate.expire(key, secondsUntilMidnight, TimeUnit.SECONDS);
        }

        // 检查是否超过限制
        if (count != null && count > properties.getMaxCount()) {
            log.info("Demo模式限流拦截, IP: {}, URI: {}, 当前次数: {}", ip, uri, count);
            // 检查是否为SSE接口
            if (isSseEmitterReturnType(joinPoint)) {
                return createSseLimitEmitter("您好，当前为演示模式，该方法调用次数已达今日上限");
            }
            throw new CommonBusinessException("您好，当前为演示模式，该方法调用次数已达今日上限");
        }

        // 继续执行目标方法
        return joinPoint.proceed();
    }

    /**
     * 判断方法返回类型是否为SseEmitter
     */
    private boolean isSseEmitterReturnType(ProceedingJoinPoint joinPoint) {
        try {
            String methodName = joinPoint.getSignature().getName();
            Class<?>[] parameterTypes = ((org.aspectj.lang.reflect.MethodSignature) joinPoint.getSignature()).getParameterTypes();
            Method method = joinPoint.getTarget().getClass().getMethod(methodName, parameterTypes);
            return SseEmitter.class.isAssignableFrom(method.getReturnType());
        } catch (NoSuchMethodException e) {
            log.warn("无法获取方法信息: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 创建限流SSE发射器
     */
    private SseEmitter createSseLimitEmitter(String message) {
        // 设置关键响应头
        jakarta.servlet.http.HttpServletResponse response = ((org.springframework.web.context.request.ServletRequestAttributes)
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getResponse();
        if (response != null) {
            response.setHeader("Cache-Control", "no-cache");
            response.setHeader("Connection", "keep-alive");
            response.setHeader("X-Accel-Buffering", "no");
            response.setHeader("Content-Type", "text/event-stream;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");

            try {
                // 发送限流提示消息
                String jsonData = "{\"message\":\"" + message + "\",\"usedToken\":null,\"time\":0,\"eventType\":\"token\",\"toolName\":null,\"toolStatus\":null,\"done\":false}";
                String sseData = "data:" + jsonData + "\nevent:message\n\n";
                response.getWriter().write(sseData);

                // 发送结束标记
                String endData = "{\"message\":\"\",\"usedToken\":null,\"time\":0,\"eventType\":\"token\",\"toolName\":null,\"toolStatus\":null,\"done\":true}";
                String sseEnd = "data:" + endData + "\nevent:message\n\n";
                response.getWriter().write(sseEnd);
                response.getWriter().flush();
            } catch (Exception e) {
                log.error("发送SSE限流消息失败: {}", e.getMessage());
            }
        }

        return new SseEmitter();
    }

    /**
     * 获取当天剩余秒数
     */
    private long getSecondsUntilMidnight() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime midnight = now.toLocalDate().plusDays(1).atStartOfDay();
        return ChronoUnit.SECONDS.between(now, midnight);
    }

}
