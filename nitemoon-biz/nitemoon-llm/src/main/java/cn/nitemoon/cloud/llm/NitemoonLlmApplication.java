package cn.nitemoon.cloud.llm;

import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableDubbo
public class NitemoonLlmApplication {

    public static void main(String[] args) {
        SpringApplication.run(NitemoonLlmApplication.class, args);
    }

}
