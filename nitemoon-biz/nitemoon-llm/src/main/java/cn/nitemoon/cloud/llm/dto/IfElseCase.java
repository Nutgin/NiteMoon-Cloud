package cn.nitemoon.cloud.llm.dto;

import lombok.Data;

import java.util.List;

/**
 * IfElse分支定义（workflow-designer 多分支模式）
 *
 * @author hetao
 */
@Data
public class IfElseCase {

    /**
     * 分支UUID，对应 edge 的 sourceHandle
     */
    private String uuid;

    /**
     * 条件逻辑运算符：and / or
     */
    private String operator = "and";

    /**
     * 该分支下的条件列表
     */
    private List<IfElseCondition> conditions;
}
