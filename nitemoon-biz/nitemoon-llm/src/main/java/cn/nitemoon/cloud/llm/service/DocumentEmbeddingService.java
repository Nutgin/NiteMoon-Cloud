package cn.nitemoon.cloud.llm.service;


import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.EmbeddingR;

import java.util.List;

/**
 * @author hetao
 */
public interface DocumentEmbeddingService {

    EmbeddingR embeddingText(ChatReq req);

    List<EmbeddingR> embeddingDocs(ChatReq req);
}
