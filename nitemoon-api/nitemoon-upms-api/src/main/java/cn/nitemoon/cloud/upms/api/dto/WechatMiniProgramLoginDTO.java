package cn.nitemoon.cloud.upms.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import java.io.Serial;
import java.io.Serializable;

/**
 * 微信小程序登录DTO
 *
 * @author hetao
 * @since 2025/03/09
 */
@Data
@Schema(description = "微信小程序登录请求")
public class WechatMiniProgramLoginDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "微信小程序code", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "微信小程序code不能为空")
    private String code;

    @Schema(description = "用户昵称")
    private String nickName;

    @Schema(description = "用户头像")
    private String avatarUrl;

    @Schema(description = "性别：0-未知，1-男，2-女")
    private Integer gender;

    @Schema(description = "城市")
    private String city;

    @Schema(description = "省份")
    private String province;

    @Schema(description = "国家")
    private String country;

    @Schema(description = "语言")
    private String language;

}
