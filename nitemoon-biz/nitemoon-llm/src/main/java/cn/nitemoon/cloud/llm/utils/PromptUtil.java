package cn.nitemoon.cloud.llm.utils;

import cn.hutool.core.bean.BeanUtil;
import cn.nitemoon.cloud.llm.dto.PromptConst;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * @author hetao
 * @date 2025/3/1
 */
public class PromptUtil {

    public static Prompt build(String message) {
        return new Prompt(message);
    }

    public static Prompt build(String message, String promptText) {
        Map<String, Object> params = new HashMap<>();
        params.put(PromptConst.QUESTION, message);
        return new PromptTemplate(promptText + PromptConst.EMPTY).apply(params);
    }

    public static Prompt build(String message, String promptText, Object param) {
        Map<String, Object> params = BeanUtil.beanToMap(param, false, true);
        params.put(PromptConst.QUESTION, message);
        return new PromptTemplate(promptText).apply(params);
    }

    public static Prompt buildDocs(String message) {
        Map<String, Object> params = new HashMap<>();
        params.put(PromptConst.QUESTION, message);
        return new PromptTemplate(PromptConst.DOCUMENT).apply(params);
    }
}
