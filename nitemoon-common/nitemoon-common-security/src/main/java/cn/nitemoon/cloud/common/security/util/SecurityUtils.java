package cn.nitemoon.cloud.common.security.util;

import cn.dev33.satoken.context.SaHolder;
import cn.dev33.satoken.stp.StpUtil;
import cn.nitemoon.cloud.common.core.constant.CacheConstants;
import cn.nitemoon.cloud.common.core.enums.DeviceTypeEnum;
import cn.nitemoon.cloud.common.security.entity.LoginUser;
import lombok.experimental.UtilityClass;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Objects;

/**
 * 安全工具类
 *
 * @author hetao
 * @since 2022/11/25 21:25
 */
@UtilityClass
public class SecurityUtils {

	public static void login(LoginUser loginUser) {
		SaHolder.getStorage().set(CacheConstants.USER_CACHE, loginUser);
		StpUtil.login(loginUser.getUserId());
		StpUtil.getTokenSession().set(CacheConstants.USER_CACHE, loginUser);
	}

	public static void loginByDevice(LoginUser loginUser, DeviceTypeEnum deviceTypeEnum) {
		SaHolder.getStorage().set(CacheConstants.USER_CACHE, loginUser);
		StpUtil.login(loginUser.getUserId(), deviceTypeEnum.getDevice());
		StpUtil.getTokenSession().set(CacheConstants.USER_CACHE, loginUser);
	}

	private boolean isWebRequest() {
		ServletRequestAttributes servletRequestAttributes = (ServletRequestAttributes) RequestContextHolder
			.getRequestAttributes();
		return Objects.isNull(servletRequestAttributes);
	}

	/**
	 * 获取用户信息
	 * @return
	 */
	public LoginUser getUser() {
		if (isWebRequest()) {
			return null;
		}
		// 未登录直接返回
		if (!StpUtil.isLogin()) {
			return null;
		}
		return (LoginUser) StpUtil.getTokenSession().get(CacheConstants.USER_CACHE);
	}

	public String getUserId() {
		return getUser().getUserId();
	}

	public String getOpenId() {
		return getUser().getOpenId();
	}

}
