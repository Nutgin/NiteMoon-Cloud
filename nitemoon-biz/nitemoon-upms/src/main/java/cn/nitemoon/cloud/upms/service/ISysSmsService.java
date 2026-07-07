package cn.nitemoon.cloud.upms.service;

public interface ISysSmsService {

	/**
	 * 发送短信验证码
	 * @param mobile 手机号
	 * @param type 验证码类型 注册、登录、重置密码、修改手机号
	 * @return
	 */
	Boolean sendSmsCode(String mobile, String type);

}
