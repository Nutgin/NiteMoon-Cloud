package cn.nitemoon.cloud.llm.workflow.tools;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class HttpRequestTool implements BuiltInTool {

    @Tool("Send an HTTP request. Input: a JSON string with fields 'url' (required), 'method' (GET/POST, default GET), 'headers' (optional JSON object), 'body' (optional string). Returns: the response body as text.")
    public String sendHttpRequest(String requestJson) {
        StreamEmitter emitter = ToolContextHolder.getEmitter();
        if (emitter != null) {
            emitter.send(ChatRes.toolCall("HTTP_REQUEST", "Sending HTTP request..."));
        }
        log.info("Tool[HTTP_REQUEST] 执行, request: {}", requestJson);

        try {
            JSONObject req = JSONUtil.parseObj(requestJson);
            String url = req.getStr("url");
            if (url == null || url.isBlank()) {
                return "Error: 'url' is required";
            }

            String method = req.getStr("method", "GET").toUpperCase();
            JSONObject headers = req.getJSONObject("headers");
            String body = req.getStr("body");

            HttpRequest httpRequest;
            switch (method) {
                case "POST":
                    httpRequest = HttpRequest.post(url);
                    break;
                case "PUT":
                    httpRequest = HttpRequest.put(url);
                    break;
                case "DELETE":
                    httpRequest = HttpRequest.delete(url);
                    break;
                default:
                    httpRequest = HttpRequest.get(url);
            }

            if (headers != null) {
                headers.forEach((k, v) -> httpRequest.header(k, String.valueOf(v)));
            }

            if (body != null && !body.isBlank() && ("POST".equals(method) || "PUT".equals(method))) {
                httpRequest.body(body);
            }

            httpRequest.timeout(15000);
            HttpResponse response = httpRequest.execute();

            String result = response.body();
            if (result != null && result.length() > 5000) {
                result = result.substring(0, 5000) + "... (truncated)";
            }
            return result;
        } catch (Exception e) {
            log.error("HTTP请求异常: {}", e.getMessage());
            return "HTTP request error: " + e.getMessage();
        }
    }

    @Override
    public String getToolType() {
        return "HTTP_REQUEST";
    }
}
