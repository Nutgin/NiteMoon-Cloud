package cn.nitemoon.cloud.llm.controller;

import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmTool;
import cn.nitemoon.cloud.llm.service.LlmToolService;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/tool")
@Tag(name = "自定义工具管理")
public class LlmToolController {

    private final LlmToolService toolService;

    @GetMapping("/list")
    @Operation(description = "获取工具列表")
    public Result<List<LlmTool>> list() {
        List<LlmTool> list = toolService.list(Wrappers.<LlmTool>lambdaQuery()
                .eq(LlmTool::getIsDeleted, false));
        return Result.success(list);
    }

    @GetMapping("/page")
    @Operation(description = "分页查询工具")
    public Result page(QueryRequest queryPage) {
        Page<LlmTool> page = new Page<>(queryPage.getPageNum(), queryPage.getPageSize());
        Page<LlmTool> iPage = toolService.page(page, Wrappers.<LlmTool>lambdaQuery()
                .eq(LlmTool::getIsDeleted, false));
        return Result.success(MybatisUtil.getData(iPage));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取工具详情")
    public Result<LlmTool> findById(@PathVariable String id) {
        return Result.success(toolService.getById(id));
    }

    @PostMapping
    @Operation(description = "添加工具")
    public Result add(@RequestBody LlmTool data) {
        data.setIsDeleted(false);
        toolService.save(data);
        return Result.success();
    }

    @PutMapping
    @Operation(description = "修改工具")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmTool data) {
        toolService.updateById(data);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除工具")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        LlmTool tool = new LlmTool();
        tool.setId(id);
        tool.setIsDeleted(true);
        toolService.updateById(tool);
        return Result.success();
    }
}
