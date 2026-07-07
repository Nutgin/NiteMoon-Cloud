package cn.nitemoon.cloud.llm.controller;

import cn.nitemoon.cloud.common.core.util.IpUtils;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import cn.nitemoon.cloud.llm.entity.LlmConversation;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.service.LlmMessageService;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author hetao
 * @date 2025/1/30
 */
@Slf4j
@RestController
@RequestMapping("/aigc/conversation")
@AllArgsConstructor
@Tag(name = "AI对话管理")
public class LlmConversationController {

    private final LlmMessageService messageMapper;

    /**
     * conversation list, filter by user
     */
    @GetMapping("/list")
    @Operation(description = "获取对话列表")
    public Result conversations(@RequestParam(required = false) String appId) {
        return Result.success(messageMapper.conversations(String.valueOf(SecurityUtils.getUserId()), appId));
    }

    /**
     * conversation page
     */
    @GetMapping("/page")
    @Operation(description = "分页查询对话")
    public Result list(LlmConversation data, QueryRequest queryPage) {
        return Result.success(MybatisUtil.getData(messageMapper.conversationPages(data, queryPage)));
    }

    @PostMapping
    @Operation(description = "添加会话窗口")
    //@SaCheckPermission("aigc:conversation:add")
    public Result addConversation(@RequestBody LlmConversation conversation) {
        conversation.setUserId(String.valueOf(SecurityUtils.getUserId()));
        return Result.success(messageMapper.addConversation(conversation));
    }

    @PutMapping
    @Operation(description = "更新会话窗口")
    //@SaCheckPermission("aigc:conversation:update")
    public Result updateConversation(@RequestBody LlmConversation conversation) {
        if (conversation.getId() == null) {
            return Result.fail("conversation id is null");
        }
        messageMapper.updateConversation(conversation);
        return Result.success();
    }

    @DeleteMapping("/{conversationId}")
    @Operation(description = "删除会话窗口")
    //@SaCheckPermission("aigc:conversation:delete")
    @DemoTrail(onlyView = true)
    public Result delConversation(@PathVariable String conversationId) {
        messageMapper.delConversation(conversationId);
        return Result.success();
    }

    @DeleteMapping("/message/{conversationId}")
    @Operation(description = "清空会话窗口数据")
    //@SaCheckPermission("aigc:conversation:clear")
    public Result clearMessage(@PathVariable String conversationId) {
        messageMapper.clearMessage(conversationId);
        return Result.success();
    }

    /**
     * get messages with conversationId
     */
    @GetMapping("/messages/{conversationId}")
    @Operation(description = "获取会话消息")
    public Result getMessages(@PathVariable String conversationId) {
        List<LlmMessage> list = messageMapper.getMessages(conversationId);
        return Result.success(list);
    }

    /**
     * add message in conversation
     */
    @PostMapping("/message")
    public Result addMessage(@RequestBody LlmMessage message) {
        message.setIp(IpUtils.getHttpServletRequestIpAddress());
        return Result.success(messageMapper.addMessage(message));
    }
}
