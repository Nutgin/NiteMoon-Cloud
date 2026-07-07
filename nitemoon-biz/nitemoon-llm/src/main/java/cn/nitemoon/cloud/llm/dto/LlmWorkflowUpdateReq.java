package cn.nitemoon.cloud.llm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class LlmWorkflowUpdateReq {
    @NotBlank
    private String uuid;

    @Size(min = 1)
    private List<LlmWfNodeDto> nodes = new ArrayList<>();

    private List<LlmWfEdgeReq> edges = new ArrayList<>();
    private List<String> deleteNodes = new ArrayList<>();
    private List<String> deleteEdges = new ArrayList<>();
}
