package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.KnowledgeRetrievalNodeConfig;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.provider.EmbeddingProvider;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static cn.nitemoon.cloud.llm.constants.EmbedConst.KNOWLEDGE;
import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

@Slf4j
public class KnowledgeRetrievalWfNode extends AbstractLlmWfNode {

    private final EmbeddingProvider embeddingProvider;

    public KnowledgeRetrievalWfNode(LlmWorkflowNode node, EmbeddingProvider embeddingProvider) {
        super(node);
        this.embeddingProvider = embeddingProvider;
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        String input = getInputText(inputParams, req);

        KnowledgeRetrievalNodeConfig config = parseNodeConfig(KnowledgeRetrievalNodeConfig.class);
        if (config == null || config.getKnowledgeIds() == null || config.getKnowledgeIds().isEmpty()) {
            log.warn("KnowledgeRetrieval节点未配置知识库，跳过检索");
            return new WfNodeResult(input);
        }

        log.info("KnowledgeRetrieval节点执行, 知识库IDs: {}, 查询: {}", config.getKnowledgeIds(), input);

        try {
            Function<Query, Filter> filter = (query) -> metadataKey(KNOWLEDGE).isIn(config.getKnowledgeIds());
            EmbeddingStore<TextSegment> embeddingStore = embeddingProvider.getEmbeddingStore(config.getKnowledgeIds());
            EmbeddingModel embeddingModel = embeddingProvider.getEmbeddingModel(config.getKnowledgeIds());

            ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
                    .embeddingStore(embeddingStore)
                    .embeddingModel(embeddingModel)
                    .dynamicFilter(filter)
                    .maxResults(config.getTopK())
                    .minScore(config.getSimilarityThreshold())
                    .build();

            List<Content> contents = contentRetriever.retrieve(Query.from(input));

            if (contents.isEmpty()) {
                log.info("知识库未检索到相关内容");
                return new WfNodeResult(input);
            }

            StringBuilder contextBuilder = new StringBuilder();
            contextBuilder.append("以下是知识库检索到的相关内容:\n\n");
            for (Content content : contents) {
                TextSegment segment = content.textSegment();
                if (segment != null && segment.text() != null) {
                    contextBuilder.append(segment.text()).append("\n\n");
                }
            }
            contextBuilder.append("用户问题: ").append(input);

            String output = contextBuilder.toString();
            log.info("知识库检索完成，检索到 {} 条相关内容", contents.size());
            WfNodeResult result = new WfNodeResult(output);
            result.putOutputParam("retrieval_result", output);
            result.putOutputParam("doc_count", contents.size());
            return result;
        } catch (Exception e) {
            log.warn("知识库检索失败，跳过检索，错误: {}", e.getMessage());
            return new WfNodeResult(input);
        }
    }
}
