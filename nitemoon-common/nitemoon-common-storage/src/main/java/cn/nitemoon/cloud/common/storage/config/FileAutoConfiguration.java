package cn.nitemoon.cloud.common.storage.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * 文件配置类
 */
@Configuration(proxyBeanMethods = false)
@ComponentScan("cn.nitemoon.cloud.common.storage.core.client")
public class FileAutoConfiguration {

}
