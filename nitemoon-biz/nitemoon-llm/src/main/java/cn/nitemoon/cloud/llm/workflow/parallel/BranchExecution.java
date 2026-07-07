package cn.nitemoon.cloud.llm.workflow.parallel;

import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowEdge;
import cn.nitemoon.cloud.llm.workflow.WfNodeResult;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.concurrent.CompletableFuture;

@Data
@AllArgsConstructor
public class BranchExecution {
    private LlmWorkflowEdge edge;
    private ChatReq branchContext;
    private CompletableFuture<WfNodeResult> future;
}
