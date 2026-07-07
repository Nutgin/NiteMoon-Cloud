package cn.nitemoon.cloud.llm.provider.build;

import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.enums.ChatErrorEnum;
import cn.nitemoon.cloud.llm.enums.ProviderEnum;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import dev.langchain4j.community.model.dashscope.QwenChatModel;
import dev.langchain4j.community.model.dashscope.QwenEmbeddingModel;
import dev.langchain4j.community.model.dashscope.QwenStreamingChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

/**
 * 通义千问模型构建器
 *
 * @author hetao
 */
@Slf4j
@Component
public class QWenModelBuildHandler extends AbstractModelBuildHandler {

    @Override
    public boolean whetherCurrentModel(LlmModel model) {
        return ProviderEnum.Q_WEN.name().equals(model.getProvider());
    }

    @Override
    public boolean basicCheck(LlmModel model) {
        if (StringUtils.isBlank(model.getApiKey())) {
            throw new CommonBusinessException(
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorCode(),
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorDesc(ProviderEnum.Q_WEN.name(), model.getType())
            );
        }
        return true;
    }

    @Override
    protected StreamingChatLanguageModel doBuildStreamingChat(LlmModel model) {
        return QwenStreamingChatModel.builder()
                .apiKey(model.getApiKey())
                .modelName(model.getModel())
                .baseUrl(model.getBaseUrl())
                .maxTokens(model.getResponseLimit())
                .temperature(Float.parseFloat(model.getTemperature().toString()))
                .topP(model.getTopP())
                .build();
    }

    @Override
    protected ChatLanguageModel doBuildChatModel(LlmModel model) {
        return QwenChatModel.builder()
                .apiKey(model.getApiKey())
                .modelName(model.getModel())
                .baseUrl(model.getBaseUrl())
                .enableSearch(true)
                .maxTokens(model.getResponseLimit())
                .temperature(Float.parseFloat(model.getTemperature().toString()))
                .topP(model.getTopP())
                .build();
    }

    @Override
    protected EmbeddingModel doBuildEmbeddingModel(LlmModel model) {
        return QwenEmbeddingModel.builder()
                .apiKey(model.getApiKey())
                .modelName(model.getModel())
                .build();
    }

    @Override
    protected ImageModel doBuildImageModel(LlmModel model) {
        return null;
    }
}
