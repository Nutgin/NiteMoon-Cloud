package cn.nitemoon.cloud.llm.workflow.config;

import lombok.Data;

@Data
public class BranchOutputConfig {
    /**
     * Target node UUID of the branch
     */
    private String branchId;

    /**
     * Parameter name to extract from branch result
     */
    private String param;

    /**
     * Optional alias for the output
     */
    private String alias;
}
