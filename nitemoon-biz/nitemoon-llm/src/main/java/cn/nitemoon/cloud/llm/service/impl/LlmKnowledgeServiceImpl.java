

package cn.nitemoon.cloud.llm.service.impl;

import cn.nitemoon.cloud.llm.entity.LlmDocs;
import cn.nitemoon.cloud.llm.entity.LlmDocsSlice;
import cn.nitemoon.cloud.llm.entity.LlmKnowledge;
import cn.nitemoon.cloud.llm.mapper.LlmDocsMapper;
import cn.nitemoon.cloud.llm.mapper.LlmDocsSliceMapper;
import cn.nitemoon.cloud.llm.mapper.LlmKnowledgeMapper;
import cn.nitemoon.cloud.llm.service.LlmKnowledgeService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author hetao
 * @date 2025/05/15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LlmKnowledgeServiceImpl extends ServiceImpl<LlmKnowledgeMapper, LlmKnowledge> implements LlmKnowledgeService {

    private final LlmDocsMapper docsMapper;
    private final LlmDocsSliceMapper docsSliceMapper;

    @Override
    @Transactional
    public void addDocs(LlmDocs data) {
        data.setCreateTime(new Date());
        docsMapper.insert(data);
    }

    @Override
    @Transactional
    public void updateDocs(LlmDocs data) {
        docsMapper.updateById(data);
    }

    @Override
    @Transactional
    public void addDocsSlice(LlmDocsSlice data) {
        data.setCreateTime(new Date())
                .setWordNum(data.getContent().length())
                .setStatus(true)
        ;
        docsSliceMapper.insert(data);
    }

    @Override
    @Transactional
    public void updateDocsSlice(LlmDocsSlice data) {
        docsSliceMapper.updateById(data);
    }

    @Override
    public List<String> listSliceVectorIdsOfDoc(String docsId) {
        LambdaQueryWrapper<LlmDocsSlice> selectWrapper = Wrappers.<LlmDocsSlice>lambdaQuery()
                .select(LlmDocsSlice::getVectorId)
                .eq(LlmDocsSlice::getDocsId, docsId);
        List<String> vectorIds = docsSliceMapper.selectList(selectWrapper)
                .stream()
                .map(LlmDocsSlice::getVectorId)
                .collect(Collectors.toList());
        log.debug("slices of doc: [{}], count: [{}]", docsId, vectorIds.size());
        return vectorIds;
    }

    @Override
    public List<LlmDocs> getDocsByKb(String knowledgeId) {
        return docsMapper.selectList(Wrappers.<LlmDocs>lambdaQuery()
                .eq(LlmDocs::getKnowledgeId, knowledgeId));
    }

    @Override
    @Transactional
    public void removeKnowledge(String knowledgeId) {
        baseMapper.deleteById(knowledgeId);
        // del docs & docsSlice
        List<String> docsIds = getDocsByKb(knowledgeId).stream().map(LlmDocs::getId).collect(Collectors.toList());
        docsIds.forEach(this::removeSlicesOfDoc);
    }

    @Override
    @Transactional
    public void removeSlicesOfDoc(String docsId) {
        LambdaQueryWrapper<LlmDocsSlice> deleteWrapper = Wrappers.<LlmDocsSlice>lambdaQuery()
                .eq(LlmDocsSlice::getDocsId, docsId);
        int count = docsSliceMapper.delete(deleteWrapper);
        log.debug("remove all slices of doc: [{}], count: [{}]", docsId, count);
    }
}

