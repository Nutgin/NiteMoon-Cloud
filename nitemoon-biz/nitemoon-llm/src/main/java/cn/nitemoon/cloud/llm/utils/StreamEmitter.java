package cn.nitemoon.cloud.llm.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;

/**
 * @author hetao
 * @date 2025/1/30
 */
public class StreamEmitter {

    private final SseEmitter emitter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StreamEmitter() {
        emitter = new SseEmitter(5 * 60 * 1000L);
    }

    public SseEmitter get() {
        return emitter;
    }

    public SseEmitter streaming(final ExecutorService executor, Runnable func) {
        emitter.onCompletion(() -> {
            System.out.println("SseEmitter 完成");
            executor.shutdownNow();
        });

        emitter.onError((e) -> {
            System.out.println("SseEmitter 出现错误: " + e.getMessage());
            executor.shutdownNow();
        });

        emitter.onTimeout(() -> {
            System.out.println("SseEmitter 超时");
            emitter.complete();
            executor.shutdownNow();
        });

        executor.execute(() -> {
            try {
                func.run();
            } catch (Exception e) {
                System.out.println("捕获到异常: " + e.getMessage());
                emitter.completeWithError(e);
                Thread.currentThread().interrupt();
            } finally {
                if (!executor.isShutdown()) {
                    executor.shutdownNow();
                }
            }
        });
        return emitter;
    }

    public void send(Object obj) {
        try {
            String jsonData = objectMapper.writeValueAsString(obj);
            emitter.send(SseEmitter.event()
                    .data(jsonData)
                    .name("message"));
        } catch (Exception e) {
            throw new RuntimeException("Failed to send SSE event: " + e.getMessage(), e);
        }
    }

    /**
     * Send branch error for parallel execution
     */
    public void sendBranchError(String branchId, String branchTitle, String error) {
        try {
            BranchMessage msg = new BranchMessage(branchId, branchTitle, "Error: " + error);
            String jsonData = objectMapper.writeValueAsString(msg);
            emitter.send(SseEmitter.event()
                    .data(jsonData)
                    .name("branch-error"));
        } catch (Exception e) {
            throw new RuntimeException("Failed to send branch error event: " + e.getMessage(), e);
        }
    }

    /**
     * Send parallel execution status
     */
    public void sendParallelStatus(int totalBranches, int completedBranches, String status) {
        try {
            ParallelStatus parallelStatus = new ParallelStatus(totalBranches, completedBranches, status);
            String jsonData = objectMapper.writeValueAsString(parallelStatus);
            emitter.send(SseEmitter.event()
                    .data(jsonData)
                    .name("parallel-status"));
        } catch (Exception e) {
            // Ignore status errors
        }
    }

    public static class BranchMessage {
        public String branchId;
        public String branchTitle;
        public String content;

        public BranchMessage(String branchId, String branchTitle, String content) {
            this.branchId = branchId;
            this.branchTitle = branchTitle;
            this.content = content;
        }
    }

    public static class ParallelStatus {
        public int totalBranches;
        public int completedBranches;
        public String status;

        public ParallelStatus(int totalBranches, int completedBranches, String status) {
            this.totalBranches = totalBranches;
            this.completedBranches = completedBranches;
            this.status = status;
        }
    }

    public void complete() {
        emitter.complete();
    }

    public void error(String message) {
        try {
            emitter.send(SseEmitter.event()
                    .data("Error: " + message)
                    .name("error"));
            emitter.complete();
        } catch (IOException e) {
            throw new RuntimeException("Failed to send error event: " + e.getMessage(), e);
        }
    }
}
