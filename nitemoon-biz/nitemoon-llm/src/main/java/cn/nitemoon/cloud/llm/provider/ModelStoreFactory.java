package cn.nitemoon.cloud.llm.provider;

import cn.hutool.core.util.ObjectUtil;
import cn.nitemoon.cloud.llm.constants.ModelConst;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.enums.ModelTypeEnum;
import cn.nitemoon.cloud.llm.provider.build.ModelBuildHandler;
import cn.nitemoon.cloud.llm.service.LlmModelService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Async;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author hetao
 * @date 2025/6/16
 */
@Configuration
@Slf4j
public class ModelStoreFactory {

    @Autowired
    private LlmModelService llmModelService;
    @Autowired
    private List<ModelBuildHandler> modelBuildHandlers;

    private final List<LlmModel> modelStore = new ArrayList<>();
    private final Map<String, StreamingChatLanguageModel> streamingChatMap = new ConcurrentHashMap<>();
    private final Map<String, ChatLanguageModel> chatLanguageMap = new ConcurrentHashMap<>();
    private final Map<String, EmbeddingModel> embeddingModelMap = new ConcurrentHashMap<>();
    private final Map<String, ImageModel> imageModelMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        modelStore.clear();
        streamingChatMap.clear();
        chatLanguageMap.clear();
        embeddingModelMap.clear();
        imageModelMap.clear();

        List<LlmModel> list = llmModelService.list();
        list.forEach(model -> {
            if (Objects.equals(model.getBaseUrl(), "")) {
                model.setBaseUrl(null);
            }

            chatHandler(model);
            embeddingHandler(model);
            imageHandler(model);
        });

        modelStore.forEach(i -> log.info("已成功注册模型：{} -- {}， 模型配置：{}", i.getProvider(), i.getType(), i));
    }

    private void chatHandler(LlmModel model) {
        try {
            String type = model.getType();
            if (!ModelTypeEnum.CHAT.name().equals(type)) {
                return;
            }
            modelBuildHandlers.forEach(x -> {
                StreamingChatLanguageModel streamingChatLanguageModel = x.buildStreamingChat(model);
                if (ObjectUtil.isNotEmpty(streamingChatLanguageModel)) {
                    streamingChatMap.put(model.getId(), streamingChatLanguageModel);
                    modelStore.add(model);
                }

                ChatLanguageModel languageModel = x.buildChatLanguageModel(model);
                if (ObjectUtil.isNotEmpty(languageModel)) {
                    chatLanguageMap.put(model.getId() + ModelConst.TEXT_SUFFIX, languageModel);
                }
            });
        } catch (Exception e) {
            log.error("model 【 id: {} name: {}】streaming chat 配置报错", model.getId(), model.getName());
        }
    }

    private void embeddingHandler(LlmModel model) {
        try {
            String type = model.getType();
            if (!ModelTypeEnum.EMBEDDING.name().equals(type)) {
                return;
            }
            modelBuildHandlers.forEach(x -> {
                EmbeddingModel embeddingModel = x.buildEmbedding(model);
                if (ObjectUtil.isNotEmpty(embeddingModel)) {
                    embeddingModelMap.put(model.getId(), embeddingModel);
                    modelStore.add(model);
                }
            });

        } catch (Exception e) {
            log.error("model 【id{} name{}】 embedding 配置报错", model.getId(), model.getName());
        }
    }

    private void imageHandler(LlmModel model) {
        try {
            String type = model.getType();
            if (!ModelTypeEnum.TEXT_IMAGE.name().equals(type) && !"IMAGE".equals(type)) {
                return;
            }
            boolean[] streamingRegistered = {false};
            modelBuildHandlers.forEach(x -> {
                ImageModel imageModel = x.buildImage(model);
                if (ObjectUtil.isNotEmpty(imageModel)) {
                    imageModelMap.put(model.getId(), imageModel);
                    modelStore.add(model);
                }

                // 多模态模型也注册为StreamingChatLanguageModel，支持流式对话
                if (!streamingRegistered[0]) {
                    StreamingChatLanguageModel streamingModel = x.buildStreamingChat(model);
                    if (ObjectUtil.isNotEmpty(streamingModel)) {
                        streamingChatMap.put(model.getId(), streamingModel);
                        streamingRegistered[0] = true;
                        log.info("多模态模型已注册StreamingChat: id={}, name={}", model.getId(), model.getName());
                    }
                }
            });
            if (!streamingRegistered[0]) {
                log.warn("多模态模型StreamingChat注册失败(无匹配handler): id={}, name={}, provider={}", model.getId(), model.getName(), model.getProvider());
            }
        } catch (Exception e) {
            log.error("model 【id{} name{}】 image 配置报错", model.getId(), model.getName());
        }
    }

    public StreamingChatLanguageModel getStreamingChatModel(String modelId) {
        return streamingChatMap.get(modelId);
    }

    public boolean containsStreamingChatModel(String modelId) {
        return streamingChatMap.containsKey(modelId);
    }

    public ChatLanguageModel getChatLanguageModel(String modelId) {
        return chatLanguageMap.get(modelId + ModelConst.TEXT_SUFFIX);
    }

    public boolean containsChatLanguageModel(String modelId) {
        return chatLanguageMap.containsKey(modelId + ModelConst.TEXT_SUFFIX);
    }

    public EmbeddingModel getEmbeddingModel(String modelId) {
        return embeddingModelMap.get(modelId);
    }

    public boolean containsEmbeddingModel(String modelId) {
        return embeddingModelMap.containsKey(modelId);
    }

    public ImageModel getImageModel(String modelId) {
        return imageModelMap.get(modelId);
    }

    public boolean containsImageModel(String modelId) {
        return imageModelMap.containsKey(modelId);
    }
}
