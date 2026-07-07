package cn.nitemoon.cloud.llm.workflow.node;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.config.ChatProps;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.dto.FileContent;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import cn.nitemoon.cloud.llm.service.impl.PersistentChatMemoryStore;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import dev.langchain4j.data.message.*;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.output.TokenUsage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 多模态执行辅助类，封装文件内容构建和流式生成逻辑
 *
 * @author hetao
 */
@Slf4j
public final class MultimodalExecutor {

    private MultimodalExecutor() {
    }

    /**
     * 构建多模态消息内容列表
     */
    public static List<Content> buildContents(String messageText, List<FileContent> files) {
        List<Content> contents = new ArrayList<>();
        if (StrUtil.isNotBlank(messageText)) {
            contents.add(TextContent.from(messageText));
        }

        if (files != null && !files.isEmpty()) {
            for (FileContent file : files) {
                if (StrUtil.isBlank(file.getUrl())) {
                    log.warn("跳过空URL文件: {}", file.getName());
                    continue;
                }
                switch (file.getType()) {
                    case "image":
                        contents.add(ImageContent.from(file.getUrl()));
                        log.info("添加图片内容: {}", file.getName());
                        break;
                    case "audio":
                        contents.add(AudioContent.from(file.getUrl()));
                        log.info("添加音频内容: {}", file.getName());
                        break;
                    case "video":
                        contents.add(VideoContent.from(file.getUrl()));
                        log.info("添加视频内容: {}", file.getName());
                        break;
                    default:
                        log.warn("不支持的文件类型: {}, 文件: {}", file.getType(), file.getName());
                }
            }
        }
        return contents;
    }

    /**
     * 构建带记忆的聊天消息列表
     */
    public static List<ChatMessage> buildMessagesWithMemory(UserMessage userMessage, String conversationId,
                                                            ChatProps chatProps, ChatReq req,
                                                            LlmMessageMapper messageMapper,
                                                            RedisTemplate<String, Object> redisTemplate) {
        return buildMessagesWithMemory(userMessage, conversationId, chatProps, req, messageMapper, redisTemplate, null);
    }

    /**
     * 构建带记忆的聊天消息列表（支持系统指令）
     */
    public static List<ChatMessage> buildMessagesWithMemory(UserMessage userMessage, String conversationId,
                                                            ChatProps chatProps, ChatReq req,
                                                            LlmMessageMapper messageMapper,
                                                            RedisTemplate<String, Object> redisTemplate,
                                                            String systemPrompt) {
        int memorySize = Boolean.TRUE.equals(req.getEnableMemory())
                ? (req.getMemoryWindowSize() != null ? req.getMemoryWindowSize() : chatProps.getMemoryMaxMessage())
                : 0;

        MessageWindowChatMemory memory = MessageWindowChatMemory.builder()
                .id(conversationId)
                .chatMemoryStore(new PersistentChatMemoryStore(messageMapper, redisTemplate, memorySize))
                .maxMessages(memorySize)
                .build();

        List<ChatMessage> messages = new ArrayList<>();
        // 系统指令放在最前面，确保最高优先级
        if (StrUtil.isNotBlank(systemPrompt)) {
            messages.add(SystemMessage.from(systemPrompt));
        }
        messages.addAll(memory.messages());
        messages.add(userMessage);
        memory.add(userMessage);

        log.info("多模态记忆: 历史消息{}条, 总消息{}条", messages.size() - 1, messages.size());
        return messages;
    }

    /**
     * 使用流式模型生成回复，并通过 emitter 推送 token
     */
    public static WfNodeResult executeStreamingGeneration(StreamingChatLanguageModel model,
                                                          List<ChatMessage> messages,
                                                          StreamEmitter emitter,
                                                          String nodeLabel) {
        AtomicReference<StringBuilder> outputRef = new AtomicReference<>(new StringBuilder());
        AtomicReference<TokenUsage> tokenUsageRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Throwable> errorRef = new AtomicReference<>();

        model.generate(messages, new StreamingResponseHandler<AiMessage>() {
            @Override
            public void onNext(String token) {
                outputRef.get().append(token);
                if (emitter != null) {
                    emitter.send(new ChatRes(token));
                }
            }

            @Override
            public void onComplete(Response<AiMessage> response) {
                log.info("{}执行完成", nodeLabel);
                tokenUsageRef.set(response.tokenUsage());
                latch.countDown();
            }

            @Override
            public void onError(Throwable error) {
                log.error("{}执行出错: {}", nodeLabel, error.getMessage());
                errorRef.set(error);
                latch.countDown();
            }
        });

        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(nodeLabel + "执行被中断", e);
        }

        if (errorRef.get() != null) {
            throw new RuntimeException(nodeLabel + "执行出错: " + errorRef.get().getMessage(), errorRef.get());
        }

        TokenUsage usage = tokenUsageRef.get();
        int inputTokens = (usage != null && usage.inputTokenCount() != null) ? usage.inputTokenCount() : 0;
        int outputTokens = (usage != null && usage.outputTokenCount() != null) ? usage.outputTokenCount() : 0;
        log.info("{}token统计, input: {}, output: {}", nodeLabel, inputTokens, outputTokens);

        String output = outputRef.get().toString();
        WfNodeResult result = new WfNodeResult(output, inputTokens, outputTokens);
        result.putOutputParam("llm_output", output);
        result.putOutputParam("input_tokens", inputTokens);
        result.putOutputParam("output_tokens", outputTokens);
        return result;
    }
}
