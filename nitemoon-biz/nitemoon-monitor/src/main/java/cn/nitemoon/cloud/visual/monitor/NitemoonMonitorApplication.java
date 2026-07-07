package cn.nitemoon.cloud.visual.monitor;

import de.codecentric.boot.admin.server.config.EnableAdminServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 监控模块
 *
 * @author hetao
 * @since 2022/5/19 9:33
 */
@EnableAdminServer
@SpringBootApplication
public class NitemoonMonitorApplication {

	public static void main(String[] args) {
		SpringApplication.run(NitemoonMonitorApplication.class, args);

	}

}
