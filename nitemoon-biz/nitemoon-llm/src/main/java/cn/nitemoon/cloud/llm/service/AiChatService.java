package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ImageR;
import cn.nitemoon.cloud.llm.entity.LlmOss;

/**
 * @author hetao
 * @date 2025/1/4
 */
public interface AiChatService {

    void chat(ChatReq req);


    /**
     * 文本请求
     */
    String text(ChatReq req);

    /**
     * 文生图
     */
    LlmOss image(ImageR req);
}
