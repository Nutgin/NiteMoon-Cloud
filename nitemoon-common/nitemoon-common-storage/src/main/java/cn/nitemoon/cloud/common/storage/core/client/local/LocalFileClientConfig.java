package cn.nitemoon.cloud.common.storage.core.client.local;

import cn.nitemoon.cloud.common.storage.core.client.FileClientConfig;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;


/**
 * 本地文件客户端的配置类
 */
@Data
public class LocalFileClientConfig implements FileClientConfig {

    /**
     * 基础路径
     */
    @NotEmpty(message = "基础路径不能为空")
    private String basePath;

    /**
     * 自定义域名
     */
    @NotEmpty(message = "domain 不能为空")
    private String domain;

}
