package cn.nitemoon.cloud.llm.dubbo;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.api.dto.LlmDocsDTO;
import cn.nitemoon.cloud.llm.api.dto.LlmDocsSliceDTO;
import cn.nitemoon.cloud.llm.api.dto.LlmModelDTO;
import cn.nitemoon.cloud.llm.api.remote.RemoteLlmService;
import cn.nitemoon.cloud.llm.entity.LlmDocs;
import cn.nitemoon.cloud.llm.entity.LlmDocsSlice;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.mapper.LlmDocsMapper;
import cn.nitemoon.cloud.llm.mapper.LlmDocsSliceMapper;
import cn.nitemoon.cloud.llm.service.LlmModelService;
import cn.nitemoon.cloud.llm.service.EmbeddingService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * LLM远程服务实现
 *
 * @author hetao
 */
@Service
@DubboService
@RequiredArgsConstructor
public class RemoteLlmServiceImpl implements RemoteLlmService {

    private final LlmModelService llmModelService;
    private final LlmDocsMapper docsMapper;
    private final LlmDocsSliceMapper docsSliceMapper;
    private final EmbeddingService embeddingService;

    @Override
    public List<LlmModelDTO> getChatModels() {
        return llmModelService.getChatModels().stream()
                .map(this::toModelDTO)
                .collect(Collectors.toList());
    }

    @Override
    public LlmModelDTO getModelByName(String modelName) {
        LlmModel model = llmModelService.getOne(
                new LambdaQueryWrapper<LlmModel>().eq(LlmModel::getName, modelName));
        return model != null ? toModelDTO(model) : null;
    }

    @Override
    public LlmModelDTO getModelByModelName(String modelName) {
        LlmModel model = llmModelService.getOne(
                new LambdaQueryWrapper<LlmModel>().eq(LlmModel::getModel, modelName));
        return model != null ? toModelDTO(model) : null;
    }

    @Override
    public LlmModelDTO getDefaultChatModel() {
        LlmModel model = llmModelService.getOne(
                new LambdaQueryWrapper<LlmModel>().eq(LlmModel::getType, "CHAT")
                        .last("LIMIT 1"));
        return model != null ? toModelDTO(model) : null;
    }

    @Override
    public LlmModelDTO getModelById(String id) {
        LlmModel model = llmModelService.selectByIdRaw(id);
        return model != null ? toModelDTO(model) : null;
    }

    @Override
    public List<LlmDocsSliceDTO> listSlicesByDocsId(String docsId) {
        return docsSliceMapper.selectList(
                new LambdaQueryWrapper<LlmDocsSlice>().eq(LlmDocsSlice::getDocsId, docsId))
                .stream()
                .map(this::toDocsSliceDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LlmDocsSliceDTO> listSlicesByKnowledgeId(String knowledgeId) {
        return docsSliceMapper.selectList(
                new LambdaQueryWrapper<LlmDocsSlice>().eq(LlmDocsSlice::getKnowledgeId, knowledgeId))
                .stream()
                .map(this::toDocsSliceDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<LlmDocsSliceDTO> listSlicesByKnowledgeIdBeforeTime(String knowledgeId, Date beforeTime) {
        return docsSliceMapper.selectList(
                new LambdaQueryWrapper<LlmDocsSlice>()
                        .eq(LlmDocsSlice::getKnowledgeId, knowledgeId)
                        .le(beforeTime != null, LlmDocsSlice::getCreateTime, beforeTime))
                .stream()
                .map(this::toDocsSliceDTO)
                .collect(Collectors.toList());
    }

    @Override
    public LlmDocsDTO getDocsById(String docsId) {
        LlmDocs docs = docsMapper.selectById(docsId);
        return docs != null ? toDocsDTO(docs) : null;
    }

    @Override
    public List<Map<String, Object>> searchEmbeddings(String knowledgeId, String content, int maxResults) {
        if (StrUtil.isBlank(knowledgeId) || StrUtil.isBlank(content)) {
            return Collections.emptyList();
        }

        try {
            LlmDocs query = new LlmDocs();
            query.setKnowledgeId(knowledgeId);
            query.setContent(content);

            List<Map<String, Object>> results = embeddingService.search(query);

            if (results.size() > maxResults) {
                results = results.subList(0, maxResults);
            }

            return results;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private LlmModelDTO toModelDTO(LlmModel entity) {
        return BeanUtil.copyProperties(entity, LlmModelDTO.class);
    }

    private LlmDocsDTO toDocsDTO(LlmDocs entity) {
        return BeanUtil.copyProperties(entity, LlmDocsDTO.class);
    }

    private LlmDocsSliceDTO toDocsSliceDTO(LlmDocsSlice entity) {
        return BeanUtil.copyProperties(entity, LlmDocsSliceDTO.class);
    }
}
