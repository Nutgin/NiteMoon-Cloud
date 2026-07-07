package cn.nitemoon.cloud.llm.workflow.parallel;

import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Branch-aware stream emitter that tags output with branch identifier.
 * Collects output to a buffer and can replay it later.
 */
@Getter
public class BranchStreamEmitter extends StreamEmitter {

    private final String branchId;
    private final String branchTitle;
    private final StreamEmitter delegate;
    private final StringBuilder buffer = new StringBuilder();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BranchStreamEmitter(String branchId, String branchTitle, StreamEmitter delegate) {
        this.branchId = branchId;
        this.branchTitle = branchTitle;
        this.delegate = delegate;
    }

    @Override
    public void send(Object obj) {
        try {
            // Build branch-tagged JSON data
            String jsonData;
            if (obj instanceof ChatRes) {
                ChatRes chatRes = (ChatRes) obj;
                if (chatRes.getMessage() != null) {
                    buffer.append(chatRes.getMessage());
                }
                // Wrap ChatRes with branch metadata
                Map<String, Object> wrapped = new LinkedHashMap<>();
                wrapped.put("branchId", branchId);
                wrapped.put("branchTitle", branchTitle);
                wrapped.put("message", chatRes.getMessage());
                wrapped.put("done", chatRes.isDone());
                wrapped.put("eventType", chatRes.getEventType());
                wrapped.put("usedToken", chatRes.getUsedToken());
                wrapped.put("time", chatRes.getTime());
                wrapped.put("toolName", chatRes.getToolName());
                wrapped.put("toolStatus", chatRes.getToolStatus());
                jsonData = objectMapper.writeValueAsString(wrapped);
            } else {
                jsonData = objectMapper.writeValueAsString(obj);
            }

            // Send as branch event to delegate if available
            if (delegate != null) {
                try {
                    delegate.get().send(SseEmitter.event()
                            .data(jsonData)
                            .name("branch"));
                } catch (Exception e) {
                    // Ignore errors from delegate to avoid breaking branch execution
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to send branch event: " + e.getMessage(), e);
        }
    }

    @Override
    public void complete() {
        // Don't complete the delegate - it will be completed by the main flow
    }

    @Override
    public void error(String message) {
        if (delegate != null) {
            delegate.sendBranchError(branchId, branchTitle, message);
        }
    }

    /**
     * Get collected output from this branch
     */
    public String getCollectedOutput() {
        return buffer.toString();
    }
}
