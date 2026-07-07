package cn.nitemoon.cloud.common.myabtis.config;

import cn.nitemoon.cloud.common.myabtis.resolver.PageArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * 实现WebMvcConfigurer接口
 *
 * @author hetao
 * @date 2022/6/10
 */
@Configuration
public class NitemoonWebMvcConfigurer implements WebMvcConfigurer {

	/**
	 * 该方法作用在调用Controller方法的参数传入之前 SQL过滤器避免SQL注入
	 * @author hetao
	 * @date 2022/6/10
	 */
	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
		// PageArgumentResolver该类对Controller传入的Page对象参数做了具体处理
		argumentResolvers.add(new PageArgumentResolver());
	}

}
