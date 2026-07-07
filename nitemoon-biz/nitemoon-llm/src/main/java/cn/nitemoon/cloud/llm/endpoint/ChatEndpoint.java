package cn.nitemoon.cloud.llm.endpoint;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.dto.ImageR;
import cn.nitemoon.cloud.llm.dto.PromptConst;
import cn.nitemoon.cloud.llm.entity.LlmApp;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.entity.LlmOss;
import cn.nitemoon.cloud.llm.entity.LlmWorkflow;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.enums.WfNodeTypeEnum;
import cn.nitemoon.cloud.llm.service.AiChatService;
import cn.nitemoon.cloud.llm.service.LlmAppService;
import cn.nitemoon.cloud.llm.service.LlmMessageService;
import cn.nitemoon.cloud.llm.service.LlmModelService;
import cn.nitemoon.cloud.llm.service.LlmWorkflowNodeService;
import cn.nitemoon.cloud.llm.service.LlmWorkflowService;
import cn.nitemoon.cloud.llm.service.impl.PersistentChatMemoryStore;
import cn.nitemoon.cloud.llm.dto.StartNodeConfig;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import cn.nitemoon.cloud.llm.utils.PromptUtil;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.common.core.util.IpUtils;
import cn.nitemoon.cloud.common.core.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * @author hetao
 * @date 2025/1/30
 */
@Slf4j
@RequestMapping("/aigc")
@RestController
@AllArgsConstructor
@Tag(name = "AI聊天接口")
public class ChatEndpoint {

    private final AiChatService aiChatService;
    private final LlmMessageService messageService;
    private final LlmModelService llmModelService;
    private final LlmAppService appService;
    private final LlmWorkflowService workflowService;
    private final LlmWorkflowNodeService workflowNodeService;
    private final RedisTemplate<String, Object> redisTemplate;

    @PostMapping("/chat/completions")
    @Operation(description = "AI聊天对话")
    @DemoTrail
    //@SaCheckPermission("chat:completions")
    public SseEmitter chat(@RequestBody ChatReq req, HttpServletResponse response) {
        log.info("收到 /aigc/chat/completions 请求，消息: {}", req.getMessage());
        // 设置关键响应头
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no"); // 最重要！
        response.setHeader("Content-Type", "text/event-stream");

        StreamEmitter emitter = new StreamEmitter();
        req.setEmitter(emitter);
        req.setUserId(String.valueOf(SecurityUtils.getUserId()));
        req.setUsername(SecurityUtils.getUser().getUsername());
        req.setIp(IpUtils.getHttpServletRequestIpAddress());
        log.info("用户信息: userId={}, username={}", req.getUserId(), req.getUsername());
        ExecutorService executor = Executors.newSingleThreadExecutor();
        req.setExecutor(executor);

        return emitter.streaming(executor, () -> {
            aiChatService.chat(req);
        });
    }

    @PostMapping("/chat/public/completions")
    @Operation(description = "公开聊天接口（无需认证）")
    @DemoTrail
    public SseEmitter publicChat(@RequestBody ChatReq req, HttpServletResponse response) {
        log.info("收到 /aigc/chat/public/completions 请求，webPageKey: {}, 消息: {}", req.getWebPageKey(), req.getMessage());

        // 验证应用是否存在且启用了web页面
        LlmApp app = appService.getByWebPageKey(req.getWebPageKey());
        if (app == null) {
            StreamEmitter emitter = new StreamEmitter();
            SseEmitter sseEmitter = new SseEmitter(0L);
            sseEmitter.onCompletion(() -> {});
            sseEmitter.onTimeout(() -> {});
            sseEmitter.onError(e -> {});
            try {
                sseEmitter.send(SseEmitter.event()
                    .data("data:{\"done\":true,\"message\":\"该应用未启用Web页面或不存在\"}")
                    .build());
            } catch (Exception e) {
                log.error("发送错误消息失败", e);
            }
            return sseEmitter;
        }

        // 设置appId供下游服务使用
        req.setAppId(app.getId());

        // 设置响应头
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Content-Type", "text/event-stream");

        StreamEmitter emitter = new StreamEmitter();
        req.setEmitter(emitter);
        req.setUserId("public-" + UUID.randomUUID().toString().substring(0, 8));
        req.setUsername("public-user");
        req.setIp(IpUtils.getHttpServletRequestIpAddress());

        ExecutorService executor = Executors.newSingleThreadExecutor();
        req.setExecutor(executor);

        return emitter.streaming(executor, () -> {
            aiChatService.chat(req);
        });
    }

    @GetMapping("/app/info")
    @Operation(description = "获取应用信息")
    public Result<LlmApp> appInfo(@RequestParam String appId, String conversationId) {
        LlmApp app = appService.getById(appId);
        if (StrUtil.isBlank(conversationId)) {
            conversationId = app.getId();
        }
        return Result.success(app);
    }

