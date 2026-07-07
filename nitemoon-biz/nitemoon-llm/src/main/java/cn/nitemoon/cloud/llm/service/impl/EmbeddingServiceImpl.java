package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.EmbeddingR;
import cn.nitemoon.cloud.llm.dto.SearchRequest;
import cn.nitemoon.cloud.llm.entity.LlmDocs;
import cn.nitemoon.cloud.llm.entity.LlmDocsSlice;
import cn.nitemoon.cloud.llm.entity.LlmKnowledge;
import cn.nitemoon.cloud.llm.mapper.LlmDocsMapper;
import cn.nitemoon.cloud.llm.provider.EmbeddingProvider;
import cn.nitemoon.cloud.llm.service.LlmKnowledgeService;
import cn.nitemoon.cloud.llm.service.EmbeddingService;
import cn.nitemoon.cloud.llm.service.DocumentEmbeddingService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static cn.nitemoon.cloud.llm.constants.EmbedConst.KNOWLEDGE;
import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

/**
 * @author hetao
 * @date 2025/6/6
 */
@Slf4j
@Service
@AllArgsConstructor
public class EmbeddingServiceImpl implements EmbeddingService {

    private final EmbeddingProvider embeddingProvider;
    private final DocumentEmbeddingService documentEmbeddingService;
    private final LlmKnowledgeService knowledgeService;
    private final LlmDocsMapper docsMapper;

    @Override
    @Transactional
    public void clearDocSlices(String docsId) {
        if (StrUtil.isBlank(docsId)) {
            return;
        }
        // remove from embedding store
        List<String> vectorIds = knowledgeService.listSliceVectorIdsOfDoc(docsId);
        if (vectorIds.isEmpty()) {
            return;
        }
        LlmDocs docs = docsMapper.selectById(docsId);
        EmbeddingStore<TextSegment> embeddingStore = embeddingProvider.getEmbeddingStore(docs.getKnowledgeId());
        embeddingStore.removeAll(vectorIds);
        // remove from docSlice
        knowledgeService.removeSlicesOfDoc(docsId);
    }

    @Override
    public void embedDocsSlice(LlmDocs data, String url) {
        try {
            List<EmbeddingR> list = documentEmbeddingService.embeddingDocs(
                    new ChatReq()
                            .setDocsName(data.getName())
                            .setKnowledgeId(data.getKnowledgeId())
                            .setUrl(url));
            for (int i = 0; i < list.size(); i++) {
                EmbeddingR r = list.get(i);
                knowledgeService.addDocsSlice(new LlmDocsSlice()
                        .setKnowledgeId(data.getKnowledgeId())
                        .setDocsId(data.getId())
                        .setVectorId(r.getVectorId())
                        .setName(data.getName())
                        .setContent(r.getText())
                        .setChunkIndex(i)
                );
            }
            knowledgeService.updateDocs(new LlmDocs().setId(data.getId()).setSliceStatus(true).setSliceNum(list.size()));
        } catch (Exception e) {
            log.error("文档切片处理失败，docsId={}, name={}", data.getId(), data.getName(), e);
            knowledgeService.updateDocs(new LlmDocs().setId(data.getId()).setSliceStatus(true).setSliceNum(0));
        }
    }

    @Override
    public List<Map<String, Object>> search(LlmDocs data) {
        if (StrUtil.isBlank(data.getKnowledgeId()) || StrUtil.isBlank(data.getContent())) {
            return Collections.emptyList();
        }

        EmbeddingModel embeddingModel = embeddingProvider.getEmbeddingModel(data.getKnowledgeId());
        EmbeddingStore<TextSegment> embeddingStore = embeddingProvider.getEmbeddingStore(data.getKnowledgeId());
        Embedding queryEmbedding = embeddingModel.embed(data.getContent()).content();
        Filter filter = metadataKey(KNOWLEDGE).isEqualTo(data.getKnowledgeId());
        EmbeddingSearchResult<TextSegment> list = embeddingStore.search(EmbeddingSearchRequest
                .builder()
                .queryEmbedding(queryEmbedding)
                .filter(filter)
                .build());

        List<Map<String, Object>> result = new ArrayList<>();
        list.matches().forEach(i -> {
            TextSegment embedded = i.embedded();
            Map<String, Object> map = embedded.metadata().toMap();
            map.put("text", embedded.text());
            map.put("score", i.score());
            result.add(map);
        });
        return result;
    }

    @Override
    public List<Map<String, Object>> search(SearchRequest request) {
        if (StrUtil.isBlank(request.getKnowledgeId()) || StrUtil.isBlank(request.getContent())) {
            return Collections.emptyList();
        }

        // 读取知识库检索配置作为默认值
        int topK = 5;
        double minScore = 0.0;
        LlmKnowledge knowledgeConfig = embeddingProvider.getKnowledgeConfig(request.getKnowledgeId());
        if (knowledgeConfig != null && knowledgeConfig.getRetrievalConfig() != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> config = mapper.readValue(knowledgeConfig.getRetrievalConfig(),
                        new TypeReference<Map<String, Object>>() {});
                if (config.get("topK") != null) {
                    topK = ((Number) config.get("topK")).intValue();
                }
                if (config.get("similarityThreshold") != null) {
                    minScore = ((Number) config.get("similarityThreshold")).doubleValue();
                }
            } catch (Exception e) {
                log.warn("解析检索配置失败: {}", e.getMessage());
            }
        }

        // 请求参数覆盖默认配置
        if (request.getTopK() != null && request.getTopK() > 0) {
            topK = request.getTopK();
        }
        if (request.getSimilarityThreshold() != null && request.getSimilarityThreshold() >= 0) {
            minScore = request.getSimilarityThreshold();
        }

        EmbeddingModel embeddingModel = embeddingProvider.getEmbeddingModel(request.getKnowledgeId());
        EmbeddingStore<TextSegment> embeddingStore = embeddingProvider.getEmbeddingStore(request.getKnowledgeId());
        Embedding queryEmbedding = embeddingModel.embed(request.getContent()).content();
        Filter filter = metadataKey(KNOWLEDGE).isEqualTo(request.getKnowledgeId());

        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(EmbeddingSearchRequest
                .builder()
                .queryEmbedding(queryEmbedding)
                .filter(filter)
                .maxResults(topK)
                .minScore(minScore)
                .build());

        List<Map<String, Object>> result = new ArrayList<>();
        searchResult.matches().forEach(i -> {
            TextSegment embedded = i.embedded();
            Map<String, Object> map = new HashMap<>(embedded.metadata().toMap());
            map.put("text", embedded.text());
            map.put("score", i.score());
            result.add(map);
        });
        return result;
    }
}
