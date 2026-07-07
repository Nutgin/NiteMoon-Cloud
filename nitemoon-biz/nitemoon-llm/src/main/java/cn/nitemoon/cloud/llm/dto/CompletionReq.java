package cn.nitemoon.cloud.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * @author hetao
 * @date 2025/7/30
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletionReq {

    @JsonProperty("model")
    private String model;
    
    @JsonProperty("messages")
    private List<Message> messages;
    
    @JsonProperty("temperature")
    private Double temperature;
    
    @JsonProperty("top_p")
    private Double topP;
    
    @JsonProperty("n")
    private Integer n;
    
    @JsonProperty("stream")
    private Boolean stream;
    
    @JsonProperty("stop")
    private List<String> stop;
    
    @JsonProperty("max_tokens")
    private Integer maxTokens;
    
    @JsonProperty("presence_penalty")
    private Double presencePenalty;
    
    @JsonProperty("frequency_penalty")
    private Double frequencyPenalty;
    
    @JsonProperty("user")
    private String user;
    
    @JsonProperty("seed")
    private Integer seed;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        @JsonProperty("role")
        String role;
        
        @JsonProperty("content")
        String content;
    }
}
