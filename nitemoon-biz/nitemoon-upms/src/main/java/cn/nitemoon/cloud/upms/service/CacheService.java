package cn.nitemoon.cloud.upms.service;

import cn.nitemoon.cloud.upms.api.dto.cache.CacheInfoVo;
import cn.nitemoon.cloud.upms.api.dto.cache.CacheKeyQuery;
import cn.nitemoon.cloud.upms.api.dto.cache.CacheKeyVo;
import cn.nitemoon.cloud.upms.api.dto.cache.CacheMemoryVo;
import com.baomidou.mybatisplus.core.metadata.IPage;

public interface CacheService {

    /**
     * 获取缓存基本信息
     */
    CacheInfoVo getCacheInfo();

    /**
     * 获取内存信息
     */
    CacheMemoryVo getMemoryInfo();

    /**
     * 获取缓存键列表
     */
    IPage<CacheKeyVo> getKeyList(CacheKeyQuery query);

    /**
     * 清空缓存
     */
    void clearCache();
}
