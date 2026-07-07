

package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.entity.LlmConversation;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * @author hetao
 * @date 2025/1/4
 */
public interface LlmMessageService extends IService<LlmMessage> {

    /**
     * 获取会话列表
     */
    List<LlmConversation> conversations(String userId, String appId);

    /**
     * 获取会话分页列表
     */
    IPage<LlmConversation> conversationPages(LlmConversation data, QueryRequest queryPage);

    /**
     * 新增会话
     */
    LlmConversation addConversation(LlmConversation conversation);

    /**
     * 修改会话
     */
    void updateConversation(LlmConversation conversation);

    /**
     * 删除会话
     */
    void delConversation(String conversationId);

    LlmMessage addMessage(LlmMessage message);

    void clearMessage(String conversationId);

    List<LlmMessage> getMessages(String conversationId);

    List<LlmMessage> getMessages(String conversationId, String userId);
}

