package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

@Data
public class LLMNodeConfig {
    private String prompt;
    private String modelId;
    private String modelName;
}
