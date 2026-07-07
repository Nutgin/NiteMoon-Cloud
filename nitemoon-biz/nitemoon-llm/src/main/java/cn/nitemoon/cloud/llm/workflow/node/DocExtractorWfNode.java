package cn.nitemoon.cloud.llm.workflow.node;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.DocExtractorNodeConfig;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;

import java.util.Map;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.loader.UrlDocumentLoader;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import lombok.extern.slf4j.Slf4j;

/**
 * 文档提取节点
 * 从URL或文本中提取纯文本内容，支持PDF/Word/Excel等格式
 *
 * @author hetao
 */
@Slf4j
public class DocExtractorWfNode extends AbstractLlmWfNode {

    private static final ApacheTikaDocumentParser TIKA_PARSER = new ApacheTikaDocumentParser();

    public DocExtractorWfNode(LlmWorkflowNode node) {
        super(node);
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        String input = getInputText(inputParams, req);

        DocExtractorNodeConfig config = parseNodeConfig(DocExtractorNodeConfig.class);
        String extractionMethod = config != null && config.getExtractionMethod() != null
                ? config.getExtractionMethod() : "auto";

        if (StrUtil.isBlank(input)) {
            log.warn("DocExtractor节点输入为空");
            return new WfNodeResult("");
        }

        try {
            String extractedText;

            if ("text".equalsIgnoreCase(extractionMethod)) {
                // 纯文本模式：直接返回
                extractedText = input;
            } else if (isUrl(input)) {
                // URL模式：下载并解析文档
                extractedText = extractFromUrl(input);
            } else {
                // 自动模式：判断输入类型
                extractedText = input;
            }

            // 截断过长的文本（防止OOM）
            if (extractedText != null && extractedText.length() > 100000) {
                extractedText = extractedText.substring(0, 100000) + "\n...[文档内容过长，已截断]";
            }

            String output = extractedText != null ? extractedText : "";
            log.info("DocExtractor提取完成, 输入长度: {}, 输出长度: {}",
                    input.length(), output.length());
            WfNodeResult result = new WfNodeResult(output);
            result.putOutputParam("tool_output", output);
            result.putOutputParam("status", "success");
            return result;

        } catch (Exception e) {
            log.error("DocExtractor提取失败: {}", e.getMessage(), e);
            return new WfNodeResult("文档提取失败: " + e.getMessage());
        }
    }

    /**
     * 从URL下载并解析文档
     */
    private String extractFromUrl(String urlStr) {
        try {
            Document document = UrlDocumentLoader.load(urlStr, TIKA_PARSER);
            String text = document.text();
            if (StrUtil.isBlank(text)) {
                log.warn("文档解析结果为空, url: {}", urlStr);
                return "文档内容为空";
            }
            return text;
        } catch (Exception e) {
            log.error("从URL解析文档失败: {}, error: {}", urlStr, e.getMessage());
            throw new RuntimeException("文档解析失败: " + e.getMessage(), e);
        }
    }

    /**
     * 判断输入是否为URL
     */
    private boolean isUrl(String input) {
        if (StrUtil.isBlank(input)) {
            return false;
        }
        String trimmed = input.trim().toLowerCase();
        return trimmed.startsWith("http://") || trimmed.startsWith("https://");
    }
}
