package cn.nitemoon.cloud.llm.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum WfNodeTypeEnum {
    START("Start"),
    DATETIME_TOOL("DateTimeTool"),
    WEB_SEARCH_TOOL("WebSearchTool"),
    HTTP_REQUEST_TOOL("HttpRequestTool"),
    CUSTOM_TOOL("CustomTool"),
    COMMAND_EXEC_TOOL("CommandExecTool"),
    LLM("LLM"),
    MULTIMODAL_LLM("MultimodalLlm"),
    KNOWLEDGE_RETRIEVAL("KnowledgeRetrieval"),
    KG_RETRIEVAL("KgRetrieval"),
    IF_ELSE("IfElse"),
    DOC_EXTRACTOR("DocExtractor"),
    END("End");

    private final String value;
}
