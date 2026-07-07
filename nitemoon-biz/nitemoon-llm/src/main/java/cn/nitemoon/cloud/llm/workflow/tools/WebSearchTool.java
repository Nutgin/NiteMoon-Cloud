package cn.nitemoon.cloud.llm.workflow.tools;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.nitemoon.cloud.llm.dto.ChatRes;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WebSearchTool implements BuiltInTool {

    @Value("${tool.web-search.api-url:}")
    private String searchApiUrl;

    @Value("${tool.web-search.api-key:}")
    private String searchApiKey;

    @Tool("Search the web for current information. Input: a search query string. Returns: relevant search results as text.")
    public String searchWeb(String query) {
        StreamEmitter emitter = ToolContextHolder.getEmitter();
        if (emitter != null) {
            emitter.send(ChatRes.toolCall("WEB_SEARCH", "Searching: " + query));
        }
        log.info("Tool[WEB_SEARCH] 执行, query: {}", query);

        if (searchApiUrl == null || searchApiUrl.isBlank()) {
            return "Web search is not configured. Please set tool.web-search.api-url in configuration.";
        }

        try {
            JSONObject param = JSONUtil.createObj()
                    .set("query", query)
                    .set("num", 5);

            HttpResponse response = HttpRequest.post(searchApiUrl)
                    .header("Authorization", "Bearer " + searchApiKey)
                    .header("Content-Type", "application/json")
                    .body(param.toString())
                    .timeout(15000)
                    .execute();

            if (response.isOk()) {
                return response.body();
            }
            return "Search failed with status: " + response.getStatus();
        } catch (Exception e) {
            log.error("Web搜索异常: {}", e.getMessage());
            return "Search error: " + e.getMessage();
        }
    }

    @Override
    public String getToolType() {
        return "WEB_SEARCH";
    }
}
