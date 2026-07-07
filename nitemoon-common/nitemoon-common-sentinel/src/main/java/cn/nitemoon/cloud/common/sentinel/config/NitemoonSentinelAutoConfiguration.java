package cn.nitemoon.cloud.common.sentinel.config;

import cn.nitemoon.cloud.common.sentinel.handler.NitemoonUrlBlockHandler;
import com.alibaba.cloud.sentinel.custom.SentinelAutoConfiguration;
import com.alibaba.csp.sentinel.adapter.spring.webmvc_v6x.callback.BlockExceptionHandler;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * sentinel 配置类
 *
 * @author hetao
 */
@Configuration(proxyBeanMethods = false)
@AutoConfigureBefore(SentinelAutoConfiguration.class)
public class NitemoonSentinelAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean
	public BlockExceptionHandler blockExceptionHandler() {
		return new NitemoonUrlBlockHandler();
	}

}
