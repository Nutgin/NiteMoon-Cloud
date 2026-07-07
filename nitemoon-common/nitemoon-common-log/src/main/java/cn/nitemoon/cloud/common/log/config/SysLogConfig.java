package cn.nitemoon.cloud.common.log.config;

import cn.nitemoon.cloud.common.log.aop.LogAopAspect;
import cn.nitemoon.cloud.common.log.event.GlobalLogEventListener;
import cn.nitemoon.cloud.upms.api.remote.RemoteSysLogService;
import lombok.RequiredArgsConstructor;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 日志配置
 *
 * @author hetao
 * @date 2022/6/10
 */
@Configuration
@RequiredArgsConstructor
public class SysLogConfig {

	@DubboReference
	private final RemoteSysLogService remoteSysLogService;

	@Bean
	public GlobalLogEventListener globalLogEventListener() {
		return new GlobalLogEventListener(remoteSysLogService);
	}

	@Bean
	public LogAopAspect logAopAspect(ApplicationEventPublisher publisher) {
		return new LogAopAspect(publisher);
	}

}
