package cn.nitemoon.cloud.llm.endpoint;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.CompletionReq;
import cn.nitemoon.cloud.llm.entity.LlmApp;
import cn.nitemoon.cloud.llm.entity.LlmAppApi;
import cn.nitemoon.cloud.llm.store.AppChannelStore;
import cn.nitemoon.cloud.llm.store.AppStore;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.LlmWorkflowEngine;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * @author hetao
 * @date 2025/7/26
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1")
public class AppApiChatEndpoint {

    private final AppStore appStore;
    private final AppChannelStore appChannelStore;
    private final LlmWorkflowEngine llmWorkflowEngine;

    @PostMapping(value = "/chat/completions")
    @DemoTrail(onlyView = true)
    public SseEmitter completions(@RequestBody CompletionReq req) {
        log.info("收到 /v1/chat/completions 请求，消息数量: {}", req.getMessages() != null ? req.getMessages().size() : 0);
        StreamEmitter emitter = new StreamEmitter();
        LlmAppApi appApi = appChannelStore.getApiChannel();
        log.info("获取到 API 配置: appId={}", appApi != null ? appApi.getAppId() : "null");

        return handler(emitter, appApi.getAppId(), req.getMessages());
    }

    private SseEmitter handler(StreamEmitter emitter, String appId, List<CompletionReq.Message> messages) {
        if (messages == null || messages.isEmpty() || StrUtil.isBlank(appId)) {
            throw new RuntimeException("聊天消息为空，或者没有配置应用信息");
        }
        CompletionReq.Message message = messages.get(0);

        LlmApp app = appStore.get(appId);
        if (app == null) {
            throw new CommonBusinessException("没有配置应用信息");
        }
        if (StrUtil.isBlank(app.getWorkflowUuid())) {
            throw new CommonBusinessException("应用未配置工作流");
        }

        ExecutorService executor = Executors.newSingleThreadExecutor();

        return emitter.streaming(executor, () -> {
            ChatReq req = new ChatReq()
                    .setMessage(message.getContent())
                    .setRole(message.getRole())
                    .setAppId(appId)
                    .setEmitter(emitter);

            long executionStartTime = System.currentTimeMillis();
            llmWorkflowEngine.initExecution(req, "api");
            try {
                WfNodeResult result = llmWorkflowEngine.execute(req, app.getWorkflowUuid());
                llmWorkflowEngine.completeExecution(result, executionStartTime, null);
                emitter.complete();
            } catch (Exception e) {
                llmWorkflowEngine.failExecution(e, executionStartTime);
                log.error("API对话异常: {}", e.getMessage(), e);
                emitter.error(e.getMessage());
            }
        });
    }
}
