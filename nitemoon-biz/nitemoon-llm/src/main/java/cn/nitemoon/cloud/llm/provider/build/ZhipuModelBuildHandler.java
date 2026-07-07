package cn.nitemoon.cloud.llm.provider.build;

import cn.nitemoon.cloud.llm.config.LlmChatProps;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.enums.ChatErrorEnum;
import cn.nitemoon.cloud.llm.enums.ProviderEnum;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import dev.langchain4j.community.model.zhipu.ZhipuAiChatModel;
import dev.langchain4j.community.model.zhipu.ZhipuAiEmbeddingModel;
import dev.langchain4j.community.model.zhipu.ZhipuAiImageModel;
import dev.langchain4j.community.model.zhipu.ZhipuAiStreamingChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 智谱模型构建器
 *
 * @author hetao
 */
@Slf4j
@Component
@AllArgsConstructor
public class ZhipuModelBuildHandler extends AbstractModelBuildHandler {

    private final LlmChatProps props;
    private static final Duration TIMEOUT = Duration.ofMinutes(10);

    @Override
    public boolean whetherCurrentModel(LlmModel model) {
        return ProviderEnum.ZHIPU.name().equals(model.getProvider());
    }

    @Override
    public boolean basicCheck(LlmModel model) {
        if (StringUtils.isBlank(model.getApiKey())) {
            throw new CommonBusinessException(
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorCode(),
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorDesc(ProviderEnum.ZHIPU.name(), model.getType())
            );
        }
        return true;
    }

    @Override
    protected StreamingChatLanguageModel doBuildStreamingChat(LlmModel model) {
        return ZhipuAiStreamingChatModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getBaseUrl())
                .model(model.getModel())
                .maxToken(model.getResponseLimit())
                .temperature(model.getTemperature())
                .topP(model.getTopP())
                .logRequests(true)
                .logResponses(true)
                .callTimeout(TIMEOUT)
                .connectTimeout(TIMEOUT)
                .writeTimeout(TIMEOUT)
                .readTimeout(TIMEOUT)
                .build();
    }

    @Override
    protected ChatLanguageModel doBuildChatModel(LlmModel model) {
        return ZhipuAiChatModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getBaseUrl())
                .model(model.getModel())
                .maxToken(model.getResponseLimit())
                .temperature(model.getTemperature())
                .topP(model.getTopP())
                .logRequests(true)
                .logResponses(true)
                .callTimeout(TIMEOUT)
                .connectTimeout(TIMEOUT)
                .writeTimeout(TIMEOUT)
                .readTimeout(TIMEOUT)
                .build();
    }

    @Override
    protected EmbeddingModel doBuildEmbeddingModel(LlmModel model) {
        return ZhipuAiEmbeddingModel.builder()
                .apiKey(model.getApiKey())
                .model(model.getModel())
                .baseUrl(model.getBaseUrl())
                .logRequests(true)
                .logResponses(true)
                .callTimeout(TIMEOUT)
                .connectTimeout(TIMEOUT)
                .writeTimeout(TIMEOUT)
                .readTimeout(TIMEOUT)
                .dimensions(1024)
                .build();
    }

    @Override
    protected ImageModel doBuildImageModel(LlmModel model) {
        return ZhipuAiImageModel.builder()
                .apiKey(model.getApiKey())
                .model(model.getModel())
                .baseUrl(model.getBaseUrl())
                .logRequests(true)
                .logResponses(true)
                .callTimeout(TIMEOUT)
                .connectTimeout(TIMEOUT)
                .writeTimeout(TIMEOUT)
                .readTimeout(TIMEOUT)
                .build();
    }
}
