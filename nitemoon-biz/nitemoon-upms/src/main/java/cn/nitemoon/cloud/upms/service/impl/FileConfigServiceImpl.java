package cn.nitemoon.cloud.upms.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.io.resource.ResourceUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.nitemoon.cloud.common.core.util.JsonUtils;
import cn.nitemoon.cloud.common.core.util.ValidationUtils;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import cn.nitemoon.cloud.common.storage.core.client.FileClient;
import cn.nitemoon.cloud.common.storage.core.client.FileClientConfig;
import cn.nitemoon.cloud.common.storage.core.client.FileClientFactory;
import cn.nitemoon.cloud.common.storage.core.enums.FileStorageEnum;
import cn.nitemoon.cloud.upms.api.dto.FileConfigPageReqVO;
import cn.nitemoon.cloud.upms.api.dto.FileConfigSaveReqVO;
import cn.nitemoon.cloud.upms.api.entity.FileConfig;
import cn.nitemoon.cloud.upms.mapper.FileConfigMapper;
import cn.nitemoon.cloud.upms.service.FileConfigService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import jakarta.validation.Validator;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;


/**
 * 文件配置 Service 实现类
 */
@Service
@Validated
@Slf4j
@AllArgsConstructor
public class FileConfigServiceImpl extends ServiceImpl<FileConfigMapper, FileConfig> implements FileConfigService {

    private static final Long CACHE_MASTER_ID = 0L;

    /**
     * {@link FileClient} 缓存，通过它异步刷新 fileClientFactory
     */
    @Getter
    private final LoadingCache<Long, FileClient> clientCache = buildAsyncReloadingCache(10L, TimeUnit.MINUTES,
            new CacheLoader<Long, FileClient>() {

                @Override
                public FileClient load(Long id) {
                    FileConfig config = Objects.equals(CACHE_MASTER_ID, id) ?
                            selectByMaster() : fileConfigMapper.selectById(id);
                    if (config != null) {
                        fileClientFactory.createOrUpdateFileClient(config.getId(), config.getStorage(), config.getConfig());
                    }
                    return fileClientFactory.getFileClient(null == config ? id : config.getId());
                }

            });

    private final FileClientFactory fileClientFactory;

    private final FileConfigMapper fileConfigMapper;

    private final Validator validator;

    @Override
    public Long createFileConfig(FileConfigSaveReqVO createReqVO) {
        FileConfig fileConfig = new FileConfig();
        fileConfig.setName(createReqVO.getName());
        fileConfig.setStorage(createReqVO.getStorage());
        fileConfig.setRemark(createReqVO.getRemark());
        fileConfig.setConfig(parseClientConfig(createReqVO.getStorage(), createReqVO.getConfig()));
        fileConfig.setMaster(false); /// 默认非 master
        fileConfigMapper.insert(fileConfig);
        return fileConfig.getId();
    }

    @Override
    public void updateFileConfig(FileConfigSaveReqVO updateReqVO) {
        // 校验存在
        FileConfig config = validateFileConfigExists(updateReqVO.getId());
        // 更新
        FileConfig fileConfig = new FileConfig();
        fileConfig.setId(updateReqVO.getId());
        fileConfig.setName(updateReqVO.getName());
        fileConfig.setStorage(updateReqVO.getStorage());
        fileConfig.setRemark(updateReqVO.getRemark());
        fileConfig.setConfig(parseClientConfig(config.getStorage(), updateReqVO.getConfig()));
        fileConfigMapper.updateById(fileConfig);

        // 清空缓存
        clearCache(config.getId(), null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFileConfigMaster(Long id) {
        // 校验存在
        validateFileConfigExists(id);
        
        // 查找当前的主配置
        FileConfig currentMaster = selectByMaster();
        if (currentMaster != null && !currentMaster.getId().equals(id)) {
            // 更新当前主配置为非 master
            fileConfigMapper.updateById(new FileConfig().setId(currentMaster.getId()).setMaster(false));
        }
        
        // 更新新的主配置
        fileConfigMapper.updateById(new FileConfig().setId(id).setMaster(true));

        // 清空缓存
        clearCache(null, true);
    }

    private FileClientConfig parseClientConfig(Integer storage, Map<String, Object> config) {
        // 获取配置类
        Class<? extends FileClientConfig> configClass = FileStorageEnum.getByStorage(storage)
                .getConfigClass();
        FileClientConfig clientConfig = JsonUtils.parseObject2(JsonUtils.toJsonString(config), configClass);
        // 参数校验
        ValidationUtils.validate(validator, clientConfig);
        // 设置参数
        return clientConfig;
    }

    @Override
    public void deleteFileConfig(Long id) {
        // 校验存在
        FileConfig config = validateFileConfigExists(id);
        if (Boolean.TRUE.equals(config.getMaster())) {
            throw new CommonBusinessException("该文件配置不允许删除，原因：它是主配置，删除会导致无法上传文件");
        }
        // 删除
        fileConfigMapper.deleteById(id);

        // 清空缓存
        clearCache(id, null);
    }

    /**
     * 清空指定文件配置
     *
     * @param id 配置编号
     * @param master 是否主配置
     */
    private void clearCache(Long id, Boolean master) {
        if (id != null) {
            clientCache.invalidate(id);
        }
        if (Boolean.TRUE.equals(master)) {
            clientCache.invalidate(CACHE_MASTER_ID);
        }
    }

    private FileConfig validateFileConfigExists(Long id) {
        FileConfig config = fileConfigMapper.selectById(id);
        if (config == null) {
            throw new CommonBusinessException("文件配置不存在");
        }
        return config;
    }

    @Override
    public FileConfig getFileConfig(Long id) {
        return fileConfigMapper.selectById(id);
    }

    @Override
    public String testFileConfig(Long id) throws Exception {
        // 校验存在
        validateFileConfigExists(id);
        // 上传文件
        byte[] content = ResourceUtil.readBytes("file/test.png");
        return getFileClient(id).upload(content, IdUtil.fastSimpleUUID() + ".jpg", "image/jpeg");
    }

    @Override
    public FileClient getFileClient(Long id) {
        return clientCache.getUnchecked(id);
    }

    @Override
    public FileClient getMasterFileClient() {
        return clientCache.getUnchecked(CACHE_MASTER_ID);
    }

    private static <K, V> LoadingCache<K, V> buildAsyncReloadingCache(long duration, TimeUnit unit, CacheLoader<K, V> loader) {
        return CacheBuilder.newBuilder()
                // 只阻塞当前数据加载线程，其他线程返回旧值
                .refreshAfterWrite(duration, unit)
                // 通过 asyncReloading 实现全异步加载，包括 refreshAfterWrite 被阻塞的加载线程
                .build(CacheLoader.asyncReloading(loader, Executors.newCachedThreadPool()));
    }

    private FileConfig selectByMaster() {
        return fileConfigMapper.selectOne(new LambdaQueryWrapper<FileConfig>()
                .eq(FileConfig::getMaster, true));
    }
}
