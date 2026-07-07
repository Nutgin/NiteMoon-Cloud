package cn.nitemoon.cloud.common.limit.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface AccessLimit {

    /**"访问次数"**/
    int count() default 10;

    /** "时间/单位秒" **/
    int time() default 60;
}
