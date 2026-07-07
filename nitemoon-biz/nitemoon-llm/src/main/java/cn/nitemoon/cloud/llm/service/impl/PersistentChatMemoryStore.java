package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.dto.FileContent;
import cn.nitemoon.cloud.common.core.util.JsonUtils;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.type.TypeReference;
import dev.langchain4j.data.message.*;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Chat memory store with Redis cache + DB fallback.
 * Priority: Redis -> DB, and populates Redis on cache miss.
 */
@Slf4j
public class PersistentChatMemoryStore implements ChatMemoryStore {

    private static final String REDIS_KEY_PREFIX = "chat:memory:";
    private static final long CACHE_TTL_HOURS = 72;

    private final LlmMessageMapper messageMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final int maxMessages;

    public PersistentChatMemoryStore(LlmMessageMapper messageMapper,
                                     RedisTemplate<String, Object> redisTemplate,
                                     int maxMessages) {
        this.messageMapper = messageMapper;
        this.redisTemplate = redisTemplate;
        this.maxMessages = maxMessages;
    }

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        String conversationId = memoryId.toString();
        String redisKey = REDIS_KEY_PREFIX + conversationId;

        // 1. 尝试从 Redis 获取
        List<LlmMessage> records = getFromRedis(redisKey);

        // 2. Redis 不足则从 DB 补充
        if (records.size() < maxMessages) {
            log.info("Redis缓存不足({}/{}), 从DB加载, conversationId: {}", records.size(), maxMessages, conversationId);
            records = loadFromDbAndCache(conversationId, redisKey);
        } else {
            log.debug("从Redis加载记忆, conversationId: {}, 条数: {}", conversationId, records.size());
        }

        return convertToChatMessages(records, conversationId);
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        // No-op: messages are persisted by AiChatServiceImpl.saveMessage()
    }

    @Override
    public void deleteMessages(Object memoryId) {
        String conversationId = memoryId.toString();
        // 删除 DB
        messageMapper.delete(
                Wrappers.<LlmMessage>lambdaQuery()
                        .eq(LlmMessage::getConversationId, conversationId));
        // 删除 Redis 缓存
        String redisKey = REDIS_KEY_PREFIX + conversationId;
        redisTemplate.delete(redisKey);
        log.info("清除记忆缓存, conversationId: {}", conversationId);
    }

    /**
     * 将新消息追加到 Redis 缓存（由 AiChatServiceImpl.saveMessage 调用）
     */
    public static void appendToCache(RedisTemplate<String, Object> redisTemplate,
                                     LlmMessage message) {
        if (message == null || message.getConversationId() == null) return;
        String redisKey = REDIS_KEY_PREFIX + message.getConversationId();
        try {
            ListOperations<String, Object> listOps = redisTemplate.opsForList();
            listOps.rightPush(redisKey, message);
            redisTemplate.expire(redisKey, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("写入记忆缓存失败: conversationId={}, error={}", message.getConversationId(), e.getMessage());
        }
    }

    /**
     * 清除指定会话的 Redis 缓存（由 ChatEndpoint.cleanMessage 调用）
     */
    public static void cleanCache(RedisTemplate<String, Object> redisTemplate, String conversationId) {
        String redisKey = REDIS_KEY_PREFIX + conversationId;
        redisTemplate.delete(redisKey);
    }

    private List<LlmMessage> getFromRedis(String redisKey) {
        try {
            ListOperations<String, Object> listOps = redisTemplate.opsForList();
            Long size = listOps.size(redisKey);
            if (size == null || size == 0) {
                return Collections.emptyList();
            }
            // 取最后 maxMessages 条
            long start = Math.max(0, size - maxMessages);
            List<Object> objects = listOps.range(redisKey, start, size - 1);
            if (objects == null || objects.isEmpty()) {
                return Collections.emptyList();
            }
            List<LlmMessage> result = new ArrayList<>();
            for (Object obj : objects) {
                if (obj instanceof LlmMessage) {
                    result.add((LlmMessage) obj);
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("从Redis加载记忆失败: error={}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<LlmMessage> loadFromDbAndCache(String conversationId, String redisKey) {
        List<LlmMessage> records = messageMapper.selectList(
                Wrappers.<LlmMessage>lambdaQuery()
                        .eq(LlmMessage::getConversationId, conversationId)
                        .orderByAsc(LlmMessage::getCreateTime)
                        .last("LIMIT " + maxMessages));

        // 回写 Redis
        if (!records.isEmpty()) {
            try {
                // 先清空旧缓存，再批量写入
                redisTemplate.delete(redisKey);
                ListOperations<String, Object> listOps = redisTemplate.opsForList();
                for (LlmMessage record : records) {
                    listOps.rightPush(redisKey, record);
                }
                redisTemplate.expire(redisKey, CACHE_TTL_HOURS, TimeUnit.HOURS);
                log.info("记忆缓存已建立, conversationId: {}, 条数: {}", conversationId, records.size());
            } catch (Exception e) {
                log.warn("写入记忆缓存失败: conversationId={}, error={}", conversationId, e.getMessage());
            }
        }

        return records;
    }

    private List<ChatMessage> convertToChatMessages(List<LlmMessage> records, String conversationId) {
        List<ChatMessage> messages = new ArrayList<>();
        for (LlmMessage record : records) {
            if ("assistant".equals(record.getRole())) {
                String text = record.getMessage() != null ? record.getMessage() : "";
                messages.add(new AiMessage(text));
            } else {
                List<Content> contents = new ArrayList<>();
                String text = record.getMessage() != null ? record.getMessage() : "";
                contents.add(TextContent.from(text));

                if (StrUtil.isNotBlank(record.getFiles())) {
                    try {
                        List<FileContent> files = JsonUtils.parseObject(record.getFiles(),
                                new TypeReference<List<FileContent>>() {});
                        if (files != null) {
                            for (FileContent file : files) {
                                if (StrUtil.isBlank(file.getUrl())) continue;
                                switch (file.getType()) {
                                    case "image":
                                        contents.add(ImageContent.from(file.getUrl()));
                                        break;
                                    case "audio":
                                        contents.add(AudioContent.from(file.getUrl()));
                                        break;
                                    case "video":
                                        contents.add(VideoContent.from(file.getUrl()));
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("解析消息附件失败: conversationId={}, error={}", conversationId, e.getMessage());
                    }
                }
                messages.add(UserMessage.from(contents));
            }
        }
        return messages;
    }
}
