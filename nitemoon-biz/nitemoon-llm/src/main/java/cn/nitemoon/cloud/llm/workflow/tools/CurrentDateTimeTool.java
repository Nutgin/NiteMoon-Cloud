package cn.nitemoon.cloud.llm.workflow.tools;

import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
public class CurrentDateTimeTool implements BuiltInTool {

    @Tool("Get the current date and time. Returns the current date and time in the format: yyyy-MM-dd HH:mm:ss")
    public String getCurrentDateTime() {
        String result = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        log.info("Tool[DATETIME] 执行, 结果: {}", result);
        return result;
    }

    @Override
    public String getToolType() {
        return "DATETIME";
    }
}
