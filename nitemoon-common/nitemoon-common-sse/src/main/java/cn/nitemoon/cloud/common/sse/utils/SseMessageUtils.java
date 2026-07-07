package cn.nitemoon.cloud.common.sse.utils;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import cn.nitemoon.cloud.common.sse.core.SseEmitterManager;
import cn.nitemoon.cloud.common.sse.dto.SseEventDto;
import cn.nitemoon.cloud.common.sse.dto.SseMessageDto;
import cn.hutool.extra.spring.SpringUtil;

import java.util.Collections;

/**
 * SSE工具类
 *
 * @author hetao
 */
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class SseMessageUtils {

    private static final Boolean SSE_ENABLE = SpringUtil.getProperty("sse.enabled", Boolean.class, true);
    private static SseEmitterManager MANAGER;

    static {
        if (isEnable() && MANAGER == null) {
            MANAGER = SpringUtil.getBean(SseEmitterManager.class);
        }
    }

    /**
     * 向指定的SSE会话发送消息
     * 通过Redis Pub/Sub广播，确保跨模块消息可达
     *
     * @param userId  要发送消息的用户id
     * @param message 要发送的消息内容
     */
    public static void sendMessage(Long userId, String message) {
        if (!isEnable()) {
            return;
        }
        SseMessageDto dto = new SseMessageDto();
        dto.setMessage(message);
        dto.setUserIds(Collections.singletonList(userId));
        MANAGER.publishMessage(dto);
    }

    /**
     * 本机全用户会话发送消息
     *
     * @param message 要发送的消息内容
     */
    public static void sendMessage(String message) {
        if (!isEnable()) {
            return;
        }
        MANAGER.sendMessage(message);
    }

    /**
     * 发布SSE订阅消息
     *
     * @param sseMessageDto 要发布的SSE消息对象
     */
    public static void publishMessage(SseMessageDto sseMessageDto) {
        if (!isEnable()) {
            return;
        }
        MANAGER.publishMessage(sseMessageDto);
    }

    /**
     * 向所有的用户发布订阅的消息(群发)
     *
     * @param message 要发布的消息内容
     */
    public static void publishAll(String message) {
        if (!isEnable()) {
            return;
        }
        MANAGER.publishAll(message);
    }

    /**
     * 完成指定用户的SSE连接
     *
     * @param userId     用户ID
     * @param tokenValue 用户token值
     */
    public static void completeConnection(Long userId, String tokenValue) {
        MANAGER.disconnect(userId, tokenValue);
    }

    /**
     * 向指定的SSE会话发送结构化事件
     *
     * @param userId   要发送消息的用户id
     * @param eventDto SSE事件对象
     */
    public static void sendEvent(Long userId, SseEventDto eventDto) {
        if (!isEnable()) {
            return;
        }
        MANAGER.sendEvent(userId, eventDto);
    }

    /**
     * 发送内容事件
     *
     * @param userId  用户ID
     * @param content 内容
     */
    public static void sendContent(Long userId, String content) {
        sendEvent(userId, SseEventDto.content(content));
    }

    /**
     * 发送推理内容事件
     *
     * @param userId           用户ID
     * @param reasoningContent 推理内容
     */
    public static void sendReasoning(Long userId, String reasoningContent) {
        sendEvent(userId, SseEventDto.reasoning(reasoningContent));
    }

    /**
     * 发送完成事件
     *
     * @param userId 用户ID
     */
    public static void sendDone(Long userId) {
        sendEvent(userId, SseEventDto.done());
    }

    /**
     * 发送错误事件
     *
     * @param userId 用户ID
     * @param error  错误信息
     */
    public static void sendError(Long userId, String error) {
        sendEvent(userId, SseEventDto.error(error));
    }

    /**
     * 是否开启
     */
    public static Boolean isEnable() {
        return SSE_ENABLE;
    }
}
