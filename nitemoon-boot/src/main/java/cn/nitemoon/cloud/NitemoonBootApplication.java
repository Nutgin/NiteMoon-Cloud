package cn.nitemoon.cloud;

//import cn.nitemoon.cloud.common.job.annotation.EnableXxlJob;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * 单体模块启动类
 *
 * @author hetao
 * @since 2022/2/18 13:52
 */
@SpringBootApplication
@EnableAsync(proxyTargetClass = true)
public class NitemoonBootApplication {

	public static void main(String[] args) {
		SpringApplication.run(NitemoonBootApplication.class, args);
	}

}
