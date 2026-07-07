package cn.nitemoon.cloud.llm.provider.build;

import cn.hutool.core.util.StrUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.langchain4j.data.message.*;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.ChatResponseMetadata;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.output.TokenUsage;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import okhttp3.sse.EventSource;
import okhttp3.sse.EventSourceListener;
import okhttp3.sse.EventSources;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

/**
 * MIMO 专用流式对话模型
 * 支持 MIMO 特有的音频和视频格式
 *
 * @author hetao
 */
@Slf4j
public class MimoStreamingChatModel implements StreamingChatLanguageModel {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");

    private final String apiKey;
    private final String baseUrl;
    private final String modelName;
    private final Integer maxTokens;
    private final Double temperature;
    private final Double topP;
    private final double fps;
    private final String mediaResolution;
    private final OkHttpClient httpClient;

    @Builder
    public MimoStreamingChatModel(String apiKey, String baseUrl, String modelName,
                                   Integer maxTokens, Double temperature, Double topP,
                                   Double fps, String mediaResolution) {
        this.apiKey = apiKey;
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.modelName = modelName;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
        this.topP = topP;
        this.fps = fps != null ? fps : 2.0;
        this.mediaResolution = StrUtil.isNotBlank(mediaResolution) ? mediaResolution : "default";
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(10, java.util.concurrent.TimeUnit.MINUTES)
                .writeTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .build();
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (StrUtil.isBlank(baseUrl)) {
            return "https://api.xiaomimimo.com/v1";
        }
        // 移除末尾的斜杠
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    @Override
    public void chat(List<ChatMessage> messages, StreamingChatResponseHandler handler) {
        try {
            ObjectNode request = buildRequest(messages);
            String jsonBody = OBJECT_MAPPER.writeValueAsString(request);
            log.info("MIMO请求体: {}", jsonBody);

            Request httpRequest = new Request.Builder()
                    .url(baseUrl + "/chat/completions")
                    .addHeader("api-key", apiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(jsonBody, JSON_MEDIA_TYPE))
                    .build();

            EventSource.Factory factory = EventSources.createFactory(httpClient);
            StringBuilder contentBuilder = new StringBuilder();
            StringBuilder reasoningBuilder = new StringBuilder();
            AtomicReference<TokenUsage> tokenUsageRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            AtomicReference<Throwable> errorRef = new AtomicReference<>();

            factory.newEventSource(httpRequest, new EventSourceListener() {
                @Override
                public void onEvent(EventSource eventSource, String id, String type, String data) {
                    if ("[DONE]".equals(data)) {
                        return;
                    }
                    try {
                        JsonNode node = OBJECT_MAPPER.readTree(data);

                        // 解析 token usage（可能出现在任意 chunk 中，不仅限于 finish_reason chunk）
                        JsonNode usage = node.get("usage");
                        if (usage != null && !usage.isNull()) {
                            log.debug("MIMO usage chunk: {}", usage);
                            int promptTokens = usage.has("prompt_tokens") ? usage.get("prompt_tokens").asInt() : 0;
                            int completionTokens = usage.has("completion_tokens") ? usage.get("completion_tokens").asInt() : 0;
                            if (promptTokens > 0 || completionTokens > 0) {
                                tokenUsageRef.compareAndSet(null, new TokenUsage(promptTokens, completionTokens));
                            }
                        }

                        JsonNode choices = node.get("choices");
                        if (choices != null && choices.isArray() && !choices.isEmpty()) {
                            JsonNode choice = choices.get(0);
                            JsonNode delta = choice.get("delta");
                            if (delta != null) {
                                // 处理内容
                                JsonNode content = delta.get("content");
                                if (content != null && !content.isNull()) {
                                    String text = content.asText();
                                    contentBuilder.append(text);
                                    handler.onPartialResponse(text);
                                }
                                // 处理推理内容
                                JsonNode reasoningContent = delta.get("reasoning_content");
                                if (reasoningContent != null && !reasoningContent.isNull()) {
                                    reasoningBuilder.append(reasoningContent.asText());
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("解析MIMO响应失败: {}", data, e);
                    }
                }

                @Override
                public void onClosed(EventSource eventSource) {
                    TokenUsage usage = tokenUsageRef.get();
                    log.info("MIMO流式响应完成, tokenUsage: {}", usage);
                    AiMessage aiMessage = AiMessage.from(contentBuilder.toString());
                    ChatResponseMetadata metadata = ChatResponseMetadata.builder()
                            .tokenUsage(usage)
                            .modelName(modelName)
                            .build();
                    ChatResponse response = ChatResponse.builder()
                            .aiMessage(aiMessage)
                            .metadata(metadata)
                            .build();
                    handler.onCompleteResponse(response);
                    latch.countDown();
                }

                @Override
                public void onFailure(EventSource eventSource, Throwable t, okhttp3.Response response) {
                    log.error("MIMO流式请求失败", t);
                    errorRef.set(t);
                    latch.countDown();
                }
            });

            latch.await();

            if (errorRef.get() != null) {
                handler.onError(errorRef.get());
            }
        } catch (Exception e) {
            log.error("MIMO请求异常", e);
            handler.onError(e);
        }
    }

    @Override
    public void generate(List<ChatMessage> messages, StreamingResponseHandler<AiMessage> handler) {
        // 适配旧版 API，将调用转发到新的 chat 方法
        chat(messages, new StreamingChatResponseHandler() {
            @Override
            public void onPartialResponse(String partialResponse) {
                handler.onNext(partialResponse);
            }

            @Override
            public void onCompleteResponse(ChatResponse response) {
                TokenUsage usage = response.tokenUsage();
                Response<AiMessage> oldResponse = Response.from(response.aiMessage(), usage);
                handler.onComplete(oldResponse);
            }

            @Override
            public void onError(Throwable error) {
                handler.onError(error);
            }
        });
    }

    private ObjectNode buildRequest(List<ChatMessage> messages) {
        ObjectNode request = OBJECT_MAPPER.createObjectNode();
        request.put("model", modelName);
        request.put("stream", true);
        // 请求 API 在流式响应中返回 token usage
        ObjectNode streamOptions = request.putObject("stream_options");
        streamOptions.put("include_usage", true);

        if (maxTokens != null && maxTokens > 0) {
            request.put("max_completion_tokens", maxTokens);
        }
        if (temperature != null) {
            request.put("temperature", temperature);
        }
        if (topP != null) {
            request.put("top_p", topP);
        }

        ArrayNode messagesNode = request.putArray("messages");
        for (ChatMessage message : messages) {
            messagesNode.add(convertMessage(message));
        }

        return request;
    }

    private ObjectNode convertMessage(ChatMessage message) {
        ObjectNode messageNode = OBJECT_MAPPER.createObjectNode();

        if (message instanceof SystemMessage systemMessage) {
            messageNode.put("role", "system");
            messageNode.put("content", systemMessage.text());
        } else if (message instanceof UserMessage userMessage) {
            messageNode.put("role", "user");
            convertUserMessage(userMessage, messageNode);
        } else if (message instanceof AiMessage aiMessage) {
            messageNode.put("role", "assistant");
            messageNode.put("content", aiMessage.text());
        } else if (message instanceof ToolExecutionResultMessage toolResult) {
            messageNode.put("role", "tool");
            messageNode.put("content", toolResult.text());
            messageNode.put("tool_call_id", toolResult.id());
        }

        return messageNode;
    }

    private void convertUserMessage(UserMessage userMessage, ObjectNode messageNode) {
        List<Content> contents = userMessage.contents();
        if (contents == null || contents.isEmpty()) {
            messageNode.put("content", userMessage.singleText());
            return;
        }

        // 检查是否只有文本内容
        boolean textOnly = contents.stream().allMatch(c -> c instanceof TextContent);
        if (textOnly) {
            StringBuilder sb = new StringBuilder();
            for (Content content : contents) {
                if (content instanceof TextContent textContent) {
                    sb.append(textContent.text());
                }
            }
            messageNode.put("content", sb.toString());
            return;
        }

        // 多模态内容
        ArrayNode contentArray = messageNode.putArray("content");
        for (Content content : contents) {
            if (content instanceof TextContent textContent) {
                ObjectNode textNode = contentArray.addObject();
                textNode.put("type", "text");
                textNode.put("text", textContent.text());
            } else if (content instanceof ImageContent imageContent) {
                convertImageContent(imageContent, contentArray);
            } else if (content instanceof AudioContent audioContent) {
                convertAudioContent(audioContent, contentArray);
            } else if (content instanceof VideoContent videoContent) {
                convertVideoContent(videoContent, contentArray);
            }
        }
    }

    private void convertImageContent(ImageContent imageContent, ArrayNode contentArray) {
        ObjectNode imageNode = contentArray.addObject();
        imageNode.put("type", "image_url");
        ObjectNode imageUrl = imageNode.putObject("image_url");
        // 获取图片 URL
        String url = getImageUrl(imageContent);
        imageUrl.put("url", url);
    }

    private String getImageUrl(ImageContent imageContent) {
        // ImageContent 可能包含 URL 或 base64 数据
        if (imageContent.image() != null) {
            if (imageContent.image().url() != null) {
                return imageContent.image().url().toString();
            }
            if (StrUtil.isNotBlank(imageContent.image().base64Data())) {
                String mimeType = imageContent.image().mimeType();
                if (StrUtil.isBlank(mimeType)) {
                    mimeType = "image/png";
                }
                return "data:" + mimeType + ";base64," + imageContent.image().base64Data();
            }
        }
        return "";
    }

    private void convertAudioContent(AudioContent audioContent, ArrayNode contentArray) {
        ObjectNode audioNode = contentArray.addObject();
        audioNode.put("type", "input_audio");
        ObjectNode inputAudio = audioNode.putObject("input_audio");

        // MIMO 支持直接传 URL 或 base64 data URI
        if (audioContent.audio() != null) {
            if (audioContent.audio().url() != null) {
                inputAudio.put("data", audioContent.audio().url().toString());
            } else if (StrUtil.isNotBlank(audioContent.audio().base64Data())) {
                String mimeType = audioContent.audio().mimeType();
                if (StrUtil.isBlank(mimeType)) {
                    mimeType = "audio/wav";
                }
                inputAudio.put("data", "data:" + mimeType + ";base64," + audioContent.audio().base64Data());
            }
        }
    }

    private void convertVideoContent(VideoContent videoContent, ArrayNode contentArray) {
        ObjectNode videoNode = contentArray.addObject();
        videoNode.put("type", "video_url");
        ObjectNode videoUrl = videoNode.putObject("video_url");

        // 获取视频 URL
        if (videoContent.video() != null) {
            if (videoContent.video().url() != null) {
                videoUrl.put("url", videoContent.video().url().toString());
            } else if (StrUtil.isNotBlank(videoContent.video().base64Data())) {
                String mimeType = videoContent.video().mimeType();
                if (StrUtil.isBlank(mimeType)) {
                    mimeType = "video/mp4";
                }
                videoUrl.put("url", "data:" + mimeType + ";base64," + videoContent.video().base64Data());
            }
        }

        // MIMO 特有参数
        videoNode.put("fps", fps);
        videoNode.put("media_resolution", mediaResolution);
    }
}
