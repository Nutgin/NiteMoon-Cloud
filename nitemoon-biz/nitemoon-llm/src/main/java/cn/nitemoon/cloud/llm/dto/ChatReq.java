package cn.nitemoon.cloud.llm.dto;

import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import dev.langchain4j.model.input.Prompt;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

/**
 * @author hetao
 * @date 2025/1/30
 */
@Data
@Accessors(chain = true)
@Schema(description = "聊天请求对象")
public class ChatReq {

    @Schema(description= "应用ID")
    private String appId;
    @Schema(description= "模型ID")
    private String modelId;
    @Schema(description= "模型名称")
    private String modelName;
    @Schema(description= "模型提供方")
    private String modelProvider;

    @Schema(description= "聊天消息")
    private String message;

    @Schema(description= "对话ID")
    private String conversationId;

    @Schema(description= "用户ID")
    private String userId;

    @Schema(description= "用户名")
    private String username;

    @Schema(description= "聊天ID")
    private String chatId;

    @Schema(description= "提示词文本")
    private String promptText;

    @Schema(description= "文档名称")
    private String docsName;

    @Schema(description= "知识库ID")
    private String knowledgeId;
    @Schema(description= "知识库ID列表")
    private List<String> knowledgeIds = new ArrayList<>();

    @Schema(description= "Web页面密钥")
    private String webPageKey;

    private String docsId;

    private String url;

    private String ip;

    private String role;

    @Schema(description = "附件文件列表（多模态）")
    private List<FileContent> files = new ArrayList<>();

    @Schema(description = "是否开启记忆")
    private Boolean enableMemory = false;

    @Schema(description = "记忆窗口大小")
    private Integer memoryWindowSize = 20;

    private Prompt prompt;

    private StreamEmitter emitter;

    private Executor executor;

    private Map<String, Object> context = new HashMap<>();

    public void putContext(String key, Object value) {
        this.context.put(key, value);
    }

    @SuppressWarnings("unchecked")
    public <T> T getContext(String key) {
        return (T) this.context.get(key);
    }
}
