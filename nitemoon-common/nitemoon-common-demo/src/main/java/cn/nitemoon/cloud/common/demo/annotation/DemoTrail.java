package cn.nitemoon.cloud.common.demo.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Demo模式限流注解
 * 用于Controller方法，限制同一IP在demo模式下的每日调用次数
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface DemoTrail {

    /**
     * 是否仅查看模式
     * 为true时，演示模式下直接禁止调用，提示资源有限不支持调用
     */
    boolean onlyView() default false;

}
