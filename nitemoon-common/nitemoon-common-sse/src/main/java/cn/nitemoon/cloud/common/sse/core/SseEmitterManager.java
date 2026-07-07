package cn.nitemoon.cloud.common.sse.core;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.map.MapUtil;
import cn.hutool.json.JSONUtil;
import cn.nitemoon.cloud.common.core.util.SpringUtils;
import lombok.extern.slf4j.Slf4j;
import cn.nitemoon.cloud.common.sse.dto.SseEventDto;
import cn.nitemoon.cloud.common.sse.dto.SseMessageDto;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * 管理Server-Sent Events (SSE)连接
 *
 * @author hetao
 */
@Slf4j
public class SseEmitterManager {

    /**
     * 订阅的频道
     */
    private static final String SSE_TOPIC = "global:sse";

    private static final Map<Long, Map<String, SseEmitter>> USER_TOKEN_EMITTERS = new ConcurrentHashMap<>();

    public SseEmitterManager() {
        // 定时执行SSE心跳检测
        SpringUtils.getBean(ScheduledExecutorService.class)
                .scheduleWithFixedDelay(this::sseMonitor, 60L, 60L, TimeUnit.SECONDS);
    }

    /**
     * 建立与指定用户的SSE连接
     *
     * @param userId 用户的唯一标识符，用于区分不同用户的连接
     * @param token  用户的唯一令牌，用于识别具体的连接
     * @return 返回一个SseEmitter实例，客户端可以通过该实例接收SSE事件
     */
    public SseEmitter connect(Long userId, String token) {
        Map<String, SseEmitter> emitters = USER_TOKEN_EMITTERS.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());

        // 关闭已存在的SseEmitter，防止超过最大连接数
        SseEmitter oldEmitter = emitters.remove(token);
        if (oldEmitter != null) {
            oldEmitter.complete();
        }

        // 创建一个新的SseEmitter实例，超时时间设置为一天
        SseEmitter emitter = new SseEmitter(86400000L);

        emitters.put(token, emitter);

        // 当emitter完成、超时或发生错误时，从映射表中移除对应的token
        emitter.onCompletion(() -> {
            SseEmitter remove = emitters.remove(token);
            if (remove != null) {
                remove.complete();
            }
        });
        emitter.onTimeout(() -> {
            SseEmitter remove = emitters.remove(token);
            if (remove != null) {
                remove.complete();
            }
        });
        emitter.onError((e) -> {
            SseEmitter remove = emitters.remove(token);
            if (remove != null) {
                remove.complete();
            }
        });

