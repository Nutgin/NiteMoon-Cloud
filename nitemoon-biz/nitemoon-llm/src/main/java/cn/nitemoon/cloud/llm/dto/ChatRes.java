package cn.nitemoon.cloud.llm.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * @author hetao
 * @date 2025/1/29
 */
@Data
@Accessors(chain = true)
@Schema(description = "聊天响应对象")
public class ChatRes {

    @Schema(description= "是否完成")
    private boolean isDone = false;

    @Schema(description= "响应消息")
    private String message;

    @Schema(description= "使用的Token数量")
    private Integer usedToken;

    @Schema(description= "耗时(毫秒)")
    private long time;

    @Schema(description = "事件类型: token/tool_call/tool_result")
    private String eventType = "token";

    @Schema(description = "工具名称")
    private String toolName;

    @Schema(description = "工具状态信息")
    private String toolStatus;

    public ChatRes(String message) {
        this.message = message;
    }

    public ChatRes(Integer usedToken, long startTime) {
        this.isDone = true;
        this.usedToken = usedToken;
        this.time = System.currentTimeMillis() - startTime;
    }

    public static ChatRes toolCall(String toolName, String status) {
        ChatRes res = new ChatRes(status);
        res.setEventType("tool_call");
        res.setToolName(toolName);
        res.setToolStatus(status);
        return res;
    }

    public static ChatRes toolResult(String toolName, String result) {
        ChatRes res = new ChatRes(result);
        res.setEventType("tool_result");
        res.setToolName(toolName);
        return res;
    }
}
