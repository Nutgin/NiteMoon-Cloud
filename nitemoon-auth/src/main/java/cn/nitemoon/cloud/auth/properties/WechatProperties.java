package cn.nitemoon.cloud.auth.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 微信小程序配置
 *
 * @author hetao
 * @since 2025/03/09
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "nitemoon.auth.wechat")
public class WechatProperties {

    /**
     * 微信小程序AppID
     */
    private String appId;

    /**
     * 微信小程序AppSecret
     */
    private String appSecret;

    /**
     * 微信API地址
     */
    private String apiUrl = "https://api.weixin.qq.com";

    /**
     * 是否启用自动注册
     */
    private Boolean autoRegister = true;

    /**
     * 默认租户ID
     */
    private String defaultTenantId = "1";

}
