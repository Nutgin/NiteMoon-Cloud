package cn.nitemoon.cloud.upms;

import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 系统管理模块
 *
 * @author hetao
 * @since 2022/2/26 16:51
 */
@EnableDubbo
@SpringBootApplication
public class NitemoonUpmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(NitemoonUpmsApplication.class, args);
	}

}
