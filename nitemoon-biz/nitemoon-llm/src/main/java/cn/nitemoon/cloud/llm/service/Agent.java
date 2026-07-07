package cn.nitemoon.cloud.llm.service;

import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.TokenStream;
import dev.langchain4j.service.UserMessage;

/**
 * @author hetao
 * @date 2025/3/8
 */
public interface Agent {

    TokenStream stream(@MemoryId String id, @UserMessage String message);

    String text(@MemoryId String id, @UserMessage String message);
}
