package cn.nitemoon.cloud.llm.provider;

import cn.nitemoon.cloud.llm.entity.LlmEmbedStore;
import cn.nitemoon.cloud.llm.entity.LlmKnowledge;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.service.LlmEmbedStoreService;
import cn.nitemoon.cloud.llm.service.LlmKnowledgeService;
import cn.nitemoon.cloud.llm.service.LlmModelService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * @author hetao
 * @date 2025/10/29
 */
@Slf4j
@Component
public class KnowledgeStoreFactory {

    @Autowired
    private LlmKnowledgeService knowledgeService;
    @Autowired
    private LlmModelService modelService;
    @Autowired
    private LlmEmbedStoreService embedStoreService;

    private final Map<String, LlmKnowledge> knowledgeMap = new ConcurrentHashMap<>();

    @Async
    @PostConstruct
    public void init() {
        knowledgeMap.clear();
        List<LlmKnowledge> list = knowledgeService.list();
        Map<String, List<LlmModel>> modelMap = modelService.list().stream().collect(Collectors.groupingBy(LlmModel::getId));
        Map<String, List<LlmEmbedStore>> storeMap = embedStoreService.list().stream().collect(Collectors.groupingBy(LlmEmbedStore::getId));
        list.forEach(know -> {
            if (know.getEmbedModelId() != null) {
                List<LlmModel> models = modelMap.get(know.getEmbedModelId());
                know.setEmbedModel(models == null ? null : models.get(0));
            }
            if (know.getEmbedStoreId() != null) {
                List<LlmEmbedStore> stores = storeMap.get(know.getEmbedStoreId());
                know.setEmbedStore(stores == null ? null : stores.get(0));
            }
            knowledgeMap.put(know.getId(), know);
        });
    }

    public LlmKnowledge getKnowledge(String knowledgeId) {
        return knowledgeMap.get(knowledgeId);
    }

    public boolean containsKnowledge(String knowledgeId) {
        return knowledgeMap.containsKey(knowledgeId);
    }

    /**
     * 刷新单条知识库缓存
     */
    public void refreshKnowledge(String knowledgeId) {
        LlmKnowledge know = knowledgeService.getById(knowledgeId);
        if (know == null) {
            knowledgeMap.remove(knowledgeId);
            return;
        }
        if (know.getEmbedModelId() != null) {
            LlmModel model = modelService.getById(know.getEmbedModelId());
            know.setEmbedModel(model);
        }
        if (know.getEmbedStoreId() != null) {
            LlmEmbedStore store = embedStoreService.getById(know.getEmbedStoreId());
            know.setEmbedStore(store);
        }
        knowledgeMap.put(knowledgeId, know);
    }
}
