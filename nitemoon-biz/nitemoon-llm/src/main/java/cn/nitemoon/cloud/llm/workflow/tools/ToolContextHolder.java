package cn.nitemoon.cloud.llm.workflow.tools;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;

public class ToolContextHolder {

    private static final ThreadLocal<StreamEmitter> EMITTER = new ThreadLocal<>();
    private static final ThreadLocal<ChatReq> REQUEST = new ThreadLocal<>();

    public static void setEmitter(StreamEmitter emitter) {
        EMITTER.set(emitter);
    }

    public static StreamEmitter getEmitter() {
        return EMITTER.get();
    }

    public static void setRequest(ChatReq req) {
        REQUEST.set(req);
    }

    public static ChatReq getRequest() {
        return REQUEST.get();
    }

    public static void clear() {
        EMITTER.remove();
        REQUEST.remove();
    }
}
