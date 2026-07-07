package cn.nitemoon.cloud.upms.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import cn.nitemoon.cloud.common.storage.core.client.FileClient;
import cn.nitemoon.cloud.common.storage.core.client.s3.FilePresignedUrlRespDTO;
import cn.nitemoon.cloud.common.storage.core.utils.FileTypeUtils;
import cn.nitemoon.cloud.common.storage.core.utils.FileUtils;
import cn.nitemoon.cloud.upms.api.dto.FileCreateReqVO;
import cn.nitemoon.cloud.upms.api.dto.FilePageReqVO;
import cn.nitemoon.cloud.upms.api.dto.FilePresignedUrlRespVO;
import cn.nitemoon.cloud.upms.api.entity.File;
import cn.nitemoon.cloud.upms.mapper.FileMapper;
import cn.nitemoon.cloud.upms.service.FileConfigService;
import cn.nitemoon.cloud.upms.service.FileService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.AllArgsConstructor;
import lombok.SneakyThrows;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.io.InputStream;


/**
 * 文件 Service 实现类
 */
@Service
@AllArgsConstructor
public class FileServiceImpl extends ServiceImpl<FileMapper, File> implements FileService {

    private final FileConfigService fileConfigService;

    private final FileMapper fileMapper;

    @Override
    @SneakyThrows
    public String createFile(String name, String path, byte[] content) {
        // 计算默认的 path 名
        String type = FileTypeUtils.getMineType(content, name);
        if (StrUtil.isEmpty(path)) {
            path = FileUtils.generatePath(content, name);
        }
        // 如果 name 为空，则使用 path 填充
        if (StrUtil.isEmpty(name)) {
            name = path;
        }

        // 上传到文件存储器
        FileClient client = fileConfigService.getMasterFileClient();
        Assert.notNull(client, "客户端(master) 不能为空");
        String url = client.upload(content, path, type);

        // 保存到数据库
        File file = new File();
        file.setConfigId(client.getId());
        file.setName(name);
        file.setPath(path);
        file.setUrl(url);
        file.setType(type);
        file.setSize(content.length);
        file.setCreator(SecurityUtils.getUser().getUsername());
        fileMapper.insert(file);
        return url;
    }

    @Override
    public Long createFile(FileCreateReqVO createReqVO) {
        File file = BeanUtil.toBean(createReqVO, File.class);
        fileMapper.insert(file);
        return file.getId();
    }

    @Override
    public void deleteFile(Long id) throws Exception {
        // 校验存在
        File file = validateFileExists(id);

        // 从文件存储器中删除
        FileClient client = fileConfigService.getFileClient(file.getConfigId());
        Assert.notNull(client, "客户端({}) 不能为空", file.getConfigId());
        client.delete(file.getPath());

        // 删除记录
        fileMapper.deleteById(id);
    }

    private File validateFileExists(Long id) {
        File file = fileMapper.selectById(id);
        if (file == null) {
            throw new CommonBusinessException("文件不存在");
        }
        return file;
    }

    @Override
    public byte[] getFileContent(Long configId, String path) throws Exception {
        FileClient client = fileConfigService.getFileClient(configId);
        Assert.notNull(client, "客户端({}) 不能为空", configId);
        return client.getContent(path);
    }

    @Override
    public InputStream getFileInputStream(Long configId, String path) throws Exception {
        FileClient client = fileConfigService.getFileClient(configId);
        Assert.notNull(client, "客户端({}) 不能为空", configId);
        return client.getContentAsStream(path);
    }

    @Override
    public String getFileType(Long configId, String path) throws Exception {
        // 从数据库查询文件信息
        LambdaQueryWrapper<File> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(File::getConfigId, configId)
                   .eq(File::getPath, path);
        File file = getOne(queryWrapper);

        if (file != null) {
            return file.getType();
        }

        // 如果数据库中没有记录，尝试从文件扩展名推断
        return FileTypeUtils.getMineType(null, path);
    }

    @Override
    public FilePresignedUrlRespVO getFilePresignedUrl(String path) throws Exception {
        FileClient fileClient = fileConfigService.getMasterFileClient();
        FilePresignedUrlRespDTO presignedObjectUrl = fileClient.getPresignedObjectUrl(path);
        FilePresignedUrlRespVO res = BeanUtil.toBean(presignedObjectUrl, FilePresignedUrlRespVO.class);
        res.setConfigId(fileClient.getId());
        return res;
    }

    @Override
    public File uploadFile(String name, String path, byte[] content) throws Exception {
        // 计算默认的 path 名
        String type = FileTypeUtils.getMineType(content, name);
        if (StrUtil.isEmpty(path)) {
            path = FileUtils.generatePath(content, name);
        }
        // 如果 name 为空，则使用 path 填充
        if (StrUtil.isEmpty(name)) {
            name = path;
        }

        // 上传到文件存储器
        FileClient client = fileConfigService.getMasterFileClient();
        Assert.notNull(client, "客户端(master) 不能为空");
        String url = client.upload(content, path, type);

        // 保存到数据库
        File file = new File();
        file.setConfigId(client.getId());
        file.setName(name);
        file.setPath(path);
        file.setUrl(url);
        file.setType(type);
        file.setSize(content.length);
        fileMapper.insert(file);
        return file;
    }

}
