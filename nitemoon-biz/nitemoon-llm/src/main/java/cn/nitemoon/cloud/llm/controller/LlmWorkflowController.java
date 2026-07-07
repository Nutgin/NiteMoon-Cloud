package cn.nitemoon.cloud.llm.controller;

import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.dto.LlmWorkflowResp;
import cn.nitemoon.cloud.llm.dto.LlmWorkflowUpdateReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflow;
import cn.nitemoon.cloud.llm.service.LlmWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/aigc/workflow")
@RestController
@RequiredArgsConstructor
@Tag(name = "工作流管理接口")
public class LlmWorkflowController {

    private final LlmWorkflowService llmWorkflowService;

    @GetMapping("/detail/{appId}")
    @Operation(description = "根据应用ID获取工作流画布")
    public Result<LlmWorkflowResp> getDetailByAppId(@PathVariable String appId) {
        return Result.success(llmWorkflowService.getDetailByAppId(appId));
    }

    @PostMapping("/update")
    @Operation(description = "保存工作流画布")
    @DemoTrail(onlyView = true)
    public Result<LlmWorkflowResp> update(@RequestBody @Valid LlmWorkflowUpdateReq req) {
        return Result.success(llmWorkflowService.update(req));
    }

    @PostMapping("/create/{appId}")
    @Operation(description = "为应用创建工作流")
    public Result<LlmWorkflow> createForApp(@PathVariable String appId) {
        return Result.success(llmWorkflowService.createForApp(appId));
    }
}
