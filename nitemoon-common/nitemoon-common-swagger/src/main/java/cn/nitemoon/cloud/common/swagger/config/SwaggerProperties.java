package cn.nitemoon.cloud.common.swagger.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "nitemoon.swagger")
@RefreshScope
public class SwaggerProperties {

	/**
	 * 是否开启swagger
	 */
	private Boolean enabled = true;

	private String title;

	private String description;

	private String version;

	private String author;

	private String email;

	private String license;

	private String licenseUrl;

}
