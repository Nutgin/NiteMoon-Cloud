package cn.nitemoon.cloud.llm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * IfElse条件定义
 *
 * @author hetao
 */
@Data
public class IfElseCondition {

    /**
     * 引用的节点UUID（获取该节点的输出进行比较）
     */
    @JsonProperty("node_uuid")
    private String nodeUuid;

    /**
     * 引用的参数名（如 "output"）
     */
    @JsonProperty("node_param_name")
    private String nodeParamName;

    /**
     * 比较运算符：contains, equals, starts_with, ends_with, not_empty, empty
     */
    private String operator;

    /**
     * 比较值（empty/not_empty 时可为空）
     */
    private String value;
}