        try {
            // 向客户端发送一条连接成功的事件
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException e) {
            emitters.remove(token);
        }
        return emitter;
    }

    /**
     * 断开指定用户的SSE连接
     *
     * @param userId 用户的唯一标识符，用于区分不同用户的连接
     * @param token  用户的唯一令牌，用于识别具体的连接
     */
    public void disconnect(Long userId, String token) {
        if (userId == null || token == null) {
            return;
        }
        Map<String, SseEmitter> emitters = USER_TOKEN_EMITTERS.get(userId);
        if (MapUtil.isNotEmpty(emitters)) {
            try {
                SseEmitter sseEmitter = emitters.get(token);
                sseEmitter.send(SseEmitter.event().comment("disconnected"));
            } catch (Exception exception) {
                log.error(exception.getMessage());
            }
            emitters.remove(token);
        } else {
            USER_TOKEN_EMITTERS.remove(userId);
        }
    }

    /**
     * SSE心跳检测，关闭无效连接
     */
    public void sseMonitor() {
        final SseEmitter.SseEventBuilder heartbeat = SseEmitter.event().comment("heartbeat");
        List<Long> toRemoveUsers = new ArrayList<>();

        USER_TOKEN_EMITTERS.forEach((userId, emitterMap) -> {
            if (CollUtil.isEmpty(emitterMap)) {
                toRemoveUsers.add(userId);
                return;
            }

            emitterMap.entrySet().removeIf(entry -> {
                try {
                    entry.getValue().send(heartbeat);
                    return false;
                } catch (Exception ex) {
                    try {
                        entry.getValue().complete();
                    } catch (Exception ignore) {
                    }
                    return true;
                }
            });

            if (emitterMap.isEmpty()) {
                toRemoveUsers.add(userId);
            }
        });

        toRemoveUsers.forEach(USER_TOKEN_EMITTERS::remove);
    }

    /**
     * 订阅SSE消息主题，并提供一个消费者函数来处理接收到的消息
     *
     * @param consumer 处理SSE消息的消费者函数
     */
    public void subscribeMessage(Consumer<SseMessageDto> consumer) {
        RedisTemplate<String, Object> redisTemplate = SpringUtils.getBean(RedisTemplate.class);
        RedisMessageListenerContainer container = SpringUtils.getBean(RedisMessageListenerContainer.class);

        // 创建消息监听器
        MessageListener listener = new MessageListener() {
            @Override
            public void onMessage(Message message, byte[] pattern) {
                try {
                    // 反序列化消息
                    Object messageObj = redisTemplate.getValueSerializer().deserialize(message.getBody());
                    if (messageObj instanceof SseMessageDto) {
                        consumer.accept((SseMessageDto) messageObj);
                    }
                } catch (Exception e) {
                    log.error("处理SSE订阅消息失败: {}", e.getMessage(), e);
                }
            }
        };

        // 订阅频道
        container.addMessageListener(listener, new ChannelTopic(SSE_TOPIC));
    }

    /**
     * 向指定的用户会话发送消息
     *
     * @param userId  要发送消息的用户id
     * @param message 要发送的消息内容
     */
    public void sendMessage(Long userId, String message) {
        Map<String, SseEmitter> emitters = USER_TOKEN_EMITTERS.get(userId);
        if (MapUtil.isNotEmpty(emitters)) {
            for (Map.Entry<String, SseEmitter> entry : emitters.entrySet()) {
                try {
                    SseEventDto eventDto = SseEventDto.content(message);
                    entry.getValue().send(SseEmitter.event()
                            .name("message")
                            .data(JSONUtil.toJsonStr(eventDto)));
                } catch (Exception e) {
                    SseEmitter remove = emitters.remove(entry.getKey());
                    if (remove != null) {
                        remove.complete();
                    }
                }
            }
        } else {
            USER_TOKEN_EMITTERS.remove(userId);
        }
    }

    /**
     * 向指定的用户会话发送结构化事件
     *
     * @param userId    要发送消息的用户id
     * @param eventDto  SSE事件对象
     */
    public void sendEvent(Long userId, SseEventDto eventDto) {
        Map<String, SseEmitter> emitters = USER_TOKEN_EMITTERS.get(userId);
        if (MapUtil.isNotEmpty(emitters)) {
            log.debug("【SSE发送】userId: {}, emitter数量: {}, event: {}", userId, emitters.size(), eventDto.getEvent());
            for (Map.Entry<String, SseEmitter> entry : emitters.entrySet()) {
                try {
                    entry.getValue().send(SseEmitter.event()
                            .name(eventDto.getEvent())
                            .data(JSONUtil.toJsonStr(eventDto)));
                } catch (Exception e) {
                    log.error("【SSE发送失败】userId: {}, token: {}, error: {}", userId, entry.getKey(), e.getMessage());
                    SseEmitter remove = emitters.remove(entry.getKey());
                    if (remove != null) {
                        remove.complete();
                    }
                }
            }
        } else {
            log.warn("【SSE发送失败】userId: {} 没有活跃的SSE连接, 当前连接用户: {}", userId, USER_TOKEN_EMITTERS.keySet());
            USER_TOKEN_EMITTERS.remove(userId);
        }
    }

    /**
     * 本机全用户会话发送消息
     *
     * @param message 要发送的消息内容
     */
    public void sendMessage(String message) {
        for (Long userId : USER_TOKEN_EMITTERS.keySet()) {
            sendMessage(userId, message);
        }
    }

    /**
     * 发布SSE订阅消息
     *
     * @param sseMessageDto 要发布的SSE消息对象
     */
    public void publishMessage(SseMessageDto sseMessageDto) {
        SseMessageDto broadcastMessage = new SseMessageDto();
        broadcastMessage.setMessage(sseMessageDto.getMessage());
        broadcastMessage.setUserIds(sseMessageDto.getUserIds());

        RedisTemplate<String, Object> redisTemplate = SpringUtils.getBean(RedisTemplate.class);
        redisTemplate.convertAndSend(SSE_TOPIC, broadcastMessage);

        log.info("SSE发送主题订阅消息topic:{} session keys:{} message:{}",
                SSE_TOPIC, sseMessageDto.getUserIds(), sseMessageDto.getMessage());
    }

    /**
     * 向所有的用户发布订阅的消息(群发)
     *
     * @param message 要发布的消息内容
     */
    public void publishAll(String message) {
        SseMessageDto broadcastMessage = new SseMessageDto();
        broadcastMessage.setMessage(message);

        RedisTemplate<String, Object> redisTemplate = SpringUtils.getBean(RedisTemplate.class);
        redisTemplate.convertAndSend(SSE_TOPIC, broadcastMessage);

        log.info("SSE发送主题订阅消息topic:{} message:{}", SSE_TOPIC, message);
    }
}