    @GetMapping("/app/prologue")
    @Operation(description = "获取应用开场白")
    public Result<String> prologue(@RequestParam String appId) {
        LlmApp app = appService.getById(appId);
        if (app == null || StrUtil.isBlank(app.getWorkflowUuid())) {
            return Result.success("");
        }
        LlmWorkflow workflow = workflowService.getOne(Wrappers.<LlmWorkflow>lambdaQuery()
                .eq(LlmWorkflow::getUuid, app.getWorkflowUuid())
                .eq(LlmWorkflow::getIsDeleted, false)
                .last("limit 1"));
        if (workflow == null) return Result.success("");
        List<LlmWorkflowNode> nodes = workflowNodeService.listByWorkflowId(workflow.getId());
        LlmWorkflowNode startNode = nodes.stream()
                .filter(n -> WfNodeTypeEnum.START.getValue().equals(n.getNodeType()))
                .findFirst().orElse(null);
        if (startNode == null || StrUtil.isBlank(startNode.getNodeConfig())) return Result.success("");
        try {
            StartNodeConfig config = cn.nitemoon.cloud.common.core.util.JsonUtils.parseObject(startNode.getNodeConfig(), StartNodeConfig.class);
            return Result.success(config != null ? config.getPrologue() : "");
        } catch (Exception e) {
            return Result.success("");
        }
    }

    @GetMapping("/app/public/info")
    @Operation(description = "获取公开应用信息（无需认证）")
    public Result<LlmApp> publicAppInfo(@RequestParam String webPageKey) {
        LlmApp app = appService.getByWebPageKey(webPageKey);
        if (app == null) {
            return Result.fail("应用不存在或未启用Web页面");
        }
        // 清除敏感信息
        app.setWorkflowUuid(null);
        app.setWebPageKey(null);
        return Result.success(app);
    }

    @GetMapping("/chat/public/prologue")
    @Operation(description = "获取公开应用开场白（无需认证）")
    public Result<String> publicPrologue(@RequestParam String webPageKey) {
        LlmApp app = appService.getByWebPageKey(webPageKey);
        if (app == null) {
            return Result.success("");
        }
        if (StrUtil.isBlank(app.getWorkflowUuid())) {
            return Result.success("");
        }
        LlmWorkflow workflow = workflowService.getOne(Wrappers.<LlmWorkflow>lambdaQuery()
                .eq(LlmWorkflow::getUuid, app.getWorkflowUuid())
                .eq(LlmWorkflow::getIsDeleted, false)
                .last("limit 1"));
        if (workflow == null) return Result.success("");
        List<LlmWorkflowNode> nodes = workflowNodeService.listByWorkflowId(workflow.getId());
        LlmWorkflowNode startNode = nodes.stream()
                .filter(n -> WfNodeTypeEnum.START.getValue().equals(n.getNodeType()))
                .findFirst().orElse(null);
        if (startNode == null || StrUtil.isBlank(startNode.getNodeConfig())) return Result.success("");
        try {
            StartNodeConfig config = cn.nitemoon.cloud.common.core.util.JsonUtils.parseObject(startNode.getNodeConfig(), StartNodeConfig.class);
            return Result.success(config != null ? config.getPrologue() : "");
        } catch (Exception e) {
            return Result.success("");
        }
    }

    @GetMapping("/chat/messages/{conversationId}")
    @Operation(description = "获取聊天记录")
    public Result messages(@PathVariable String conversationId) {
        List<LlmMessage> list = messageService.getMessages(conversationId, String.valueOf(SecurityUtils.getUserId()));
        return Result.success(list);
    }

    @DeleteMapping("/chat/messages/clean/{conversationId}")
    @Operation(description = "清理聊天记录")
    //@SaCheckPermission("chat:messages:clean")
    public Result<Void> cleanMessage(@PathVariable String conversationId) {
        messageService.clearMessage(conversationId);
        PersistentChatMemoryStore.cleanCache(redisTemplate, conversationId);
        return Result.success();
    }

    @PostMapping("/chat/mindmap")
    @Operation(description = "生成思维导图")
    public Result<ChatRes> mindmap(@RequestBody ChatReq req) {
        req.setPrompt(PromptUtil.build(req.getMessage(), PromptConst.MINDMAP));
        return Result.success(new ChatRes(aiChatService.text(req)));
    }

    @PostMapping("/chat/image")
    @Operation(description = "AI生图")
    public Result<LlmOss> image(@RequestBody ImageR req) {
        req.setPrompt(PromptUtil.build(req.getMessage(), PromptConst.IMAGE));
        return Result.success(aiChatService.image(req));
    }

    @GetMapping("/chat/getImageModels")
    @Operation(description = "获取生图模型列表")
    public Result<List<LlmModel>> getImageModels() {
        List<LlmModel> list = llmModelService.getImageModels();
        list.forEach(i -> {
            i.setApiKey(null);
            i.setSecretKey(null);
        });
        return Result.success(list);
    }
}
