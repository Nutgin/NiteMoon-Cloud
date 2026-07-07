package cn.nitemoon.cloud.llm.workflow.node;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import cn.nitemoon.cloud.llm.workflow.tools.CommandExecTool;
import cn.nitemoon.cloud.llm.workflow.tools.ToolContextHolder;
import cn.nitemoon.cloud.llm.workflow.tools.ToolRegistry;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
public class CommandExecToolWfNode extends AbstractLlmWfNode {

    private final ToolRegistry toolRegistry;

    public CommandExecToolWfNode(LlmWorkflowNode node, ToolRegistry toolRegistry) {
        super(node);
        this.toolRegistry = toolRegistry;
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        String input = getInputText(inputParams, req);

        // 从节点配置中读取预设的命令/脚本
        Map<String, Object> config = parseNodeConfig(Map.class);
        String command = config != null && config.get("command") instanceof String
                ? (String) config.get("command") : "";

        if (StrUtil.isBlank(command)) {
            log.warn("CommandExecTool节点未配置命令");
            return new WfNodeResult(input);
        }

        // 将输入参数注入到命令中，支持 {{input}}、{{llm_output}} 等所有占位符
        String finalCommand = resolvePrompt(command, inputParams);
        log.info("CommandExecTool节点执行命令: {}", finalCommand);

        Object tool = toolRegistry.getTool("COMMAND_EXEC");
        if (tool instanceof CommandExecTool commandExecTool) {
            ToolContextHolder.setEmitter(emitter);
            ToolContextHolder.setRequest(req);
            try {
                String output = commandExecTool.executeCommand(finalCommand);
                log.info("CommandExecTool节点执行结果: {}", output);
                WfNodeResult result = new WfNodeResult(output);
                result.putOutputParam("tool_output", output);
                result.putOutputParam("status", "success");
                return result;
            } finally {
                ToolContextHolder.clear();
            }
        }
        log.warn("CommandExecTool节点未找到 COMMAND_EXEC 内置工具");
        return new WfNodeResult(input);
    }
}
