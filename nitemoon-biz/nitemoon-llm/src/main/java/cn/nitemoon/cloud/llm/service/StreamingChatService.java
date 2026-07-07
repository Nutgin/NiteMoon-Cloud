package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ImageR;
import dev.langchain4j.data.image.Image;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.service.TokenStream;

/**
 * @author hetao
 */
public interface StreamingChatService {

    TokenStream chat(ChatReq req);

    TokenStream singleChat(ChatReq req);

    String text(ChatReq req);

    Response<Image> image(ImageR req);
}
