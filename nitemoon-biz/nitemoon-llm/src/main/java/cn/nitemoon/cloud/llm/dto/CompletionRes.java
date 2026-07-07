package cn.nitemoon.cloud.llm.dto;

import dev.langchain4j.model.output.Response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Arrays;
import java.util.List;

/**
 * @author hetao
 * @date 2025/7/30
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletionRes {

    @JsonProperty("id")
    private String id;
    
    @JsonProperty("created")
    private Integer created;
    
    @JsonProperty("model")
    private String model;
    
    @JsonProperty("choices")
    private List<ChatCompletionChoice> choices;
    
    @JsonProperty("usage")
    private Usage usage;

    public static CompletionRes process(String token) {
        return CompletionRes.builder()
                .choices(Arrays.asList(ChatCompletionChoice
                        .builder()
                        .delta(Delta.builder().content(token).build())
                        .finishReason(null)
                        .build()))
                .build();
    }

    public static CompletionRes end(Response res) {
        return CompletionRes.builder()
                .usage(Usage.builder()
                        .completionTokens(res.tokenUsage().outputTokenCount())
                        .promptTokens(res.tokenUsage().inputTokenCount())
                        .totalTokens(res.tokenUsage().totalTokenCount())
                        .build())
                .choices(Arrays.asList(ChatCompletionChoice
                        .builder()
                        .finishReason(res.finishReason() == null ? "stop" : res.finishReason().toString())
                        .build()))
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class Usage {
        @JsonProperty("prompt_tokens")
        private Integer promptTokens;
        
        @JsonProperty("completion_tokens")
        private Integer completionTokens;
        
        @JsonProperty("total_tokens")
        private Integer totalTokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class ChatCompletionChoice {
        @JsonProperty("delta")
        private Delta delta;
        
        @JsonProperty("finish_reason")
        private String finishReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class Delta {
        @JsonProperty("content")
        private String content;
    }
}
