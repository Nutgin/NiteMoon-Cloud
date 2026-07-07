package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmDocs;
import cn.nitemoon.cloud.llm.entity.LlmEmbedStore;
import cn.nitemoon.cloud.llm.entity.LlmKnowledge;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.mapper.LlmDocsMapper;
import cn.nitemoon.cloud.llm.provider.EmbeddingProvider;
import cn.nitemoon.cloud.llm.provider.KnowledgeStoreFactory;
import cn.nitemoon.cloud.llm.service.LlmEmbedStoreService;
import cn.nitemoon.cloud.llm.service.LlmKnowledgeService;
import cn.nitemoon.cloud.llm.service.LlmModelService;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author hetao
 * @date 2025/05/15
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/knowledge")
@Tag(name = "AI知识库管理")
public class LlmKnowledgeController {

    private final LlmKnowledgeService kbService;
    private final LlmDocsMapper docsMapper;
    private final LlmEmbedStoreService embedStoreService;
    private final LlmModelService modelService;
    private final EmbeddingProvider embeddingProvider;
    private final KnowledgeStoreFactory knowledgeStore;

    @GetMapping("/list")
    @Operation(description = "获取知识库列表")
    public Result<List<LlmKnowledge>> list(LlmKnowledge data) {
        List<LlmKnowledge> list = kbService.list(Wrappers.<LlmKnowledge>lambdaQuery().orderByDesc(LlmKnowledge::getCreateTime));
        build(list);
        return Result.success(list);
    }

    private void build(List<LlmKnowledge> records) {
        Map<String, List<LlmEmbedStore>> embedStoreMap = embedStoreService.list().stream().collect(Collectors.groupingBy(LlmEmbedStore::getId));
        Map<String, List<LlmModel>> embedModelMap = modelService.list().stream().collect(Collectors.groupingBy(LlmModel::getId));
        Map<String, List<LlmDocs>> docsMap = docsMapper.selectList(Wrappers.lambdaQuery()).stream().collect(Collectors.groupingBy(LlmDocs::getKnowledgeId));
        records.forEach(item -> {
            List<LlmDocs> docs = docsMap.get(item.getId());
            if (docs != null) {
                item.setDocsNum(docs.size());
                item.setTotalSize(docs.stream().filter(d -> d.getSize() != null).mapToLong(LlmDocs::getSize).sum());
            }
            if (item.getEmbedModelId() != null) {
                List<LlmModel> list = embedModelMap.get(item.getEmbedModelId());
                if (list != null) {
                    LlmModel model = list.get(0);
                    hideApiKey(model);
                    item.setEmbedModel(model);
                }
            }
            if (item.getEmbedStoreId() != null) {
                List<LlmEmbedStore> list = embedStoreMap.get(item.getEmbedStoreId());
                item.setEmbedStore(list == null ? null : list.get(0));
            }
        });
    }

    private void hideApiKey(LlmModel model) {
        if (model == null || StrUtil.isBlank(model.getApiKey())) {
            return;
        }
        String key = StrUtil.hide(model.getApiKey(), 3, model.getApiKey().length() - 4);
        model.setApiKey(key);

        if (StrUtil.isBlank(model.getSecretKey())) {
            return;
        }
        String sec = StrUtil.hide(model.getSecretKey(), 3, model.getSecretKey().length() - 4);
        model.setSecretKey(sec);
    }

    @GetMapping("/page")
    @Operation(description = "分页查询知识库")
    public Result list(LlmKnowledge data, QueryRequest queryPage) {
        Page<LlmKnowledge> page = new Page<>(queryPage.getPageNum(), queryPage.getPageSize());
        LambdaQueryWrapper<LlmKnowledge> queryWrapper = Wrappers.<LlmKnowledge>lambdaQuery()
                .like(!StrUtil.isBlank(data.getName()), LlmKnowledge::getName, data.getName())
                .orderByDesc(LlmKnowledge::getCreateTime);
        Page<LlmKnowledge> iPage = kbService.page(page, queryWrapper);

        build(iPage.getRecords());

        return Result.success(MybatisUtil.getData(iPage));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取知识库")
    public Result<LlmKnowledge> findById(@PathVariable String id) {
        LlmKnowledge knowledge = kbService.getById(id);
        build(Collections.singletonList(knowledge));
        return Result.success(knowledge);
    }

    @PostMapping
    @Operation(description = "新增知识库")
    //@SaCheckPermission("aigc:knowledge:add")
    public Result add(@RequestBody LlmKnowledge data) {
        data.setCreateTime(String.valueOf(System.currentTimeMillis()));
        kbService.save(data);
        knowledgeStore.refreshKnowledge(data.getId());
        return Result.success();
    }

    @PutMapping
    @Operation(description = "更新知识库")
    //@SaCheckPermission("aigc:knowledge:update")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmKnowledge data) {
        kbService.updateById(data);
        knowledgeStore.refreshKnowledge(data.getId());
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除知识库")
    //@SaCheckPermission("aigc:knowledge:delete")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        kbService.removeKnowledge(id);
        knowledgeStore.init();
        return Result.success();
    }
}

