package cn.nitemoon.cloud.common.storage.core.client.local;

import cn.hutool.core.io.FileUtil;
import cn.nitemoon.cloud.common.storage.core.client.AbstractFileClient;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.InputStream;

/**
 * 本地文件客户端
 */
@Slf4j
public class LocalFileClient extends AbstractFileClient<LocalFileClientConfig> {

    public LocalFileClient(Long id, LocalFileClientConfig config, Boolean cloudEnable) {
        super(id, config, cloudEnable);
    }

    @Override
    protected void doInit() {
        // 补全风格。例如说 Linux 是 /，Windows 是 \
        if (!config.getBasePath().endsWith(File.separator)) {
            config.setBasePath(config.getBasePath() + File.separator);
        }
    }

    @Override
    public String upload(byte[] content, String path, String type) {
        // 执行写入
        String filePath = getFilePath(path);
        log.info("文件将存储在: {}", filePath);
        FileUtil.writeBytes(content, filePath);
        // 拼接返回路径
        return super.formatFileUrl(config.getDomain(), path);
    }

    @Override
    public void delete(String path) {
        String filePath = getFilePath(path);
        FileUtil.del(filePath);
    }

    @Override
    public byte[] getContent(String path) {
        String filePath = getFilePath(path);
        return FileUtil.readBytes(filePath);
    }

    /**
     * 获得文件的内容
     *
     * @param path 相对路径
     * @return 文件的内容
     */
    public InputStream getContentAsStream(String path) {
        String filePath = getFilePath(path);
        return FileUtil.getInputStream(filePath);
    }

    private String getFilePath(String path) {
        return config.getBasePath() + path;
    }

}
