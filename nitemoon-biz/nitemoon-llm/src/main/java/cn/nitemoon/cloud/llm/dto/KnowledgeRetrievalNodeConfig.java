package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

import java.util.List;

@Data
public class KnowledgeRetrievalNodeConfig {
    private List<String> knowledgeIds;
    private Integer topK = 5;
    private Double similarityThreshold = 0.7;
}
