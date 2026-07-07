package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.core.util.JsonUtils;
import cn.nitemoon.cloud.llm.dto.LlmWfNodeDto;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowNode;
import cn.nitemoon.cloud.llm.mapper.LlmWorkflowNodeMapper;
import cn.nitemoon.cloud.llm.service.LlmWorkflowNodeService;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LlmWorkflowNodeServiceImpl extends ServiceImpl<LlmWorkflowNodeMapper, LlmWorkflowNode>
        implements LlmWorkflowNodeService {

    @Override
    public List<LlmWfNodeDto> listDtoByWorkflowId(Long workflowId) {
        List<LlmWorkflowNode> nodes = listByWorkflowId(workflowId);
        return nodes.stream().map(node -> {
            LlmWfNodeDto dto = new LlmWfNodeDto();
            BeanUtils.copyProperties(node, dto);
            if (node.getInputConfig() != null) {
                dto.setInputConfig(JsonUtils.parseObject(node.getInputConfig(), ObjectNode.class));
            }
            if (node.getNodeConfig() != null) {
                dto.setNodeConfig(JsonUtils.parseObject(node.getNodeConfig(), ObjectNode.class));
            }
            if (node.getOutputConfig() != null) {
                dto.setOutputConfig(JsonUtils.parseObject(node.getOutputConfig(), ObjectNode.class));
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<LlmWorkflowNode> listByWorkflowId(Long workflowId) {
        return list(Wrappers.<LlmWorkflowNode>lambdaQuery()
                .eq(LlmWorkflowNode::getWorkflowId, workflowId)
                .eq(LlmWorkflowNode::getIsDeleted, false));
    }

    @Override
    @Transactional
    public void createOrUpdateNodes(Long workflowId, List<LlmWfNodeDto> nodes) {
        List<String> uuidList = new ArrayList<>();
        for (LlmWfNodeDto node : nodes) {
            LlmWorkflowNode entity = new LlmWorkflowNode();
            BeanUtils.copyProperties(node, entity);
            entity.setWorkflowId(workflowId);
            if (node.getInputConfig() != null) {
                entity.setInputConfig(JsonUtils.toJsonString(node.getInputConfig()));
            }
            if (node.getNodeConfig() != null) {
                entity.setNodeConfig(JsonUtils.toJsonString(node.getNodeConfig()));
            }
            if (node.getOutputConfig() != null && node.getOutputConfig().has("outputs")
                    && node.getOutputConfig().get("outputs").isArray()
                    && node.getOutputConfig().get("outputs").size() > 0) {
                entity.setOutputConfig(JsonUtils.toJsonString(node.getOutputConfig()));
            } else {
                entity.setOutputConfig(JsonUtils.toJsonString(getDefaultOutputConfig(node.getNodeType())));
            }

            LlmWorkflowNode old = getByUuid(workflowId, node.getUuid());
            if (old != null) {
                log.info("更新节点,uuid:{},title:{}", node.getUuid(), node.getTitle());
                entity.setId(old.getId());
            } else {
                log.info("新增节点,uuid:{},title:{}", node.getUuid(), node.getTitle());
                entity.setId(null);
            }
            uuidList.add(node.getUuid());
            saveOrUpdate(entity);
        }
        // soft-delete nodes not in the list
        update(Wrappers.<LlmWorkflowNode>lambdaUpdate()
                .eq(LlmWorkflowNode::getWorkflowId, workflowId)
                .notIn(CollUtil.isNotEmpty(uuidList), LlmWorkflowNode::getUuid, uuidList)
                .set(LlmWorkflowNode::getIsDeleted, true));
    }

    @Override
    public LlmWorkflowNode getByUuid(Long workflowId, String uuid) {
        return getOne(Wrappers.<LlmWorkflowNode>lambdaQuery()
                .eq(LlmWorkflowNode::getWorkflowId, workflowId)
                .eq(LlmWorkflowNode::getUuid, uuid)
                .eq(LlmWorkflowNode::getIsDeleted, false)
                .last("limit 1"));
    }

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ObjectNode getDefaultOutputConfig(String nodeType) {
        ObjectNode config = MAPPER.createObjectNode();
        ArrayNode outputs = config.putArray("outputs");
        if (StrUtil.isBlank(nodeType)) {
            return config;
        }
        switch (nodeType) {
            case "Start":
                addOutput(outputs, "text", "string", "用户输入文本", true);
                addOutput(outputs, "files", "array", "用户上传附件", true);
                addOutput(outputs, "conversationId", "string", "会话ID", true);
                addOutput(outputs, "appId", "string", "应用ID", true);
                break;
            case "LLM":
            case "MultimodalLlm":
                addOutput(outputs, "llm_output", "string", "模型输出", true);
                addOutput(outputs, "input_tokens", "number", "输入Token", true);
                addOutput(outputs, "output_tokens", "number", "输出Token", true);
                break;
            case "KnowledgeRetrieval":
                addOutput(outputs, "retrieval_result", "string", "检索结果", true);
                addOutput(outputs, "doc_count", "number", "文档数量", true);
                break;
            case "KgRetrieval":
                addOutput(outputs, "retrieval_result", "string", "检索结果", true);
                break;
            case "DocExtractor":
                addOutput(outputs, "tool_output", "string", "提取结果", true);
                break;
            case "IfElse":
                addOutput(outputs, "branch_result", "string", "分支结果", true);
                break;
            case "End":
                break;
            default:
                addOutput(outputs, "tool_output", "string", "执行结果", true);
                addOutput(outputs, "status", "string", "执行状态", true);
                break;
        }
        return config;
    }

    private void addOutput(ArrayNode outputs, String name, String type, String label, boolean fixed) {
        ObjectNode item = outputs.addObject();
        item.put("name", name);
        item.put("type", type);
        item.put("label", label);
        item.put("fixed", fixed);
    }
}
