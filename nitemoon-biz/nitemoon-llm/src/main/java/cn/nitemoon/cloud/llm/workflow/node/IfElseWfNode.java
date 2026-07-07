package cn.nitemoon.cloud.llm.workflow.node;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.IfElseCase;
import cn.nitemoon.cloud.llm.dto.IfElseCondition;
import cn.nitemoon.cloud.llm.dto.IfElseNodeConfig;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.utils.StreamEmitter;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * IfElse条件分支节点
 * 根据条件评估结果决定走哪个分支（通过 branchResult metadata 传递给引擎）
 *
 * @author hetao
 */
@Slf4j
public class IfElseWfNode extends AbstractLlmWfNode {

    public IfElseWfNode(LlmWorkflowNode node) {
        super(node);
    }

    @Override
    public WfNodeResult execute(Map<String, Object> inputParams, StreamEmitter emitter, ChatReq req) {
        String input = getInputText(inputParams, req);

        IfElseNodeConfig config = parseNodeConfig(IfElseNodeConfig.class);
        if (config == null) {
            log.warn("IfElse节点未配置，默认走 false 分支");
            return buildResult(input, "false");
        }

        // 多分支模式（workflow-designer 的 cases）
        if (config.getCases() != null && !config.getCases().isEmpty()) {
            return evaluateCases(input, config.getCases(), req);
        }

        // 简单模式（workflow 的 conditions + logicalOperator）
        if (config.getConditions() != null && !config.getConditions().isEmpty()) {
            return evaluateSimpleConditions(input, config.getConditions(), config.getLogicalOperator(), req);
        }

        log.warn("IfElse节点无有效条件配置，默认走 false 分支");
        return buildResult(input, "false");
    }

    /**
     * 多分支模式：遍历每个 case，第一个匹配的 case 的 uuid 作为 sourceHandle
     */
    private WfNodeResult evaluateCases(String input, List<IfElseCase> cases, ChatReq req) {
        for (IfElseCase caseItem : cases) {
            if (caseItem.getConditions() == null || caseItem.getConditions().isEmpty()) {
                continue;
            }
            boolean matched = evaluateConditionList(caseItem.getConditions(), caseItem.getOperator(), req);
            if (matched) {
                log.info("IfElse匹配分支: {}", caseItem.getUuid());
                return buildResult(input, caseItem.getUuid());
            }
        }
        log.info("IfElse无匹配分支，走 default 分支");
        return buildResult(input, "default");
    }

    /**
     * 简单模式：评估条件列表，结果为 true/false
     */
    private WfNodeResult evaluateSimpleConditions(String input, List<IfElseCondition> conditions,
                                                   String logicalOperator, ChatReq req) {
        boolean matched = evaluateConditionList(conditions, logicalOperator, req);
        String branch = matched ? "true" : "false";
        log.info("IfElse简单模式评估结果: {}", branch);
        return buildResult(input, branch);
    }

    /**
     * 评估一组条件
     */
    private boolean evaluateConditionList(List<IfElseCondition> conditions, String operator, ChatReq req) {
        boolean isAnd = !"or".equalsIgnoreCase(operator);

        for (IfElseCondition condition : conditions) {
            boolean result = evaluateSingleCondition(condition, req);
            if (isAnd && !result) {
                return false; // AND模式，有一个不满足就false
            }
            if (!isAnd && result) {
                return true; // OR模式，有一个满足就true
            }
        }
        return isAnd; // AND模式全部满足返回true，OR模式全部不满足返回false
    }

    /**
     * 评估单个条件
     */
    private boolean evaluateSingleCondition(IfElseCondition condition, ChatReq req) {
        // 获取要比较的值
        String actualValue = resolveValue(condition.getNodeUuid(), condition.getNodeParamName(), req);
        String operator = condition.getOperator();
        String expectedValue = condition.getValue();

        log.info("IfElse条件评估: ref={}.{}, operator={}, actual=[{}], expected=[{}]",
                condition.getNodeUuid(), condition.getNodeParamName(), operator, actualValue, expectedValue);

        if (operator == null) {
            return false;
        }

        boolean result = switch (operator.toLowerCase()) {
            case "contains" -> actualValue != null && expectedValue != null
                    && actualValue.contains(expectedValue);
            case "equals", "eq" -> actualValue != null && expectedValue != null
                    && actualValue.equals(expectedValue);
            case "not_equals", "ne" -> actualValue == null || expectedValue == null
                    || !actualValue.equals(expectedValue);
            case "starts_with" -> actualValue != null && expectedValue != null
                    && actualValue.startsWith(expectedValue);
            case "ends_with" -> actualValue != null && expectedValue != null
                    && actualValue.endsWith(expectedValue);
            case "not_empty" -> StrUtil.isNotBlank(actualValue);
            case "empty" -> StrUtil.isBlank(actualValue);
            default -> {
                log.warn("不支持的IfElse运算符: {}", operator);
                yield false;
            }
        };

        log.info("IfElse条件评估结果: {}", result);
        return result;
    }

    /**
     * 从 req.context 中解析引用值
     * 优先按 nodeUuid + paramName 组合查找，其次按 nodeUuid.output 查找
     */
    private String resolveValue(String nodeUuid, String paramName, ChatReq req) {
        if (StrUtil.isBlank(nodeUuid)) {
            return null;
        }
        // 尝试 nodeUuid.paramName
        if (StrUtil.isNotBlank(paramName)) {
            Object val = req.getContext(nodeUuid + "." + paramName);
            if (val != null) {
                return val.toString();
            }
        }
        // 回退到 nodeUuid.output
        Object val = req.getContext(nodeUuid + ".output");
        return val != null ? val.toString() : null;
    }

    private WfNodeResult buildResult(String output, String branchResult) {
        WfNodeResult result = new WfNodeResult(output);
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("branchResult", branchResult);
        result.putMetadata("branchResult", branchResult);
        return result;
    }
}
