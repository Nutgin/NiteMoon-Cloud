package cn.nitemoon.cloud.common.security.handler;

import cn.nitemoon.cloud.common.core.constant.CommonConstants;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 自定义异常
 *
 * @author hetao
 * @date 2022/9/20
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CommonBusinessException extends RuntimeException {

	private Integer code;

	private String msg;

	public CommonBusinessException() {
		this.code = CommonConstants.FAIL;
	}

	public CommonBusinessException(String msg) {
		super(msg);
		this.code = CommonConstants.FAIL;
		this.msg = msg;
	}

	public CommonBusinessException(Integer code, String msg) {
		super(msg);
		this.code = code;
		this.msg = msg;
	}

}
