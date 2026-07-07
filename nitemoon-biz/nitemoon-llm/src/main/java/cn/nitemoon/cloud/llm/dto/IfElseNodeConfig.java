package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

import java.util.List;

/**
 * IfElse条件分支节点配置
 *
 * @author hetao
 */
@Data
public class IfElseNodeConfig {

    /**
     * 多分支模式（workflow-designer）：每个case对应一个sourceHandle
     */
    private List<IfElseCase> cases;

    /**
     * 简单模式（workflow）：直接配置条件列表
     */
    private List<IfElseCondition> conditions;

    /**
     * 简单模式的逻辑运算符：and / or
     */
    private String logicalOperator = "and";
}
