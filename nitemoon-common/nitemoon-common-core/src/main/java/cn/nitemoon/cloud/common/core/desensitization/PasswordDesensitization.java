package cn.nitemoon.cloud.common.core.desensitization;

import cn.nitemoon.cloud.common.core.config.AbstractDesensitization;

/**
 * 密码脱敏
 *
 * @author hetao
 * @date 2022/5/31
 */
public class PasswordDesensitization extends AbstractDesensitization {

	@Override
	public String serialize(String value) {
		return "******";
	}

}
