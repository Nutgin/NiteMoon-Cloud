package cn.nitemoon.cloud.llm.workflow.node;

import cn.nitemoon.cloud.common.core.util.JsonUtils;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Getter
public abstract class AbstractLlmWfNode {

    protected final LlmWorkflowNode node;
    private static final Pattern TEMPLATE_PATTERN = Pattern.compile("\\{\\{(\\w+(?:\\.\\w+)?)}}");

    public AbstractLlmWfNode(LlmWorkflowNode node) {
        this.node = node;
    }

    public abstract WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req);

    protected <T> T parseNodeConfig(Class<T> clazz) {
        return JsonUtils.parseObject(node.getNodeConfig(), clazz);
    }

    protected <T> T parseInputConfig(Class<T> clazz) {
        return JsonUtils.parseObject(node.getInputConfig(), clazz);
    }

    /**
     * Get the primary text input from inputParams.
     * Priority: "text" key first, then first non-empty String value.
     */
    protected String getInputText(Map<String, Object> inputParams, ChatReq req) {
        Object text = inputParams.get("text");
        if (text != null) {
            return text.toString();
        }
        for (Object val : inputParams.values()) {
            if (val instanceof String) {
                String s = (String) val;
                if (!s.isEmpty()) return s;
            }
        }
        return "";
    }

    /**
     * Resolve {{paramName}} placeholders in a template string using inputParams values.
     */
    protected String resolvePrompt(String template, Map<String, Object> inputParams) {
        if (template == null || template.isEmpty()) {
            return template;
        }
        Matcher matcher = TEMPLATE_PATTERN.matcher(template);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1);
            Object value = inputParams.get(key);
            String replacement = value != null ? value.toString() : "";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
