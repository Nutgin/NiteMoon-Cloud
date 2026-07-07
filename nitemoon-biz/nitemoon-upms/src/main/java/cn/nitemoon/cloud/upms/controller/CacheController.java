package cn.nitemoon.cloud.upms.controller;

import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.upms.api.dto.cache.CacheInfoVo;
import cn.nitemoon.cloud.upms.api.dto.cache.CacheKeyQuery;
import cn.nitemoon.cloud.upms.api.dto.cache.CacheKeyVo;
import cn.nitemoon.cloud.upms.api.dto.cache.CacheMemoryVo;
import cn.nitemoon.cloud.upms.service.CacheService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(description = "cache", name = "系统监控")
@RestController
@RequestMapping("/cache")
@RequiredArgsConstructor
public class CacheController {

    private final CacheService cacheService;

    @Operation(description = "获取缓存信息")
    @GetMapping("/info")
    public Result<CacheInfoVo> getCacheInfo() {
        return Result.success(cacheService.getCacheInfo());
    }

    @Operation(description = "获取内存信息")
    @GetMapping("/memory")
    public Result<CacheMemoryVo> getMemoryInfo() {
        return Result.success(cacheService.getMemoryInfo());
    }

    @Operation(description = "获取缓存键列表")
    @GetMapping("/keys")
    public Result<IPage<CacheKeyVo>> getKeyList(CacheKeyQuery query) {
        return Result.success(cacheService.getKeyList(query));
    }

    @Operation(description = "清空缓存")
    @DeleteMapping
    public Result<Void> clearCache() {
        cacheService.clearCache();
        return Result.success();
    }
}
