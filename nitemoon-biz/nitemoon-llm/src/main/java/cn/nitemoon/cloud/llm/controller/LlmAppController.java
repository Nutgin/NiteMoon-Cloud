package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.lang.Dict;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmApp;
import cn.nitemoon.cloud.llm.entity.LlmAppApi;
import cn.nitemoon.cloud.llm.entity.LlmWorkflow;
import cn.nitemoon.cloud.llm.service.LlmAppApiService;
import cn.nitemoon.cloud.llm.service.LlmAppService;
import cn.nitemoon.cloud.llm.service.LlmWorkflowService;
import cn.nitemoon.cloud.llm.store.AppStore;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/app")
@Tag(name = "AI应用管理")
public class LlmAppController {

    private final LlmAppService appService;
    private final LlmAppApiService appApiService;
    private final LlmWorkflowService llmWorkflowService;
    private final AppStore appStore;

    @GetMapping("/channel/api/{appId}")
    @Operation(description = "获取应用API配置")
    public Result<LlmAppApi> getApiChanel(@PathVariable String appId) {
        List<LlmAppApi> list = appApiService.list(Wrappers.<LlmAppApi>lambdaQuery().eq(LlmAppApi::getAppId, appId));
        return Result.success(list.isEmpty() ? null : list.get(0));
    }

    @GetMapping("/list")
    @Operation(description = "获取应用列表")
    public Result<List<LlmApp>> list(LlmApp data) {
        return Result.success(appService.list(data));
    }

    @GetMapping("/page")
    @Operation(description = "分页查询应用")
    public Result<Dict> page(LlmApp data, QueryRequest queryPage) {
        return Result.success(MybatisUtil.getData(appService.page(MybatisUtil.wrap(data, queryPage),
                Wrappers.<LlmApp>lambdaQuery()
                        .like(StringUtils.isNotEmpty(data.getName()), LlmApp::getName, data.getName())
        )));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取应用详情")
    public Result<LlmApp> findById(@PathVariable String id) {
        LlmApp app = appService.getById(id);
        return Result.success(app);
    }

    @PostMapping
    @Operation(description = "新增应用")
    //@SaCheckPermission("aigc:app:add")
    public Result add(@RequestBody LlmApp data) {
        data.setCreateTime(new Date());
        data.setSaveTime(new Date());
        appService.save(data);

        // 自动创建默认工作流
        LlmWorkflow workflow = llmWorkflowService.createForApp(data.getId());
        data.setWorkflowUuid(workflow.getUuid());
        appService.updateById(data);

        appStore.init();
        return Result.success();
    }

    @PutMapping
    @Operation(description = "修改应用")
    //@SaCheckPermission("aigc:app:update")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmApp data) {
        data.setSaveTime(new Date());
        appService.updateById(data);
        appStore.init();
        return Result.success();
    }

    @PutMapping("/webpage/toggle/{id}")
    @Operation(description = "切换web页面状态")
    @DemoTrail(onlyView = true)
    public Result<String> toggleWebPage(@PathVariable String id) {
        LlmApp app = appService.getById(id);
        if (app == null) {
            return Result.fail("应用不存在");
        }
        boolean newState = !Boolean.TRUE.equals(app.getEnableWebPage());
        app.setEnableWebPage(newState);
        app.setSaveTime(new Date());

        if (newState) {
            // 启用时生成新密钥
            app.setWebPageKey(UUID.randomUUID().toString().replace("-", ""));
        } else {
            // 禁用时清除密钥
            app.setWebPageKey(null);
        }

        appService.updateById(app);
        appStore.init();

        // 返回密钥（禁用时返回null）
        return Result.success(app.getWebPageKey());
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除应用")
    //@SaCheckPermission("aigc:app:delete")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        appService.removeById(id);
        appStore.init();
        return Result.success();
    }
}
