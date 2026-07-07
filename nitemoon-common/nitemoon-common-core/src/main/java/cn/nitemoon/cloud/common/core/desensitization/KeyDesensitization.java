package cn.nitemoon.cloud.common.core.desensitization;

import cn.nitemoon.cloud.common.core.config.AbstractDesensitization;

/**
 * 秘钥脱敏
 *
 * @author hetao
 * @date 2022/5/31
 */
public class KeyDesensitization extends AbstractDesensitization {

	@Override
	public String serialize(String value) {
		return value.replaceAll("(?<=\\w{1})\\w(?=\\w{3})", "*");
	}

}
