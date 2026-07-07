package cn.nitemoon.cloud.llm.workflow.tools;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.entity.LlmTool;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
public class CustomToolRouter {

    private final Map<String, LlmTool> toolMap;

    public CustomToolRouter(Map<String, LlmTool> toolMap) {
        this.toolMap = toolMap;
    }

    @Tool("Execute a custom tool by name. Parameters: toolName (the tool name), arguments (JSON string of arguments to pass to the tool). Returns: the tool execution result as text.")
    public String execute(String toolName, String arguments) {
        StreamEmitter emitter = ToolContextHolder.getEmitter();
        if (emitter != null) {
            emitter.send(ChatRes.toolCall(toolName, "Executing custom tool: " + toolName));
        }
        log.info("Tool[CUSTOM:{}] 执行, arguments: {}", toolName, arguments);

        LlmTool tool = toolMap.get(toolName);
        if (tool == null) {
            return "Tool not found: " + toolName;
        }

        try {
            String url = tool.getEndpointUrl();
            String method = tool.getHttpMethod() != null ? tool.getHttpMethod().toUpperCase() : "POST";

            HttpRequest httpRequest;
            switch (method) {
                case "GET":
                    httpRequest = HttpRequest.get(url);
                    break;
                case "PUT":
                    httpRequest = HttpRequest.put(url);
                    break;
                case "DELETE":
                    httpRequest = HttpRequest.delete(url);
                    break;
                default:
                    httpRequest = HttpRequest.post(url);
            }

            if (tool.getHeaders() != null && !tool.getHeaders().isBlank()) {
                JSONObject headers = JSONUtil.parseObj(tool.getHeaders());
                headers.forEach((k, v) -> httpRequest.header(k, String.valueOf(v)));
            }

            if (arguments != null && !arguments.isBlank() && !"GET".equals(method)) {
                httpRequest.body(arguments);
            }

            httpRequest.timeout(15000);
            HttpResponse response = httpRequest.execute();

            String result = response.body();
            if (result != null && result.length() > 5000) {
                result = result.substring(0, 5000) + "... (truncated)";
            }
            return result;
        } catch (Exception e) {
            log.error("自定义工具[{}]执行异常: {}", toolName, e.getMessage());
            return "Tool execution error: " + e.getMessage();
        }
    }

    public Map<String, LlmTool> getToolMap() {
        return toolMap;
    }
}
