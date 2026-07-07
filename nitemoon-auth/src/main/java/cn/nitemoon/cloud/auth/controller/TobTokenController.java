package cn.nitemoon.cloud.auth.controller;

import cn.dev33.satoken.stp.SaTokenInfo;
import cn.dev33.satoken.stp.StpUtil;
import cn.nitemoon.cloud.auth.service.LoginService;
import cn.nitemoon.cloud.common.core.util.AesUtils;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.upms.api.dto.WechatMiniProgramLoginDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 授权登录
 *
 * @author hetao
 * @since 2022/2/10 16:25
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/token")
@Tag(description = "token", name = "授权登录")
public class TobTokenController {

	private final LoginService loginService;

	@Value("${encode.key}")
	private String encodeKey;

	@GetMapping("/captcha")
	@Operation(summary = "获取验证码")
	public void captcha(HttpServletRequest request, HttpServletResponse response) throws Exception {
		loginService.create(request, response);
	}

	@Operation(summary = "系统用户账号登录")
	@RequestMapping("/login")
	public Result<SaTokenInfo> login(String username, String password,String key, String code) {
		loginService.check(key, code);
		return Result.success(loginService.login(username, AesUtils.decrypt(encodeKey, password)));
	}

	@Operation(summary = "系统用户手机号短信登录")
	@RequestMapping("/sms/login")
	public Result<SaTokenInfo> smsLogin(String phone) {
		return Result.success(loginService.smsLogin(phone));
	}

	@PostMapping("/wechat/login")
	@Operation(summary = "微信小程序登录")
	public Result<Map<String, Object>> wechatMiniProgramLogin(@Valid @RequestBody WechatMiniProgramLoginDTO loginDTO) {
		Map<String, Object> info = loginService.wechatLogin(loginDTO);
		return Result.success("微信登录成功", info);
	}

	/**
	 * 用户退出
	 *
	 * @author hetao
	 * @date 2022/5/3 20:46
	 * @version 1.0
	 */
	@Operation(summary = "系统用户退出")
	@PostMapping("/logout")
	public Result<Void> logout() {
		StpUtil.logout();
		return Result.success();
	}

	@Operation(summary = "续期Token")
	@GetMapping("/renewal")
	public Result<Long> renewal() {
		if (!StpUtil.isLogin()) {
			return Result.fail(401, "未登录");
		}
		// 触发 Sa-Token 自动续期（token-time-auto-renew=true 时，访问任何有效接口即续期）
		// 返回剩余有效期（秒）
		return Result.success(StpUtil.getTokenTimeout());
	}

}
