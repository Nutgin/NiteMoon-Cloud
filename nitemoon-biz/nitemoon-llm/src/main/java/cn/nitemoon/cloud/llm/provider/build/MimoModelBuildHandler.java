package cn.nitemoon.cloud.llm.provider.build;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.enums.ChatErrorEnum;
import cn.nitemoon.cloud.llm.enums.ProviderEnum;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.image.ImageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.model.openai.OpenAiImageModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * MIMO 模型构建处理器
 * 支持 MIMO 特有的多模态格式（音频、视频）
 *
 * @author hetao
 */
@Slf4j
@Component
public class MimoModelBuildHandler extends AbstractModelBuildHandler {

    private static final Duration TIMEOUT = Duration.ofMinutes(10);

    @Override
    public boolean whetherCurrentModel(LlmModel model) {
        return ProviderEnum.MIMO.name().equals(model.getProvider());
    }

    @Override
    public boolean basicCheck(LlmModel model) {
        if (StrUtil.isBlank(model.getApiKey())) {
            throw new CommonBusinessException(
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorCode(),
                    ChatErrorEnum.API_KEY_IS_NULL.getErrorDesc("MIMO", model.getType()));
        }
        return true;
    }

    @Override
    protected StreamingChatLanguageModel doBuildStreamingChat(LlmModel model) {
        return MimoStreamingChatModel.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getBaseUrl())
                .modelName(model.getModel())
                .maxTokens(model.getResponseLimit())
                .temperature(model.getTemperature())
                .topP(model.getTopP())
                .fps(model.getFps() != null ? model.getFps() : 2.0)
                .mediaResolution(model.getMediaResolution() != null ? model.getMediaResolution() : "default")
                .build();
    }

    @Override
    protected ChatLanguageModel doBuildChatModel(LlmModel model) {
        // MIMO 的非流式模型仍然使用 OpenAI 兼容接口
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
        // MIMO 不支持 Embedding，返回 null
        log.warn("MIMO 不支持 Embedding 模型");
        return null;
    }

    @Override
    protected ImageModel doBuildImageModel(LlmModel model) {
        // MIMO 的图像生成仍然使用 OpenAI 兼容接口
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
