package cn.nitemoon.cloud.llm.provider;

import cn.nitemoon.cloud.llm.entity.LlmKnowledge;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

/**
 * @author hetao
 * @date 2025/3/8
 */
@Slf4j
@Component
@AllArgsConstructor
public class EmbeddingProvider {

    private final EmbeddingStoreFactory embeddingStoreFactory;
    private final KnowledgeStoreFactory knowledgeStoreFactory;
    private final ModelStoreFactory modelStoreFactory;

    /**
     * 默认分块器（兼容旧代码）
     */
    public static DocumentSplitter splitter() {
        return DocumentSplitters.recursive(300, 20);
    }

    /**
     * 根据知识库配置创建分块器
     */
    public DocumentSplitter splitter(String knowledgeId) {
        int size = 512;
        int overlap = 50;
        if (knowledgeStoreFactory.containsKnowledge(knowledgeId)) {
            LlmKnowledge data = knowledgeStoreFactory.getKnowledge(knowledgeId);
            if (data.getChunkSize() != null && data.getChunkSize() > 0) {
                size = data.getChunkSize();
            }
            if (data.getChunkOverlap() != null && data.getChunkOverlap() >= 0) {
                overlap = data.getChunkOverlap();
            }
        }
        return DocumentSplitters.recursive(size, overlap);
    }

    /**
     * 获取知识库的检索配置
     */
    public LlmKnowledge getKnowledgeConfig(String knowledgeId) {
        if (knowledgeStoreFactory.containsKnowledge(knowledgeId)) {
            return knowledgeStoreFactory.getKnowledge(knowledgeId);
        }
        return null;
    }

    public EmbeddingModel getEmbeddingModel(List<String> knowledgeIds) {
        List<String> storeIds = new ArrayList<>();
        knowledgeIds.forEach(id -> {
            if (knowledgeStoreFactory.containsKnowledge(id)) {
                LlmKnowledge data = knowledgeStoreFactory.getKnowledge(id);
                if (data.getEmbedModelId() != null) {
                    storeIds.add(data.getEmbedModelId());
                }
            }
        });
        if (storeIds.isEmpty()) {
            throw new CommonBusinessException("知识库缺少Embedding Model配置，请先检查配置");
        }

        HashSet<String> filterIds = new HashSet<>(storeIds);
        if (filterIds.size() > 1) {
            throw new CommonBusinessException("存在多个不同Embedding Model的知识库，请先检查配置");
        }

        return modelStoreFactory.getEmbeddingModel(storeIds.get(0));
    }

    public EmbeddingModel getEmbeddingModel(String knowledgeId) {
        if (knowledgeStoreFactory.containsKnowledge(knowledgeId)) {
            LlmKnowledge data = knowledgeStoreFactory.getKnowledge(knowledgeId);
            if (modelStoreFactory.containsEmbeddingModel(data.getEmbedModelId())) {
                return modelStoreFactory.getEmbeddingModel(data.getEmbedModelId());
            }
        }
        throw new CommonBusinessException("没有找到匹配的Embedding向量数据库");
    }

    public EmbeddingStore<TextSegment> getEmbeddingStore(String knowledgeId) {
        if (knowledgeStoreFactory.containsKnowledge(knowledgeId)) {
            LlmKnowledge data = knowledgeStoreFactory.getKnowledge(knowledgeId);
            if (embeddingStoreFactory.containsEmbeddingStore(data.getEmbedStoreId())) {
                return embeddingStoreFactory.getEmbeddingStore(data.getEmbedStoreId());
            }
        }
        throw new CommonBusinessException("没有找到匹配的Embedding向量数据库");
    }

    public EmbeddingStore<TextSegment> getEmbeddingStore(List<String> knowledgeIds) {
        List<String> storeIds = new ArrayList<>();
        knowledgeIds.forEach(id -> {
            if (knowledgeStoreFactory.containsKnowledge(id)) {
                LlmKnowledge data = knowledgeStoreFactory.getKnowledge(id);
                if (data.getEmbedStoreId() != null) {
                    storeIds.add(data.getEmbedStoreId());
                }
            }
        });
        if (storeIds.isEmpty()) {
            throw new CommonBusinessException("知识库缺少Embedding Store配置，请先检查配置");
        }

        HashSet<String> filterIds = new HashSet<>(storeIds);
        if (filterIds.size() > 1) {
            throw new CommonBusinessException("存在多个不同Embedding Store数据源的知识库，请先检查配置");
        }

        return embeddingStoreFactory.getEmbeddingStore(storeIds.get(0));
    }

}
