package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

/**
 * 文档提取节点配置
 *
 * @author hetao
 */
@Data
public class DocExtractorNodeConfig {

    /**
     * 提取方式：auto（自动识别）, text（纯文本）, ocr（OCR识别）
     */
    private String extractionMethod = "auto";

    /**
     * 输入变量引用（获取上游节点输出的变量名）
     */
    private String inputVariable;
}
