package cn.nitemoon.cloud.llm.workflow.node;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.config.ChatProps;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.FileContent;
import cn.nitemoon.cloud.llm.dto.LLMNodeConfig;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import cn.nitemoon.cloud.llm.provider.ModelProvider;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import cn.nitemoon.cloud.llm.workflow.tools.ToolContextHolder;
import dev.langchain4j.data.message.*;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.List;
import java.util.Map;

/**
 * 多模态LLM工作流节点
 *
 * @author hetao
 */
@Slf4j
public class MultimodalLlmWfNode extends AbstractLlmWfNode {

    private final ModelProvider modelProvider;
    private final ChatProps chatProps;
    private final LlmMessageMapper messageMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    public MultimodalLlmWfNode(LlmWorkflowNode node, ModelProvider modelProvider, ChatProps chatProps,
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
            throw new RuntimeException("多模态LLM节点未配置模型");
        }

        log.info("多模态LLM节点执行, modelId: {}, prompt: {}", config.getModelId(),
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
        List<FileContent> files = (List<FileContent>) inputParams.get("files");

        ToolContextHolder.setEmitter(emitter);
        ToolContextHolder.setRequest(req);

        try {
            List<Content> contents = MultimodalExecutor.buildContents(inputText, files);
            if (files == null || files.isEmpty()) {
                log.info("多模态LLM节点无文件输入，以纯文本模式执行");
            }
            UserMessage userMessage = UserMessage.from(contents);
            List<ChatMessage> messages = MultimodalExecutor.buildMessagesWithMemory(
                    userMessage, conversationId, chatProps, req, messageMapper, redisTemplate, systemPrompt);
            WfNodeResult result = MultimodalExecutor.executeStreamingGeneration(model, messages, emitter, "多模态LLM节点");
            result.setModelName(config.getModelName());
            result.addNodeMessage(new LlmMessage()
                    .setConversationId(req.getConversationId())
                    .setUserId(req.getUserId())
                    .setUsername(req.getUsername())
                    .setIp(req.getIp())
                    .setAppId(req.getAppId())
                    .setChatId(req.getChatId())
                    .setRole("assistant")
                    .setMessage(result.getOutput())
                    .setModelName(config.getModelName())
                    .setPromptTokens(result.getInputTokens())
                    .setCompletionTokens(result.getOutputTokens()));
            return result;
        } finally {
            ToolContextHolder.clear();
        }
    }
}
