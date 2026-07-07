package cn.nitemoon.cloud.common.job.annotation;

import cn.nitemoon.cloud.common.job.config.XxlJobConfig;
import org.springframework.context.annotation.Import;

import java.lang.annotation.*;

/**
 * xxlJob注解
 *
 * @author hetao
 * @since 2022/5/19 15:18
 */
@Documented
@Inherited
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Import({ XxlJobConfig.class })
public @interface EnableXxlJob {

}
