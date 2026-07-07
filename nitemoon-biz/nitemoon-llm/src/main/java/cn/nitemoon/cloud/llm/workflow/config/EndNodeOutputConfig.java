package cn.nitemoon.cloud.llm.workflow.config;

import lombok.Data;
import java.util.List;

@Data
public class EndNodeOutputConfig {
    /**
     * Output mode: select, merge, first
     */
    private String mode;

    /**
     * Branch outputs configuration (for select mode)
     */
    private List<BranchOutputConfig> branchOutputs;

    /**
     * Merge strategy: concat, join, json_array (for merge mode)
     */
    private String mergeStrategy;

    /**
     * Separator for join merge strategy
     */
    private String separator;
}
