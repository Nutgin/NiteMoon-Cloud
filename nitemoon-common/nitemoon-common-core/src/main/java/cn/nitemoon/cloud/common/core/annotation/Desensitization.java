package cn.nitemoon.cloud.common.core.annotation;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import cn.nitemoon.cloud.common.core.config.AbstractDesensitization;
import cn.nitemoon.cloud.common.core.config.DesensitizationJsonSerializer;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

/**
 * 数据脱敏注解
 *
 * @author hetao
 * @date 2022/5/31
 */
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside
@JsonSerialize(using = DesensitizationJsonSerializer.class)
public @interface Desensitization {

	Class<? extends AbstractDesensitization> value();

}
