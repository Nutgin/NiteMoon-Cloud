package cn.nitemoon.cloud.auth.config;

import cn.binarywang.wx.miniapp.api.WxMaService;
import cn.binarywang.wx.miniapp.api.impl.WxMaServiceImpl;
import cn.binarywang.wx.miniapp.config.WxMaConfig;
import cn.binarywang.wx.miniapp.config.impl.WxMaDefaultConfigImpl;
import cn.nitemoon.cloud.auth.properties.WechatProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.apache.commons.lang3.StringUtils;

/**
 * 微信小程序配置
 *
 * @author hetao
 * @since 2025/03/09
 */
@Configuration
@EnableConfigurationProperties(WechatProperties.class)
@RequiredArgsConstructor
public class WechatConfig {

    private final WechatProperties wechatProperties;

    @Bean
    public WxMaService wxMaService() {
        WxMaDefaultConfigImpl config = new WxMaDefaultConfigImpl();
        config.setAppid(wechatProperties.getAppId());
        config.setSecret(wechatProperties.getAppSecret());
        
        WxMaService service = new WxMaServiceImpl();
        service.setWxMaConfig(config);
        return service;
    }
}
