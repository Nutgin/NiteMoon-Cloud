package cn.nitemoon.cloud.llm.workflow.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class ToolRegistry {

    private final Map<String, Object> toolMap = new ConcurrentHashMap<>();

    @Autowired
    public ToolRegistry(List<BuiltInTool> tools) {
        for (BuiltInTool tool : tools) {
            toolMap.put(tool.getToolType(), tool);
            log.info("注册内置工具: {}", tool.getToolType());
        }
    }

    public Object getTool(String toolType) {
        return toolMap.get(toolType);
    }
}
