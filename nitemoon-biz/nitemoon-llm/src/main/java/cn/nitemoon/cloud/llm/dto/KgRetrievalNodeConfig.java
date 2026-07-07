package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

/**
 * 知识图谱检索节点配置
 *
 * @author hetao
 */
@Data
public class KgRetrievalNodeConfig {

    /**
     * 知识库ID
     */
    private String knowledgeId;

    /**
     * 最大返回结果数
     */
    private Integer maxResults = 10;

    /**
     * 分词方式：llm / hanlp
     */
    private String tokenizationMethod = "hanlp";

    /**
     * LLM分词时使用的模型ID（tokenizationMethod=llm 时必填）
     */
    private String tokenizationModelId;

    /**
     * LLM分词时使用的模型名称
     */
    private String tokenizationModelName;

    /**
     * 是否启用向量检索（混合检索模式）
     * 启用后会同时使用知识图谱和向量检索，合并结果作为上下文
     */
    private boolean enableVectorSearch = false;
}
