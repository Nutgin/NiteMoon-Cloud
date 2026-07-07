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
import dev.langchain4j.model.openai.OpenAiImageModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * OpenAI兼容接口模型构建器
 * 支持OpenAI、Gemini、Claude、Azure、豆包、YI、Silicon、DeepSeek、星火等
 *
 * @author hetao
 */
@Slf4j
@Component
public class OpenAIModelBuildHandler extends AbstractModelBuildHandler {

    private static final Duration TIMEOUT = Duration.ofMinutes(10);

    @Override
    public boolean whetherCurrentModel(LlmModel model) {
        String provider = model.getProvider();
        return ProviderEnum.OPENAI.name().equals(provider) ||
                ProviderEnum.GEMINI.name().equals(provider) ||
                ProviderEnum.CLAUDE.name().equals(provider) ||
                ProviderEnum.AZURE_OPENAI.name().equals(provider) ||
                ProviderEnum.DOUYIN.name().equals(provider) ||
                ProviderEnum.YI.name().equals(provider) ||
                ProviderEnum.SILICON.name().equals(provider) ||
                ProviderEnum.DEEPSEEK.name().equals(provider) ||
                ProviderEnum.SPARK.name().equals(provider);
    }

    @Override
    public boolean basicCheck(LlmModel model) {
        if (StrUtil.isBlank(model.getApiKey())) {
            throw new CommonBusinessException(
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorCode(),
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorDesc(model.getProvider().toUpperCase(), model.getType()));
        }
        return true;
    }

    @Override
    protected StreamingChatLanguageModel doBuildStreamingChat(LlmModel model) {
        return OpenAiStreamingChatModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getBaseUrl())
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
                .baseUrl(model.getBaseUrl())
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
                .baseUrl(model.getBaseUrl())
                .modelName(model.getModel())
                .dimensions(model.getDimension() != null ? model.getDimension() : 1024)
                .logRequests(true)
                .logResponses(true)
                .timeout(TIMEOUT)
                .build();
    }

    @Override
    protected ImageModel doBuildImageModel(LlmModel model) {
        return OpenAiImageModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getBaseUrl())
                .modelName(model.getModel())
                .size(model.getImageSize())
                .quality(model.getImageQuality())
                .style(model.getImageStyle())
                .logRequests(true)
                .logResponses(true)
                .timeout(TIMEOUT)
                .build();
    }
}
