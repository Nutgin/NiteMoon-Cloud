package cn.nitemoon.cloud.common.core.config;

/**
 * 脱敏父类 子类通过继承AbstractDesensitization实现扩展
 *
 * @author hetao
 * @date 2022/5/31
 */
public abstract class AbstractDesensitization {

	/**
	 * 脱敏
	 *
	 * @author hetao
	 * @date 2022/5/31
	 * @param value
	 * @return: java.lang.String
	 */
	public abstract String serialize(String value);

}
