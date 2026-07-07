package cn.nitemoon.cloud.common.seata.config;

import cn.nitemoon.cloud.common.core.factory.YamlPropertySourceFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * @author lijia
 * @description
 * @date 2024/11/25
 */
@Configuration(proxyBeanMethods = false)
@PropertySource(value = "classpath:seata-config.yml", factory = YamlPropertySourceFactory.class)
@ConditionalOnProperty(prefix = "nitemoon", value = "cloud.enable", matchIfMissing = true)
public class NitemoonSeataConfiguration {

}
