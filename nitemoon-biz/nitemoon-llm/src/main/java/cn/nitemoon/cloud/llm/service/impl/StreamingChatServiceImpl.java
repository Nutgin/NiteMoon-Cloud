package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.config.ChatProps;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ImageR;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import cn.nitemoon.cloud.llm.provider.EmbeddingProvider;
import cn.nitemoon.cloud.llm.provider.ModelProvider;
import org.springframework.data.redis.core.RedisTemplate;
import cn.nitemoon.cloud.llm.service.Agent;
import cn.nitemoon.cloud.llm.service.StreamingChatService;
import cn.nitemoon.cloud.llm.utils.PromptUtil;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import dev.langchain4j.data.image.Image;
import dev.langchain4j.data.message.*;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.image.ImageModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.rag.DefaultRetrievalAugmentor;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.TokenStream;
import dev.langchain4j.store.embedding.filter.Filter;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

import static cn.nitemoon.cloud.llm.constants.EmbedConst.KNOWLEDGE;
import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

/**
 * @author hetao
 */
@Slf4j
@Service
@AllArgsConstructor
public class StreamingChatServiceImpl implements StreamingChatService {

    private final ModelProvider provider;
    private final EmbeddingProvider embeddingProvider;
    private final ChatProps chatProps;
    private final LlmMessageMapper messageMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private AiServices<Agent> build(StreamingChatLanguageModel streamModel, ChatLanguageModel model, ChatReq req) {
        int memorySize = Boolean.TRUE.equals(req.getEnableMemory())
                ? (req.getMemoryWindowSize() != null ? req.getMemoryWindowSize() : chatProps.getMemoryMaxMessage())
                : 0;

        AiServices<Agent> aiServices = AiServices.builder(Agent.class)
                .chatMemoryProvider(memoryId -> MessageWindowChatMemory.builder()
                        .id(req.getConversationId())
                        .chatMemoryStore(new PersistentChatMemoryStore(messageMapper, redisTemplate, memorySize))
                        .maxMessages(memorySize)
                        .build());
        if (StrUtil.isNotBlank(req.getPromptText())) {
            aiServices.systemMessageProvider(memoryId -> req.getPromptText());
        }
        if (streamModel != null) {
            aiServices.streamingChatLanguageModel(streamModel);
        }
        if (model != null) {
            aiServices.chatLanguageModel(model);
        }
        return aiServices;
    }

    @Override
    public TokenStream chat(ChatReq req) {
        StreamingChatLanguageModel model = provider.stream(req.getModelId());
        if (StrUtil.isBlank(req.getConversationId())) {
            req.setConversationId(IdUtil.simpleUUID());
        }

        AiServices<Agent> aiServices = build(model, null, req);

        if (StrUtil.isNotBlank(req.getKnowledgeId())) {
            req.getKnowledgeIds().add(req.getKnowledgeId());
        }

        if (req.getKnowledgeIds() != null && !req.getKnowledgeIds().isEmpty()) {
            try {
                log.info("尝试加载知识库配置，knowledgeIds: {}", req.getKnowledgeIds());
                Function<Query, Filter> filter = (query) -> metadataKey(KNOWLEDGE).isIn(req.getKnowledgeIds());
                ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
                        .embeddingStore(embeddingProvider.getEmbeddingStore(req.getKnowledgeIds()))
                        .embeddingModel(embeddingProvider.getEmbeddingModel(req.getKnowledgeIds()))
                        .dynamicFilter(filter)
                        .build();
                aiServices.retrievalAugmentor(DefaultRetrievalAugmentor
                        .builder()
                        .contentRetriever(contentRetriever)
                        .build());
                log.info("知识库配置加载成功");
            } catch (Exception e) {
                log.warn("知识库配置加载失败，将跳过知识库检索，使用纯模型对话。错误: {}", e.getMessage());
            }
        }
        Agent agent = aiServices.build();
        return agent.stream(req.getConversationId(), req.getMessage());
    }

    @Override
    public TokenStream singleChat(ChatReq req) {
        StreamingChatLanguageModel model = provider.stream(req.getModelId());
        if (StrUtil.isBlank(req.getConversationId())) {
            req.setConversationId(IdUtil.simpleUUID());
        }

        Agent agent = build(model, null, req).build();
        if (req.getPrompt() == null) {
            req.setPrompt(PromptUtil.build(req.getMessage(), req.getPromptText()));
        }
        return agent.stream(req.getConversationId(), req.getPrompt().text());
    }

    @Override
    public String text(ChatReq req) {
        if (StrUtil.isBlank(req.getConversationId())) {
            req.setConversationId(IdUtil.simpleUUID());
        }

        try {
            ChatLanguageModel model = provider.text(req.getModelId());
            Agent agent = build(null, model, req).build();
            String text = agent.text(req.getConversationId(), req.getMessage());
            return text;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public Response<Image> image(ImageR req) {
        try {
            ImageModel model = provider.image(req.getModelId());
            return model.generate(req.getPrompt().text());
        } catch (Exception e) {
            e.printStackTrace();
            throw new CommonBusinessException("图片生成失败");
        }
    }
}
