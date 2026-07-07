package cn.nitemoon.cloud.common.sse.listener;

import cn.hutool.core.collection.CollUtil;
import lombok.extern.slf4j.Slf4j;
import cn.nitemoon.cloud.common.sse.core.SseEmitterManager;
import cn.nitemoon.cloud.common.sse.dto.SseMessageDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;

/**
 * SSE主题订阅监听器
 *
 * @author hetao
 */
@Slf4j
public class SseTopicListener implements ApplicationRunner, Ordered {

    @Autowired
    private SseEmitterManager sseEmitterManager;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        sseEmitterManager.subscribeMessage((message) -> {
            log.info("SSE主题订阅收到消息session keys={} message={}", message.getUserIds(), message.getMessage());
            // 如果key不为空就按照key发消息 如果为空就群发
            if (CollUtil.isNotEmpty(message.getUserIds())) {
                message.getUserIds().forEach(key -> {
                    sseEmitterManager.sendMessage(key, message.getMessage());
                });
            } else {
                sseEmitterManager.sendMessage(message.getMessage());
            }
        });
        log.info("初始化SSE主题订阅监听器成功");
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
