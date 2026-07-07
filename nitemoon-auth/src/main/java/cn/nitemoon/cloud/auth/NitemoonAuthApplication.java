package cn.nitemoon.cloud.auth;

import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 认证授权模块
 *
 * @author hetao
 * @since 2022/2/18 14:45
 */
@EnableDubbo
@SpringBootApplication
public class NitemoonAuthApplication {

	public static void main(String[] args) {
		SpringApplication.run(NitemoonAuthApplication.class, args);
	}

}
