package cn.nitemoon.cloud.llm.config;

import cn.nitemoon.cloud.llm.service.LlmExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionCleanupTask {

    private final LlmExecutionService executionService;

    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanExpiredExecutions() {
        log.info("开始清理过期执行记录...");
        try {
            executionService.cleanExpired(30);
            log.info("过期执行记录清理完成");
        } catch (Exception e) {
            log.error("清理过期执行记录失败: {}", e.getMessage(), e);
        }
    }
}
