package cn.nitemoon.cloud.common.security.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.nitemoon.cloud.common.security.aspect.NitemoonInnerAopAspect;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 注解鉴权
 *
 * @author hetao
 * @date 2022/6/27 22:48
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nitemoon", value = "cloud.enable", matchIfMissing = true)
public class SaTokenConfigure implements WebMvcConfigurer {

	private final HttpServletRequest request;

	/**
	 * 注册Sa-Token的注解拦截器，打开注解式鉴权功能
	 * @param registry
	 * @author hetao
	 * @date 2022/7/16
	 * @return: void
	 */
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		// 注册注解拦截器，并排除不需要注解鉴权的接口地址 (与登录拦截器无关)
		registry.addInterceptor(new SaInterceptor()).addPathPatterns("/**");
	}

	/**
	 * 内部接口访问权限
	 *
	 * @author hetao
	 * @date 2022/7/16
	 * @return: cn.nitemoon.cloud.security.aspect.NitemoonInnerAopAspect
	 */
	@Bean
	public NitemoonInnerAopAspect nitemoonInnerAopAspect() {
		return new NitemoonInnerAopAspect(request);
	}

}
