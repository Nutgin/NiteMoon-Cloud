package cn.nitemoon.cloud.llm.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author hetao
 */
@Data
@ConfigurationProperties(prefix = "langchat")
public class LlmChatProps {
}
