

package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.entity.LlmDocs;
import cn.nitemoon.cloud.llm.entity.LlmDocsSlice;
import cn.nitemoon.cloud.llm.entity.LlmKnowledge;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * @author hetao
 * @date 2025/05/15
 */
public interface LlmKnowledgeService extends IService<LlmKnowledge> {

    void addDocs(LlmDocs data);

    void updateDocs(LlmDocs data);

    void addDocsSlice(LlmDocsSlice data);

    void updateDocsSlice(LlmDocsSlice data);

    List<String> listSliceVectorIdsOfDoc(String docsId);

    List<LlmDocs> getDocsByKb(String knowledgeId);

    void removeKnowledge(String knowledgeId);

    void removeSlicesOfDoc(String docsId);
}

