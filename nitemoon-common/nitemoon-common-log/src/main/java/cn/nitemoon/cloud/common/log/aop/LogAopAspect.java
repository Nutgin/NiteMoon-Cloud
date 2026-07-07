/**
  * Copyright (c) 2025 沈阳浩荣科技有限公司
  * All rights reserved.
  * <p>
  * 注意：
  * 本项目源代码由沈阳浩荣科技有限公司原创开发，版权所有。

  */
package cn.nitemoon.cloud.common.log.aop;

import cn.hutool.core.util.URLUtil;
import cn.hutool.extra.servlet.JakartaServletUtil;
import cn.hutool.json.JSONUtil;
import cn.nitemoon.cloud.common.core.constant.CommonConstants;
import cn.nitemoon.cloud.common.core.util.IpUtils;
import cn.nitemoon.cloud.common.log.annotation.SysLog;
import cn.nitemoon.cloud.common.log.event.GlobalLogEvent;
import cn.nitemoon.cloud.common.myabtis.tenant.TenantContextHolder;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.Objects;

/**
 * AOP实现日志
 *
 * @author hetao
 * @since 2022/2/17 9:27
 */
@Aspect
@Slf4j
@RequiredArgsConstructor
public class LogAopAspect {

	private final ApplicationEventPublisher applicationEventPublisher;

	/**
	 * 环绕通知记录日志通过注解匹配到需要增加日志功能的方法
	 *
	 * @author hetao
	 * @since 2022/2/17 9:28
	 */
	@SneakyThrows
	@Around("@annotation(sysLog)")
	public Object around(ProceedingJoinPoint point, cn.nitemoon.cloud.common.log.annotation.SysLog sysLog) {
		HttpServletRequest request = ((ServletRequestAttributes) Objects
			.requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
		// 1.方法执行前的处理，相当于前置通知
		// 获取方法签名
		MethodSignature methodSignature = (MethodSignature) point.getSignature();
		// 获取方法
		Method method = methodSignature.getMethod();
		// 获取方法上面的注解
		SysLog log = method.getAnnotation(SysLog.class);
		// 获取操作描述的属性值
		String title = log.value();
		// 记录日志
		cn.nitemoon.cloud.upms.api.entity.SysLog sysLogVo = new cn.nitemoon.cloud.upms.api.entity.SysLog();
		String ip = JakartaServletUtil.getClientIP(request);
		sysLogVo.setMethod(request.getMethod());
		sysLogVo.setIpAddr(ip);
		sysLogVo.setLocation(IpUtils.getWhoisAddress(ip));
		sysLogVo.setRequestMethod(point.getSignature().getDeclaringTypeName() + "." + point.getSignature().getName());
		sysLogVo.setRequestUri(URLUtil.getPath(request.getRequestURI()));
		sysLogVo.setTitle(title);
		sysLogVo.setStatus(CommonConstants.LOGIN_LOG_STATUS_1);
		sysLogVo.setUserName(SecurityUtils.getUser().getUsername());
		sysLogVo.setTenantId(TenantContextHolder.getTenantId());

		// 获取请求参数
		Object[] args = point.getArgs();
		if (args != null && args.length > 0) {
			try {
				String params = JSONUtil.toJsonStr(args);
				// 限制参数长度，避免过长
				if (params.length() > 2000) {
					params = params.substring(0, 2000) + "...";
				}
				sysLogVo.setRequestParams(params);
			} catch (Exception e) {
				sysLogVo.setRequestParams("参数序列化失败");
			}
		}

		// 让代理方法执行
		Long startTime = System.currentTimeMillis();
		Object result = null;
		try {
			result = point.proceed();

		}
		catch (Exception e) {
			sysLogVo.setStatus(CommonConstants.LOGIN_LOG_STATUS_0);
			sysLogVo.setExMsg(e.getMessage());
			throw e;
		}
		finally {
			Long endTime = System.currentTimeMillis();
			sysLogVo.setRequestTime(endTime - startTime);
			// 异步保存操作日志
			applicationEventPublisher.publishEvent(new GlobalLogEvent(this, sysLogVo));

		}
		return result;
	}

}
