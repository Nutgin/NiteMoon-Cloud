package cn.nitemoon.cloud.llm.provider.build;

import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;
import lombok.extern.slf4j.Slf4j;

/**
 * 模型构建器基类，提供统一的异常处理模板
 *
 * @author hetao
 */
@Slf4j
public abstract class AbstractModelBuildHandler implements ModelBuildHandler {

    @Override
    public StreamingChatLanguageModel buildStreamingChat(LlmModel model) {
        if (!whetherCurrentModel(model) || !basicCheck(model)) {
            return null;
        }
        try {
            return doBuildStreamingChat(model);
        } catch (CommonBusinessException e) {
            log.error(e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("{} Streaming Chat 模型构建失败", model.getProvider(), e);
            return null;
        }
    }

    @Override
    public ChatLanguageModel buildChatLanguageModel(LlmModel model) {
        if (!whetherCurrentModel(model) || !basicCheck(model)) {
            return null;
        }
        try {
            return doBuildChatModel(model);
        } catch (CommonBusinessException e) {
            log.error(e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("{} Chat 模型构建失败", model.getProvider(), e);
            return null;
        }
    }

    @Override
    public EmbeddingModel buildEmbedding(LlmModel model) {
        if (!whetherCurrentModel(model) || !basicCheck(model)) {
            return null;
        }
        try {
            return doBuildEmbeddingModel(model);
        } catch (CommonBusinessException e) {
            log.error(e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("{} Embedding 模型构建失败", model.getProvider(), e);
            return null;
        }
    }

    @Override
    public ImageModel buildImage(LlmModel model) {
        if (!whetherCurrentModel(model) || !basicCheck(model)) {
            return null;
        }
        try {
            return doBuildImageModel(model);
        } catch (CommonBusinessException e) {
            log.error(e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("{} Image 模型构建失败", model.getProvider(), e);
            return null;
        }
    }

    protected abstract StreamingChatLanguageModel doBuildStreamingChat(LlmModel model);

    protected abstract ChatLanguageModel doBuildChatModel(LlmModel model);

    protected abstract EmbeddingModel doBuildEmbeddingModel(LlmModel model);

    protected abstract ImageModel doBuildImageModel(LlmModel model);
}
