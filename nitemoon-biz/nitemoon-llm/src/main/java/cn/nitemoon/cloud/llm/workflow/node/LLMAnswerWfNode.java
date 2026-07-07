package cn.nitemoon.cloud.llm.workflow.node;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.config.ChatProps;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.dto.FileContent;
import cn.nitemoon.cloud.llm.dto.LLMNodeConfig;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import cn.nitemoon.cloud.llm.provider.ModelProvider;
import cn.nitemoon.cloud.llm.service.Agent;
import cn.nitemoon.cloud.llm.service.impl.PersistentChatMemoryStore;
import org.springframework.data.redis.core.RedisTemplate;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import cn.nitemoon.cloud.llm.workflow.tools.ToolContextHolder;
import dev.langchain4j.data.message.*;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.output.TokenUsage;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.TokenStream;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

/**
 * LLM问答工作流节点
 *
 * @author hetao
 */
@Slf4j
public class LLMAnswerWfNode extends AbstractLlmWfNode {

    private final ModelProvider modelProvider;
    private final ChatProps chatProps;
    private final LlmMessageMapper messageMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    public LLMAnswerWfNode(LlmWorkflowNode node, ModelProvider modelProvider, ChatProps chatProps,
                           LlmMessageMapper messageMapper, RedisTemplate<String, Object> redisTemplate) {
        super(node);
        this.modelProvider = modelProvider;
        this.chatProps = chatProps;
        this.messageMapper = messageMapper;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        LLMNodeConfig config = parseNodeConfig(LLMNodeConfig.class);
        if (config == null || StrUtil.isBlank(config.getModelId())) {
            throw new RuntimeException("LLM节点未配置模型");
        }

        log.info("LLM节点执行, modelId: {}, prompt: {}", config.getModelId(),
                StrUtil.isNotBlank(config.getPrompt()) ? config.getPrompt().substring(0, Math.min(config.getPrompt().length(), 50)) : "无");

        req.setModelName(config.getModelName());
        StreamingChatLanguageModel model = modelProvider.stream(config.getModelId());

        String conversationId = StrUtil.isNotBlank(req.getConversationId())
                ? req.getConversationId()
                : IdUtil.simpleUUID();
        if (StrUtil.isBlank(req.getConversationId())) {
            req.setConversationId(conversationId);
        }

        String inputText = getInputText(inputParams, req);

        // 解析系统指令，作为 SystemMessage 注入，与用户输入分离
        String systemPrompt = null;
        if (StrUtil.isNotBlank(config.getPrompt())) {
            systemPrompt = resolvePrompt(config.getPrompt(), inputParams);
        }

        @SuppressWarnings("unchecked")
        List<Object> tools = req.getContext("tools");
        @SuppressWarnings("unchecked")
        List<FileContent> files = (List<FileContent>) inputParams.get("files");

        ToolContextHolder.setEmitter(emitter);
        ToolContextHolder.setRequest(req);

        try {
            if (files != null && !files.isEmpty()) {
                List<Content> contents = MultimodalExecutor.buildContents(inputText, files);
                UserMessage userMessage = UserMessage.from(contents);
                List<ChatMessage> messages = MultimodalExecutor.buildMessagesWithMemory(
                        userMessage, conversationId, chatProps, req, messageMapper, redisTemplate, systemPrompt);
                return MultimodalExecutor.executeStreamingGeneration(model, messages, emitter, "LLM节点多模态");
            } else {
                return executeText(model, inputText, systemPrompt, conversationId, emitter, req, tools, config);
            }
        } finally {
            ToolContextHolder.clear();
        }
    }

    private WfNodeResult executeText(StreamingChatLanguageModel model, String messageText,
                                     String systemPrompt, String conversationId,
                                     StreamEmitter emitter, ChatReq req, List<Object> tools,
                                     LLMNodeConfig config) {
        int memorySize = Boolean.TRUE.equals(req.getEnableMemory())
                ? (req.getMemoryWindowSize() != null ? req.getMemoryWindowSize() : chatProps.getMemoryMaxMessage())
                : 0;

        MessageWindowChatMemory memory = MessageWindowChatMemory.builder()
                .id(conversationId)
                .chatMemoryStore(new PersistentChatMemoryStore(messageMapper, redisTemplate, memorySize))
                .maxMessages(memorySize)
                .build();

        // 构建消息列表：SystemMessage(系统指令) + 历史记忆 + UserMessage(用户输入)
        List<ChatMessage> messages = new ArrayList<>();
        if (StrUtil.isNotBlank(systemPrompt)) {
            messages.add(SystemMessage.from(systemPrompt));
        }
        messages.addAll(memory.messages());

        UserMessage userMessage = UserMessage.from(messageText);
        messages.add(userMessage);

        // 工具调用需要通过 AiServices，无工具时直接调用模型
        if (tools != null && !tools.isEmpty()) {
            return executeTextWithTools(model, systemPrompt, messageText, tools, emitter, req, config);
        }

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
                log.info("LLM节点执行完成");
                tokenUsageRef.set(response.tokenUsage());
                latch.countDown();
            }

