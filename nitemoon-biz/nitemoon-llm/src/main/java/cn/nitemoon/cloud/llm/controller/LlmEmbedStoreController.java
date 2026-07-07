package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.lang.Dict;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmEmbedStore;
import cn.nitemoon.cloud.llm.event.EmbeddingRefreshEvent;
import cn.nitemoon.cloud.llm.service.LlmEmbedStoreService;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author hetao
 * @date 2025/05/15
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/aigc/embed-store")
@Tag(name = "AI向量存储管理")
public class LlmEmbedStoreController {

    private final ApplicationContext applicationContext;
    private final LlmEmbedStoreService embedStoreService;

    @GetMapping("/list")
    public Result<List<LlmEmbedStore>> list(LlmEmbedStore data) {
        List<LlmEmbedStore> list = embedStoreService.list(Wrappers.lambdaQuery());
        list.forEach(this::hide);
        return Result.success(list);
    }

    @GetMapping("/page")
    public Result<Dict> page(LlmEmbedStore embedStore, QueryRequest queryPage) {
        IPage<LlmEmbedStore> page = embedStoreService.page(MybatisUtil.wrap(embedStore, queryPage),
                Wrappers.lambdaQuery());
        page.getRecords().forEach(this::hide);
        return Result.success(MybatisUtil.getData(page));
    }

    @GetMapping("/{id}")
    public Result<LlmEmbedStore> findById(@PathVariable String id) {
        LlmEmbedStore store = embedStoreService.getById(id);
        hide(store);
        return Result.success(store);
    }

    @PostMapping
//    @ApiLog("新增向量库")
    //@SaCheckPermission("aigc:embed-store:add")
    public Result<LlmEmbedStore> add(@RequestBody LlmEmbedStore data) {
        if (StrUtil.isNotBlank(data.getPassword()) && data.getPassword().contains("*")) {
            data.setPassword(null);
        }
        embedStoreService.save(data);
        applicationContext.publishEvent(new EmbeddingRefreshEvent(data));
        return Result.success();
    }

    @PutMapping
//    @ApiLog("修改向量库")
    //@SaCheckPermission("aigc:embed-store:update")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmEmbedStore data) {
        if (StrUtil.isNotBlank(data.getPassword()) && data.getPassword().contains("*")) {
            data.setPassword(null);
        }
        embedStoreService.updateById(data);
        applicationContext.publishEvent(new EmbeddingRefreshEvent(data));
        return Result.success();
    }

    @DeleteMapping("/{id}")
//    @ApiLog("删除向量库")
    //@SaCheckPermission("aigc:embed-store:delete")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        LlmEmbedStore store = embedStoreService.getById(id);
        if (store != null) {
            embedStoreService.removeById(id);
            BeanDefinitionRegistry beanDefinitionRegistry =
                    (BeanDefinitionRegistry) applicationContext.getAutowireCapableBeanFactory();

            if (beanDefinitionRegistry.containsBeanDefinition(id)) {
                beanDefinitionRegistry.removeBeanDefinition(id);
            }
            applicationContext.publishEvent(new EmbeddingRefreshEvent(null));
        }
        return Result.success();
    }

    private void hide(LlmEmbedStore data) {
        if (data == null || StrUtil.isBlank(data.getPassword())) {
            return;
        }
        String key = StrUtil.hide(data.getPassword(), 0, data.getPassword().length());
        data.setPassword(key);
    }
}
