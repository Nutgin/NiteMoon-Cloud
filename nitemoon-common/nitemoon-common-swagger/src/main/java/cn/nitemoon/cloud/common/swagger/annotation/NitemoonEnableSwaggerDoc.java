package cn.nitemoon.cloud.common.swagger.annotation;

import cn.nitemoon.cloud.common.swagger.config.SwaggerAutoConfiguration;
import cn.nitemoon.cloud.common.swagger.config.SwaggerProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Import;

import java.lang.annotation.*;

/**
 * 开启 spring doc
 *
 * @author hetao
 * @date 2024/05/06 15:49
 */
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@EnableConfigurationProperties(SwaggerProperties.class)
@Import({ SwaggerAutoConfiguration.class })
public @interface NitemoonEnableSwaggerDoc {

}