            @Override
            public void onError(Throwable error) {
                log.error("LLM节点执行出错: {}", error.getMessage());
                errorRef.set(error);
                latch.countDown();
            }
        });

        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("LLM节点执行被中断", e);
        }

        if (errorRef.get() != null) {
            throw new RuntimeException("LLM节点执行出错: " + errorRef.get().getMessage(), errorRef.get());
        }

        TokenUsage usage = tokenUsageRef.get();
        int inputTokens = (usage != null && usage.inputTokenCount() != null) ? usage.inputTokenCount() : 0;
        int outputTokens = (usage != null && usage.outputTokenCount() != null) ? usage.outputTokenCount() : 0;
        log.info("LLM节点token统计, input: {}, output: {}", inputTokens, outputTokens);

        String output = outputRef.get().toString();
        // 写入记忆
        memory.add(userMessage);
        memory.add(AiMessage.from(output));

        WfNodeResult result = new WfNodeResult(output, inputTokens, outputTokens);
        result.setModelName(config.getModelName());
        result.putOutputParam("llm_output", output);
        result.putOutputParam("input_tokens", inputTokens);
        result.putOutputParam("output_tokens", outputTokens);
        result.addNodeMessage(buildNodeMessage(req, output, config.getModelName(), inputTokens, outputTokens));
        return result;
    }

    /**
     * 带工具调用的文本执行（通过 AiServices + systemMessageProvider）
     */
    private WfNodeResult executeTextWithTools(StreamingChatLanguageModel model, String systemPrompt,
                                              String messageText, List<Object> tools,
                                              StreamEmitter emitter, ChatReq req, LLMNodeConfig config) {
        log.info("LLM节点加载了 {} 个工具", tools.size());

        int memorySize = Boolean.TRUE.equals(req.getEnableMemory())
                ? (req.getMemoryWindowSize() != null ? req.getMemoryWindowSize() : chatProps.getMemoryMaxMessage())
                : 0;

        String conversationId = req.getConversationId();
        MessageWindowChatMemory memory = MessageWindowChatMemory.builder()
                .id(conversationId)
                .chatMemoryStore(new PersistentChatMemoryStore(messageMapper, redisTemplate, memorySize))
                .maxMessages(memorySize)
                .build();

        AiServices<Agent> aiServices = AiServices.builder(Agent.class)
                .streamingChatLanguageModel(model)
                .chatMemory(memory);
        if (StrUtil.isNotBlank(systemPrompt)) {
            aiServices.systemMessageProvider(memoryId -> systemPrompt);
        }
        aiServices.tools(tools);

        Agent agent = aiServices.build();
        AtomicReference<StringBuilder> outputRef = new AtomicReference<>(new StringBuilder());
        AtomicReference<TokenUsage> tokenUsageRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Throwable> errorRef = new AtomicReference<>();

        TokenStream tokenStream = agent.stream(conversationId, messageText);
        tokenStream
                .onNext(token -> {
                    outputRef.get().append(token);
                    if (emitter != null) {
                        emitter.send(new ChatRes(token));
                    }
                })
                .onComplete(resp -> {
                    log.info("LLM节点执行完成");
                    tokenUsageRef.set(resp.tokenUsage());
                    latch.countDown();
                })
                .onError(err -> {
                    log.error("LLM节点执行出错: {}", err.getMessage());
                    errorRef.set(err);
                    latch.countDown();
                })
                .start();

        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("LLM节点执行被中断", e);
        }

        if (errorRef.get() != null) {
            throw new RuntimeException("LLM节点执行出错: " + errorRef.get().getMessage(), errorRef.get());
        }

        TokenUsage usage = tokenUsageRef.get();
        int inputTokens = (usage != null && usage.inputTokenCount() != null) ? usage.inputTokenCount() : 0;
        int outputTokens = (usage != null && usage.outputTokenCount() != null) ? usage.outputTokenCount() : 0;
        log.info("LLM节点token统计, input: {}, output: {}", inputTokens, outputTokens);

        String output = outputRef.get().toString();
        WfNodeResult result = new WfNodeResult(output, inputTokens, outputTokens);
        result.setModelName(config.getModelName());
        result.putOutputParam("llm_output", output);
        result.putOutputParam("input_tokens", inputTokens);
        result.putOutputParam("output_tokens", outputTokens);
        result.addNodeMessage(buildNodeMessage(req, output, config.getModelName(), inputTokens, outputTokens));
        return result;
    }

    private LlmMessage buildNodeMessage(ChatReq req, String output, String modelName,
                                         int inputTokens, int outputTokens) {
        return new LlmMessage()
                .setConversationId(req.getConversationId())
                .setUserId(req.getUserId())
                .setUsername(req.getUsername())
                .setIp(req.getIp())
                .setAppId(req.getAppId())
                .setChatId(req.getChatId())
                .setRole("assistant")
                .setMessage(output)
                .setModelName(modelName)
                .setPromptTokens(inputTokens)
                .setCompletionTokens(outputTokens);
    }
}
