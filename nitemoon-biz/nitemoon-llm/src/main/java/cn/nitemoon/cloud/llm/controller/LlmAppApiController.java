package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.lang.Dict;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.constants.AppConst;
import cn.nitemoon.cloud.llm.entity.LlmAppApi;
import cn.nitemoon.cloud.llm.service.LlmAppApiService;
import cn.nitemoon.cloud.llm.store.AppChannelStore;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/app/api")
@Tag(name = "AI应用API管理")
public class LlmAppApiController {

    private final LlmAppApiService appApiService;
    private final AppChannelStore appChannelStore;

    @GetMapping("/create/{id}/{channel}")
    @Operation(description = "创建应用API")
    public Result<Void> create(@PathVariable String id, @PathVariable String channel) {
        String uuid = AppConst.PREFIX + IdUtil.simpleUUID();
        appApiService.save(new LlmAppApi()
                .setAppId(id)
                .setApiKey(uuid)
                .setChannel(channel)
                .setCreateTime(new Date()));
        appChannelStore.init();
        return Result.success();
    }

    @GetMapping("/list")
    @Operation(description = "获取API列表")
    public Result<List<LlmAppApi>> list(LlmAppApi data) {
        List<LlmAppApi> list = appApiService.list(Wrappers.<LlmAppApi>lambdaQuery()
                .eq(StrUtil.isNotBlank(data.getAppId()), LlmAppApi::getAppId, data.getAppId())
                .eq(StrUtil.isNotBlank(data.getChannel()), LlmAppApi::getChannel, data.getChannel())
                .orderByDesc(LlmAppApi::getCreateTime));
        return Result.success(list);
    }

    @GetMapping("/page")
    @Operation(description = "分页查询API")
    public Result<Dict> page(LlmAppApi data, QueryRequest queryPage) {
        Page<LlmAppApi> p = new Page<>(queryPage.getPageNum(), queryPage.getPageSize());
        IPage<LlmAppApi> iPage = appApiService.page(p,
                Wrappers.<LlmAppApi>lambdaQuery()
                        .like(StringUtils.isNotEmpty(data.getAppId()), LlmAppApi::getAppId, data.getAppId())
                        .eq(StrUtil.isNotBlank(data.getChannel()), LlmAppApi::getChannel, data.getChannel())
                        .orderByDesc(LlmAppApi::getCreateTime));
        return Result.success(Dict.create().set("rows", iPage.getRecords()).set("total", (int) iPage.getTotal()));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取API详情")
    public Result<LlmAppApi> findById(@PathVariable String id) {
        LlmAppApi api = appApiService.getById(id);
        return Result.success(api);
    }

    @PostMapping
    @Operation(description = "新增API渠道")
    public Result add(@RequestBody LlmAppApi data) {
        data.setApiKey(AppConst.PREFIX + IdUtil.simpleUUID());
        data.setCreateTime(new Date());
        appApiService.save(data);
        appChannelStore.init();
        return Result.success();
    }

    @PutMapping
    @Operation(description = "修改API渠道")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmAppApi data) {
        appApiService.updateById(data);
        appChannelStore.init();
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除API渠道")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        appApiService.removeById(id);
        appChannelStore.init();
        return Result.success();
    }
}
