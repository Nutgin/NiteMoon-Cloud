package cn.nitemoon.cloud.auth.service;

import cn.dev33.satoken.context.SaHolder;
import cn.dev33.satoken.secure.SaSecureUtil;
import cn.dev33.satoken.stp.SaTokenInfo;
import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.servlet.JakartaServletUtil;
import cn.hutool.http.useragent.UserAgent;
import cn.hutool.http.useragent.UserAgentUtil;
import cn.nitemoon.cloud.auth.properties.ValidateCodeProperties;
import cn.nitemoon.cloud.auth.properties.WechatProperties;
import cn.nitemoon.cloud.common.core.constant.CommonConstants;
import cn.nitemoon.cloud.common.core.enums.DeviceTypeEnum;
import cn.nitemoon.cloud.common.core.util.IpUtils;
import cn.nitemoon.cloud.common.log.event.GlobalLoginLogEvent;
import cn.nitemoon.cloud.common.myabtis.tenant.TenantContextHolder;
import cn.nitemoon.cloud.common.security.entity.LoginUser;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import cn.nitemoon.cloud.upms.api.dto.WechatMiniProgramLoginDTO;
import cn.nitemoon.cloud.upms.api.entity.SysLoginLog;
import cn.nitemoon.cloud.upms.api.entity.SysUser;
import cn.nitemoon.cloud.upms.api.remote.RemoteSysUserService;
import cn.binarywang.wx.miniapp.api.WxMaService;
import com.wf.captcha.GifCaptcha;
import com.wf.captcha.SpecCaptcha;
import com.wf.captcha.base.Captcha;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoginService {

	@DubboReference
	private final RemoteSysUserService remoteSysUserService;

	private final ApplicationEventPublisher applicationEventPublisher;

	private final ValidateCodeProperties validateCodeProperties;

	private final StringRedisTemplate redisTemplate;

	private final WechatProperties wechatProperties;

	private final WxMaService wxMaService;



	public SaTokenInfo login(String username, String password) {
		LoginUser loginUser = getUserDetails(remoteSysUserService.getUserInfo(username));
		if (ObjectUtil.isNull(loginUser)) {
			throw new RuntimeException("用户不存在");
		}
		if (!loginUser.getPassword().equals(SaSecureUtil.md5(password))) {
			saveLoginLog(loginUser, "账号或密码错误");
			throw new RuntimeException("账号或密码错误");
		}
		if (!CommonConstants.NORMAL_STATUS.equals(loginUser.getStatus())) {
			saveLoginLog(loginUser, "状态异常不可登录");
			throw new RuntimeException("状态异常不可登录");
		}
		SecurityUtils.loginByDevice(loginUser, DeviceTypeEnum.TOB);
		return StpUtil.getTokenInfo();
	}

	public SaTokenInfo smsLogin(String phone) {
		LoginUser loginUser = getUserDetails(remoteSysUserService.getUserInfoByPhone(phone));
		if (ObjectUtil.isNull(loginUser)) {
			throw new RuntimeException("用户不存在");
		}
		if (!CommonConstants.NORMAL_STATUS.equals(loginUser.getStatus())) {
			saveLoginLog(loginUser, "状态异常不可登录");
			throw new RuntimeException("状态异常不可登录");
		}
		SecurityUtils.loginByDevice(loginUser, DeviceTypeEnum.TOB);
		return StpUtil.getTokenInfo();
	}

	private void saveLoginLog(LoginUser loginUser, String msg) {
		HttpServletRequest request = ((ServletRequestAttributes) Objects
			.requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
		// 处理登录日志
		String userName = loginUser.getUsername();
		String agent = SaHolder.getRequest().getHeader("User-Agent").toLowerCase();
		UserAgent ua = UserAgentUtil.parse(agent);
		SysLoginLog sysLoginLog = new SysLoginLog();
		sysLoginLog.setStatus(CommonConstants.LOGIN_LOG_STATUS_0);
		sysLoginLog.setIpAddr(JakartaServletUtil.getClientIP(request));
		sysLoginLog.setLocation(IpUtils.getWhoisAddress(sysLoginLog.getIpAddr()));
		sysLoginLog.setCreateBy(userName);
		sysLoginLog.setOs(ua.getOs().toString());
		sysLoginLog.setBrowser(ua.getBrowser().toString());
		sysLoginLog.setMsg(StrUtil.format("用户: {} 登录失败，异常: {} ", userName, msg));
		sysLoginLog.setUserName(userName);
		TenantContextHolder.setTenantId(loginUser.getTenantId());
		applicationEventPublisher.publishEvent(new GlobalLoginLogEvent(this, sysLoginLog));

	}

	private LoginUser getUserDetails(SysUser result) {
		if (ObjectUtil.isNull(result)) {
			throw new RuntimeException("用户不存在");
		}
		LoginUser loginUser = new LoginUser();
		BeanUtil.copyProperties(result, loginUser);
		loginUser.setUserId(result.getId());
		loginUser.setPermissions(new ArrayList<>(result.getPermissions()));
		return loginUser;
	}

	public void create(HttpServletRequest request, HttpServletResponse response) throws Exception {
		String key = request.getParameter("key");
		if (StringUtils.isEmpty(key)) {
			throw new RuntimeException("验证码key不能为空");
		}
		ValidateCodeProperties code = validateCodeProperties;
		setHeader(response, code.getType());

		Captcha captcha = createCaptcha(code);
		redisTemplate.opsForValue().set("captcha:" + key, StringUtils.lowerCase(captcha.text()), Duration.ofSeconds(code.getTime()).getSeconds(), TimeUnit.SECONDS);
		captcha.out(response.getOutputStream());
	}

	private void setHeader(HttpServletResponse response, String type) {
		if (StringUtils.equalsIgnoreCase(type, "gif")) {
			response.setContentType(MediaType.IMAGE_GIF_VALUE);
		} else {
			response.setContentType(MediaType.IMAGE_PNG_VALUE);
		}
		response.setHeader(HttpHeaders.PRAGMA, "No-cache");
		response.setHeader(HttpHeaders.CACHE_CONTROL, "No-cache");
		response.setDateHeader(HttpHeaders.EXPIRES, 0L);
	}

	private Captcha createCaptcha(ValidateCodeProperties code) {
		Captcha captcha = null;
		if (StringUtils.equalsIgnoreCase(code.getType(), "gif")) {
			captcha = new GifCaptcha(code.getWidth(), code.getHeight(), code.getLength());
		} else {
			captcha = new SpecCaptcha(code.getWidth(), code.getHeight(), code.getLength());
		}
		captcha.setCharType(code.getCharType());
		return captcha;
	}

	public void check(String key, String value) {
		Object codeInRedis = redisTemplate.opsForValue().get("captcha:" + key);
		if (StringUtils.isBlank(value)) {
			throw new CommonBusinessException("请输入验证码");
		}
		if (codeInRedis == null) {
			throw new CommonBusinessException("验证码已过期");
		}
		if (!StringUtils.equalsIgnoreCase(value, String.valueOf(codeInRedis))) {
			redisTemplate.delete("captcha:" + key);
			throw new CommonBusinessException("验证码不正确");
		}
	}

	public Map<String, Object> wechatLogin(WechatMiniProgramLoginDTO loginDTO) {
		// 调用微信API获取openId
		String openId = getOpenIdFromWechat(loginDTO.getCode());

		if (StringUtils.isBlank(openId)) {
			throw new CommonBusinessException("微信登录失败，无法获取用户信息");
		}

		SysUser sysUser = remoteSysUserService.getUserInfoByOpenId(openId);
		LoginUser loginUser = null;
		if (ObjectUtil.isNull(sysUser)) {
			if (!wechatProperties.getAutoRegister()) {
				throw new CommonBusinessException("用户不存在，请联系管理员添加用户");
			}

			// 用户不存在，自动注册
			SysUser newUser = new SysUser();
			newUser.setOpenId(openId);
			newUser.setNikeName(StringUtils.isNotBlank(loginDTO.getNickName()) ? loginDTO.getNickName() : "微信用户");
			newUser.setAvatar(loginDTO.getAvatarUrl());
			newUser.setStatus(CommonConstants.NORMAL_STATUS);
			newUser.setTenantId(wechatProperties.getDefaultTenantId());
			newUser.setType("0");
			newUser.setUsername("wx_" + openId.substring(0, Math.min(8, openId.length()))); // 生成唯一用户名
			newUser.setPassword(RandomUtil.randomString(16));
			// 保存用户
			boolean saved = remoteSysUserService.saveWechatUser(newUser);
			if (!saved) {
				throw new CommonBusinessException("用户注册失败，请稍后重试");
			}
			// 重新获取用户信息
			loginUser = getUserDetails(remoteSysUserService.getUserInfoByOpenId(openId));
		}else {
			loginUser = getUserDetails(sysUser);
		}

		if (!CommonConstants.NORMAL_STATUS.equals(loginUser.getStatus())) {
			throw new CommonBusinessException("状态异常不可登录");
		}

		// 登录
		SecurityUtils.loginByDevice(loginUser, DeviceTypeEnum.TOC);
		SaTokenInfo tokenInfo = StpUtil.getTokenInfo();

		// 返回结果
		Map<String, Object> result = new HashMap<>();
		result.put("tokenInfo", tokenInfo);
		result.put("userInfo", loginUser);

		return result;
	}

	/**
	 * 通过微信code获取openId
	 * 使用微信小程序SDK调用真实API
	 */
	private String getOpenIdFromWechat(String code) {
		try {
			// 调用微信API获取session信息
			var session = wxMaService.getUserService().getSessionInfo(code);

			if (session == null || StringUtils.isBlank(session.getOpenid())) {
				throw new CommonBusinessException("微信登录失败，请重试");
			}

			// 返回openId
			return session.getOpenid();

		} catch (Exception e) {
			log.error("微信登录获取openId失败: {}", e.getMessage(), e);
			throw new CommonBusinessException("微信登录失败: " + e.getMessage());
		}
	}

}
