package cn.nitemoon.cloud.llm.provider.build;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.enums.ChatErrorEnum;
import cn.nitemoon.cloud.llm.enums.ProviderEnum;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 百度千帆模型构建器（使用 v2 OpenAI 兼容 API）
 *
 * @author hetao
 */
@Slf4j
@Component
public class QFanModelBuildHandler extends AbstractModelBuildHandler {

    private static final String DEFAULT_BASE_URL = "https://qianfan.baidubce.com/v2";
    private static final Duration TIMEOUT = Duration.ofMinutes(10);

    @Override
    public boolean whetherCurrentModel(LlmModel model) {
        return ProviderEnum.Q_FAN.name().equals(model.getProvider());
    }

    @Override
    public boolean basicCheck(LlmModel model) {
        if (StrUtil.isBlank(model.getApiKey())) {
            throw new CommonBusinessException(
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorCode(),
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorDesc(ProviderEnum.Q_FAN.name(), model.getType())
            );
        }
        return true;
    }

    private String resolveBaseUrl(LlmModel model) {
        return StrUtil.isNotBlank(model.getBaseUrl()) ? model.getBaseUrl() : DEFAULT_BASE_URL;
    }

    @Override
    protected StreamingChatLanguageModel doBuildStreamingChat(LlmModel model) {
        return OpenAiStreamingChatModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(resolveBaseUrl(model))
                .modelName(model.getModel())
                .maxTokens(model.getResponseLimit())
                .temperature(model.getTemperature())
                .topP(model.getTopP())
                .logRequests(true)
                .logResponses(true)
                .timeout(TIMEOUT)
                .build();
    }

    @Override
    protected ChatLanguageModel doBuildChatModel(LlmModel model) {
        return OpenAiChatModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(resolveBaseUrl(model))
                .modelName(model.getModel())
                .maxTokens(model.getResponseLimit())
                .temperature(model.getTemperature())
                .topP(model.getTopP())
                .logRequests(true)
                .logResponses(true)
                .timeout(TIMEOUT)
                .build();
    }

    @Override
    protected EmbeddingModel doBuildEmbeddingModel(LlmModel model) {
        return OpenAiEmbeddingModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(resolveBaseUrl(model))
                .modelName(model.getModel())
                .dimensions(model.getDimension())
                .logRequests(true)
                .logResponses(true)
                .timeout(TIMEOUT)
                .build();
    }

    @Override
    protected ImageModel doBuildImageModel(LlmModel model) {
        return null;
    }
}
