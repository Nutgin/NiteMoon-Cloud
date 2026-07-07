package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.lang.Dict;
import cn.nitemoon.cloud.llm.entity.LlmExecution;
import cn.nitemoon.cloud.llm.entity.LlmExecutionNode;
import cn.nitemoon.cloud.llm.service.LlmExecutionNodeService;
import cn.nitemoon.cloud.llm.service.LlmExecutionService;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;

import java.util.Map;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/execution")
@Tag(name = "执行记录管理")
public class LlmExecutionController {

    private final LlmExecutionService executionService;
    private final LlmExecutionNodeService nodeService;

    @GetMapping("/page")
    @Operation(description = "分页查询执行记录")
    public Result<Dict> page(LlmExecution data, QueryRequest queryPage) {
        return Result.success(MybatisUtil.getData(executionService.page(MybatisUtil.wrap(data, queryPage),
                Wrappers.<LlmExecution>lambdaQuery()
                        .eq(StringUtils.isNotEmpty(data.getAppId()), LlmExecution::getAppId, data.getAppId())
                        .eq(StringUtils.isNotEmpty(data.getStatus()), LlmExecution::getStatus, data.getStatus())
                        .eq(StringUtils.isNotEmpty(data.getTriggerType()), LlmExecution::getTriggerType, data.getTriggerType())
                        .orderByDesc(LlmExecution::getCreateTime)
        )));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取执行记录详情（含节点）")
    public Result findById(@PathVariable String id) {
        Map<String, Object> result = executionService.getWithNodes(id);
        if (result == null) {
            return Result.fail("执行记录不存在");
        }
        return Result.success(result);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除执行记录")
    public Result delete(@PathVariable String id) {
        nodeService.remove(Wrappers.<LlmExecutionNode>lambdaQuery()
                .eq(LlmExecutionNode::getExecutionId, id));
        executionService.removeById(id);
        return Result.success();
    }
}
