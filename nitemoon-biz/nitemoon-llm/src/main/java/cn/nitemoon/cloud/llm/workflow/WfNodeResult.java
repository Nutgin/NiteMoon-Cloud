package cn.nitemoon.cloud.llm.workflow;

import cn.nitemoon.cloud.llm.entity.LlmMessage;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class WfNodeResult {

    private String output;
    private int inputTokens;
    private int outputTokens;
    private String modelName;
    private Map<String, Object> metadata;
    private Map<String, Object> outputParams;
    private String lastExecutedNodeUuid;
    private List<LlmMessage> nodeMessages;

    public WfNodeResult(String output) {
        this.output = output;
        this.inputTokens = 0;
        this.outputTokens = 0;
        this.metadata = new HashMap<>();
        this.outputParams = new HashMap<>();
        this.nodeMessages = new ArrayList<>();
    }

    public WfNodeResult(String output, int inputTokens, int outputTokens) {
        this.output = output;
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
        this.metadata = new HashMap<>();
        this.outputParams = new HashMap<>();
        this.nodeMessages = new ArrayList<>();
    }

    public void addNodeMessage(LlmMessage message) {
        this.nodeMessages.add(message);
    }

    public void putOutputParam(String key, Object value) {
        this.outputParams.put(key, value);
    }

    public Object getOutputParam(String key) {
        return this.outputParams.get(key);
    }

    public void putMetadata(String key, Object value) {
        this.metadata.put(key, value);
    }

    public Object getMetadata(String key) {
        return this.metadata.get(key);
    }
}
