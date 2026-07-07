package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

import java.util.List;

@Data
public class ToolNodeConfig {

    private List<ToolDefinition> tools;

    @Data
    public static class ToolDefinition {
        private String toolType;
        private String name;
        private String description;
        private String parametersSchema;
        private String endpointUrl;
        private String httpMethod;
        private boolean enabled = true;
    }
}
