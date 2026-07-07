package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.dto.ImageR;
import cn.nitemoon.cloud.llm.entity.LlmApp;
import cn.nitemoon.cloud.llm.entity.LlmConversation;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.entity.LlmOss;
import cn.nitemoon.cloud.llm.mapper.LlmConversationMapper;
import cn.nitemoon.cloud.llm.service.AiChatService;
import cn.nitemoon.cloud.llm.service.LlmMessageService;
import cn.nitemoon.cloud.llm.service.StreamingChatService;
import cn.nitemoon.cloud.llm.store.AppStore;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.LlmWorkflowEngine;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import dev.langchain4j.data.image.Image;
import dev.langchain4j.model.output.Response;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * @author hetao
 * @date 2025/1/4
 */
@Slf4j
@Service
@AllArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final StreamingChatService streamingChatService;
    private final LlmMessageService messageMapper;
    private final LlmConversationMapper conversationMapper;
    private final AppStore appStore;
    private final LlmWorkflowEngine llmWorkflowEngine;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void chat(ChatReq req) {
        log.info("AiChatService.chat 开始处理, appId={}, message: {}", req.getAppId(), req.getMessage());
        StreamEmitter emitter = req.getEmitter();

        if (StrUtil.isBlank(req.getAppId())) {
            emitter.error("缺少应用ID");
            return;
        }

        LlmApp app = appStore.get(req.getAppId());
        if (app == null) {
            emitter.error("应用不存在");
            return;
        }
        if (StrUtil.isBlank(app.getWorkflowUuid())) {
            emitter.error("应用未配置工作流");
            return;
        }

        // 确保会话记录存在
        ensureConversation(req);

        // 设置记忆配置
        req.setEnableMemory(Boolean.TRUE.equals(app.getEnableMemory()));
        req.setMemoryWindowSize(app.getMemoryWindowSize() != null ? app.getMemoryWindowSize() : 20);
        log.info("记忆配置: enableMemory={}, memoryWindowSize={}", req.getEnableMemory(), req.getMemoryWindowSize());

        // 保存用户消息
        req.setRole("user");
        saveMessage(req, 0, 0);

        long executionStartTime = System.currentTimeMillis();
        llmWorkflowEngine.initExecution(req, "chat");
        try {
            WfNodeResult result = llmWorkflowEngine.execute(req, app.getWorkflowUuid());
            llmWorkflowEngine.completeExecution(result, executionStartTime, result.getModelName());
            // 按节点保存对话历史（每个LLM节点独立一条记录）
            if (result.getNodeMessages() != null) {
                for (LlmMessage nodeMessage : result.getNodeMessages()) {
                    messageMapper.addMessage(nodeMessage);
                    PersistentChatMemoryStore.appendToCache(redisTemplate, nodeMessage);
                }
            }
            emitter.complete();
        } catch (Exception e) {
            llmWorkflowEngine.failExecution(e, executionStartTime);
            log.error("工作流执行异常: {}", e.getMessage(), e);
            emitter.error(e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    private void saveMessage(ChatReq req, Integer inputToken, Integer outputToken) {
        if (req.getConversationId() != null) {
            LlmMessage message = new LlmMessage();
            BeanUtils.copyProperties(req, message);
            message.setPromptTokens(inputToken);
            message.setCompletionTokens(outputToken);
            // 只有用户消息才存附件，AI回复不带附件
            if ("user".equals(req.getRole()) && req.getFiles() != null && !req.getFiles().isEmpty()) {
                message.setFiles(cn.nitemoon.cloud.common.core.util.JsonUtils.toJsonString(req.getFiles()));
            } else {
                message.setFiles(null);
            }
            messageMapper.addMessage(message);
            PersistentChatMemoryStore.appendToCache(redisTemplate, message);
        }
    }

    private void ensureConversation(ChatReq req) {
        if (StrUtil.isBlank(req.getConversationId())) return;
        Long count = conversationMapper.selectCount(
                Wrappers.<LlmConversation>lambdaQuery()
                        .eq(LlmConversation::getId, req.getConversationId()));
        if (count != null && count > 0) return;
        LlmConversation conversation = new LlmConversation();
        conversation.setId(req.getConversationId());
        conversation.setUserId(req.getUserId());
        conversation.setAppId(req.getAppId());
        conversation.setTitle(StrUtil.isNotBlank(req.getMessage()) ?
                req.getMessage().substring(0, Math.min(req.getMessage().length(), 50)) : "新对话");
        conversation.setCreateTime(new java.util.Date());
        conversationMapper.insert(conversation);
    }

    @Override
    public String text(ChatReq req) {
        String text;
        try {
            text = streamingChatService.text(req);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e.getMessage());
        }
        return text;
    }

    @Override
    public LlmOss image(ImageR req) {
        Response<Image> res = streamingChatService.image(req);

        String path = res.content().url().toString();
        LlmOss oss = new LlmOss();
        oss.setUrl(path);
        return oss;
    }
}
