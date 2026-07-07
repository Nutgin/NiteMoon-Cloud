package cn.nitemoon.cloud.llm.provider.build;

import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.enums.ChatErrorEnum;
import cn.nitemoon.cloud.llm.enums.ProviderEnum;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaEmbeddingModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Ollama本地模型构建器
 *
 * @author hetao
 */
@Slf4j
@Component
public class OllamaModelBuildHandler extends AbstractModelBuildHandler {

    private static final Duration TIMEOUT = Duration.ofMinutes(10);

    @Override
    public boolean whetherCurrentModel(LlmModel model) {
        return ProviderEnum.OLLAMA.name().equals(model.getProvider());
    }

    @Override
    public boolean basicCheck(LlmModel model) {
        if (StringUtils.isBlank(model.getBaseUrl())) {
            throw new CommonBusinessException(ChatErrorEnum.BASE_URL_IS_NULL.getErrorCode(),
                    ChatErrorEnum.BASE_URL_IS_NULL.getErrorDesc(ProviderEnum.OLLAMA.name(), model.getType()));
        }
        return true;
    }

    @Override
    protected StreamingChatLanguageModel doBuildStreamingChat(LlmModel model) {
        return OllamaStreamingChatModel.builder()
                .baseUrl(model.getBaseUrl())
                .modelName(model.getModel())
                .temperature(model.getTemperature())
                .topP(model.getTopP())
                .logRequests(true)
                .logResponses(true)
                .timeout(TIMEOUT)
                .build();
    }

    @Override
    protected ChatLanguageModel doBuildChatModel(LlmModel model) {
        return OllamaChatModel.builder()
                .baseUrl(model.getBaseUrl())
                .modelName(model.getModel())
                .temperature(model.getTemperature())
                .topP(model.getTopP())
                .logRequests(true)
                .logResponses(true)
                .timeout(TIMEOUT)
                .build();
    }

    @Override
    protected EmbeddingModel doBuildEmbeddingModel(LlmModel model) {
        return OllamaEmbeddingModel.builder()
                .baseUrl(model.getBaseUrl())
                .modelName(model.getModel())
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
