package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

/**
 * 知识库检索请求DTO
 *
 * @author hetao
 */
@Data
public class SearchRequest {
    /** 知识库ID */
    private String knowledgeId;
    /** 查询内容 */
    private String content;
    /** 返回结果数量上限(覆盖知识库默认配置) */
    private Integer topK;
    /** 相似度阈值(覆盖知识库默认配置) */
    private Double similarityThreshold;
    /** 检索模式: VECTOR/KEYWORD/HYBRID */
    private String retrievalMode;
}
