package cn.nitemoon.cloud.common.storage.core.client.sftp;

import cn.hutool.core.io.FileUtil;
import cn.hutool.extra.ssh.Sftp;
import cn.nitemoon.cloud.common.storage.core.client.AbstractFileClient;
import cn.nitemoon.cloud.common.storage.core.utils.FileUtils;

import java.io.File;
import java.io.InputStream;

/**
 * Sftp 文件客户端
 */
public class SftpFileClient extends AbstractFileClient<SftpFileClientConfig> {

    private Sftp sftp;

    public SftpFileClient(Long id, SftpFileClientConfig config, Boolean cloudEnable) {
        super(id, config, cloudEnable);
    }

    @Override
    protected void doInit() {
        // 补全风格。例如说 Linux 是 /，Windows 是 \
        if (!config.getBasePath().endsWith(File.separator)) {
            config.setBasePath(config.getBasePath() + File.separator);
        }
        // 初始化 Ftp 对象
        this.sftp = new Sftp(config.getHost(), config.getPort(), config.getUsername(), config.getPassword());
    }

    @Override
    public String upload(byte[] content, String path, String type) {
        // 执行写入
        String filePath = getFilePath(path);
        File file = FileUtils.createTempFile(content);
        sftp.upload(filePath, file);
        // 拼接返回路径
        return super.formatFileUrl(config.getDomain(), path);
    }

    @Override
    public void delete(String path) {
        String filePath = getFilePath(path);
        sftp.delFile(filePath);
    }

    @Override
    public byte[] getContent(String path) {
        String filePath = getFilePath(path);
        File destFile = FileUtils.createTempFile();
        sftp.download(filePath, destFile);
        return FileUtil.readBytes(destFile);
    }

    /**
     * 获得文件的内容
     *
     * @param path 相对路径
     * @return 文件的内容
     */
    public InputStream getContentAsStream(String path) {
        String filePath = getFilePath(path);
        // 使用临时文件实现真正的流式传输
        File tempFile = FileUtils.createTempFile();
        tempFile.deleteOnExit();

        // 下载到临时文件
        sftp.download(filePath, tempFile);

        // 返回临时文件的输入流
        return FileUtil.getInputStream(tempFile);    }

    private String getFilePath(String path) {
        return config.getBasePath() + path;
    }

}
