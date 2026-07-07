package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.dto.SearchRequest;
import cn.nitemoon.cloud.llm.entity.LlmDocs;

import java.util.List;
import java.util.Map;

/**
 * @author hetao
 * @date 2025/6/6
 */
public interface EmbeddingService {

    void clearDocSlices(String docsId);

    void embedDocsSlice(LlmDocs data, String url);

    List<Map<String, Object>> search(LlmDocs data);

    /**
     * 增强检索：支持 topK、similarityThreshold 参数
     */
    List<Map<String, Object>> search(SearchRequest request);
}
