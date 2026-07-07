package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.event.ProviderRefreshEvent;
import cn.nitemoon.cloud.llm.service.LlmModelService;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author hetao
 * @date 2025/05/15
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/model")
@Tag(name = "AI模型管理")
public class LlmModelController {

    private final LlmModelService modelService;
    private final ApplicationContext applicationContext;

    @GetMapping("/list")
    @Operation(description = "获取模型列表")
    public Result<List<LlmModel>> list(LlmModel data) {
        return Result.success(modelService.list(data));
    }

    @GetMapping("/page")
    @Operation(description = "分页查询模型")
    public Result list(LlmModel data, QueryRequest queryPage) {
        Page<LlmModel> iPage = modelService.page(data, queryPage);
        return Result.success(MybatisUtil.getData(iPage));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取模型详情")
    public Result<LlmModel> findById(@PathVariable String id) {
        return Result.success(modelService.selectById(id));
    }

    @PostMapping
    @Operation(description = "添加模型")
    //@SaCheckPermission("aigc:model:add")
    public Result add(@RequestBody LlmModel data) {
        if (StrUtil.isNotBlank(data.getApiKey()) && data.getApiKey().contains("*")) {
            data.setApiKey(null);
        }
        if (StrUtil.isNotBlank(data.getSecretKey()) && data.getSecretKey().contains("*")) {
            data.setSecretKey(null);
        }
        modelService.save(data);
        applicationContext.publishEvent(new ProviderRefreshEvent(data));
        return Result.success();
    }

    @PutMapping
    @Operation(description = "修改模型")
    //@SaCheckPermission("aigc:model:update")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmModel data) {
        if (StrUtil.isNotBlank(data.getApiKey()) && data.getApiKey().contains("*")) {
            data.setApiKey(null);
        }
        if (StrUtil.isNotBlank(data.getSecretKey()) && data.getSecretKey().contains("*")) {
            data.setSecretKey(null);
        }
        modelService.updateById(data);
        applicationContext.publishEvent(new ProviderRefreshEvent(data));
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除模型")
    //@SaCheckPermission("aigc:model:delete")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        modelService.removeById(id);

        // Delete dynamically registered beans, according to ID
        BeanDefinitionRegistry beanDefinitionRegistry =
                (BeanDefinitionRegistry) applicationContext.getAutowireCapableBeanFactory();

        if (beanDefinitionRegistry.containsBeanDefinition(id)) {
            beanDefinitionRegistry.removeBeanDefinition(id);
        }
        applicationContext.publishEvent(new ProviderRefreshEvent(null));
        return Result.success();
    }
}

