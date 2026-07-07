package cn.nitemoon.cloud.common.sse.controller;

import cn.dev33.satoken.annotation.SaIgnore;
import cn.dev33.satoken.stp.StpUtil;
import lombok.RequiredArgsConstructor;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import cn.nitemoon.cloud.common.sse.core.SseEmitterManager;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE控制器
 *
 * @author hetao
 */
@RestController
@ConditionalOnProperty(value = "sse.enabled", havingValue = "true")
@RequiredArgsConstructor
public class SseController implements DisposableBean {

    private final SseEmitterManager sseEmitterManager;

    /**
     * 建立SSE连接
     */
    @GetMapping(value = "${sse.path}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect() {
        if (!StpUtil.isLogin()) {
            return null;
        }
        String tokenValue = StpUtil.getTokenValue();
        Long userId = StpUtil.getLoginIdAsLong();
        return sseEmitterManager.connect(userId, tokenValue);
    }

    /**
     * 关闭SSE连接
     */
    @SaIgnore
    @GetMapping(value = "${sse.path}/close")
    public Result<Void> close() {
        String tokenValue = StpUtil.getTokenValue();
        Long userId = StpUtil.getLoginIdAsLong();
        sseEmitterManager.disconnect(userId, tokenValue);
        return Result.success();
    }

    @Override
    public void destroy() throws Exception {
    }
}
