package cn.nitemoon.cloud.common.dubbo.config;

import cn.nitemoon.cloud.common.core.factory.YamlPropertySourceFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * @author hetao
 * @description dubbo配置
 * @date 2024/11/25
 */
@PropertySource(value = "classpath:dubbo-config.yml", factory = YamlPropertySourceFactory.class)
@ConditionalOnProperty(prefix = "nitemoon", value = "cloud.enable", matchIfMissing = true)
@Configuration(proxyBeanMethods = false)
public class NitemoonDubboConfiguration {

}
