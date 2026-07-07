package cn.nitemoon.cloud.llm.controller;

import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmDocsSlice;
import cn.nitemoon.cloud.llm.mapper.LlmDocsSliceMapper;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

/**
 * @author hetao
 * @date 2025/05/15
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/docs/slice")
@Tag(name = "AI文档切片管理")
public class LlmDocsSliceController {

    private final LlmDocsSliceMapper docsSliceMapper;

    @GetMapping("/list")
    @Operation(description = "获取文档切片列表")
    public Result<List<LlmDocsSlice>> list(LlmDocsSlice data) {
        return Result.success(docsSliceMapper.selectList(Wrappers.<LlmDocsSlice>lambdaQuery().orderByDesc(LlmDocsSlice::getCreateTime)));
    }

    @GetMapping("/page")
    @Operation(description = "分页查询文档切片")
    public Result list(LlmDocsSlice data, QueryRequest queryPage) {
        Page<LlmDocsSlice> page = new Page<>(queryPage.getPageNum(), queryPage.getPageSize());
        return Result.success(MybatisUtil.getData(docsSliceMapper.selectPage(page, Wrappers.<LlmDocsSlice>lambdaQuery()
                .eq(data.getKnowledgeId() != null, LlmDocsSlice::getKnowledgeId, data.getKnowledgeId())
                .eq(data.getDocsId() != null, LlmDocsSlice::getDocsId, data.getDocsId())
                .orderByDesc(LlmDocsSlice::getCreateTime)
        )));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取文档切片")
    public Result<LlmDocsSlice> findById(@PathVariable String id) {
        return Result.success(docsSliceMapper.selectById(id));
    }

    @PostMapping
    @Operation(description = "新增文档切片")
    //@SaCheckPermission("aigc:docs:slice:add")
    public Result add(@RequestBody LlmDocsSlice data) {
        data.setCreateTime(new Date());
        docsSliceMapper.insert(data);
        return Result.success();
    }

    @PutMapping
    @Operation(description = "修改文档切片")
    //@SaCheckPermission("aigc:docs:slice:update")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmDocsSlice data) {
        docsSliceMapper.updateById(data);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除文档切片")
    //@SaCheckPermission("aigc:docs:slice:delete")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        docsSliceMapper.deleteById(id);
        return Result.success();
    }
}

