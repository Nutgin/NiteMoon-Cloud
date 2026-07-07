package cn.nitemoon.cloud.llm.controller;

import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmDocs;
import cn.nitemoon.cloud.llm.mapper.LlmDocsMapper;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.llm.service.EmbeddingService;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author hetao
 * @date 2025/05/15
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/docs")
@Tag(name = "AI文档管理")
public class LlmDocsController {

    private final LlmDocsMapper docsMapper;
    private final EmbeddingService embeddingService;

    @GetMapping("/list")
    public Result<List<LlmDocs>> list(LlmDocs data) {
        return Result.success(docsMapper.selectList(Wrappers.<LlmDocs>lambdaQuery().orderByDesc(LlmDocs::getCreateTime)));
    }

    @GetMapping("/page")
    public Result list(LlmDocs data, QueryRequest queryPage) {
        Page<LlmDocs> page = new Page<>(queryPage.getPageNum(), queryPage.getPageSize());
        return Result.success(MybatisUtil.getData(docsMapper.selectPage(page, Wrappers.<LlmDocs>lambdaQuery()
                .like(data.getName()!= null, LlmDocs::getName, data.getName())
                .eq(data.getKnowledgeId() != null, LlmDocs::getKnowledgeId, data.getKnowledgeId())
                .eq(data.getSliceStatus() != null, LlmDocs::getSliceStatus, data.getSliceStatus())
                .orderByDesc(LlmDocs::getCreateTime)
        )));
    }

    @GetMapping("/{id}")
    public Result<LlmDocs> findById(@PathVariable String id) {
        return Result.success(docsMapper.selectById(id));
    }

    @PostMapping
//    @ApiLog("新增文档")
    //@SaCheckPermission("aigc:docs:add")
    public Result add(@RequestBody LlmDocs data) {
        docsMapper.insert(data);
        return Result.success();
    }

    @PutMapping
//    @ApiLog("修改文档")
    //@SaCheckPermission("aigc:docs:update")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmDocs data) {
        docsMapper.updateById(data);
        return Result.success();
    }

    @DeleteMapping("/{id}")
//    @ApiLog("删除文档")
    //@SaCheckPermission("aigc:docs:delete")
    @Transactional
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        // 删除切面数据
        embeddingService.clearDocSlices(id);

        // 删除文档
        docsMapper.deleteById(id);
        return Result.success();
    }
}

