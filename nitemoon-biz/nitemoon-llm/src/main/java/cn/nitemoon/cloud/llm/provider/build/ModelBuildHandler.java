package cn.nitemoon.cloud.llm.provider.build;

import cn.nitemoon.cloud.llm.entity.LlmModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;

/**
 * @author hetao
 */
public interface ModelBuildHandler {

    /**
     * 判断是不是当前模型
     */
    boolean whetherCurrentModel(LlmModel model);

    /**
     * basic check
     */
    boolean basicCheck(LlmModel model);

    /**
     * streaming chat build
     */
    StreamingChatLanguageModel buildStreamingChat(LlmModel model);

    /**
     * chat build
     */
    ChatLanguageModel buildChatLanguageModel(LlmModel model);

    /**
     * embedding config
     */
    EmbeddingModel buildEmbedding(LlmModel model);

    /**
     * image config
     */
    ImageModel buildImage(LlmModel model);

}
