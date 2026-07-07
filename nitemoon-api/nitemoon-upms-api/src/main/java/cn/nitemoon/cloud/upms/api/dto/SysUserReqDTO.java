package cn.nitemoon.cloud.upms.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 系统用户
 *
 * @author MAX
 * @date 2024/05/07 13:36
 */
@Data
public class SysUserReqDTO implements Serializable {

	@Serial
	private static final long serialVersionUID = 1L;

	@Schema(description = "主键")
	private String username;

	@Schema(description = "密码")
	private String password;

	@Schema(description = "手机号")
	private String phone;

	@Schema(description = "账号类型：0.系统主账户（管理全部店铺）；")
	private String type;

}
