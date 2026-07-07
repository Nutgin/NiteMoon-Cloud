package cn.nitemoon.cloud.llm.service.impl;

import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import cn.nitemoon.cloud.llm.dto.LlmWorkflowResp;
import cn.nitemoon.cloud.llm.dto.LlmWorkflowUpdateReq;
import cn.nitemoon.cloud.llm.dto.LlmWfNodeDto;
import cn.nitemoon.cloud.llm.dto.LlmWfEdgeReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflow;
import cn.nitemoon.cloud.llm.mapper.LlmWorkflowMapper;
import cn.nitemoon.cloud.llm.service.LlmWorkflowEdgeService;
import cn.nitemoon.cloud.llm.service.LlmWorkflowNodeService;
import cn.nitemoon.cloud.llm.service.LlmWorkflowService;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LlmWorkflowServiceImpl extends ServiceImpl<LlmWorkflowMapper, LlmWorkflow>
        implements LlmWorkflowService {

    private final LlmWorkflowNodeService nodeService;
    private final LlmWorkflowEdgeService edgeService;
    private final ObjectMapper objectMapper;

    @Override
    public LlmWorkflowResp getDetailByAppId(String appId) {
        LlmWorkflow workflow = getOne(Wrappers.<LlmWorkflow>lambdaQuery()
                .eq(LlmWorkflow::getAppId, appId)
                .eq(LlmWorkflow::getIsDeleted, false)
                .last("limit 1"));
        if (workflow == null) {
            throw new CommonBusinessException("该应用暂无工作流配置");
        }
        return fillNodesAndEdges(workflow);
    }

    @Override
    public LlmWorkflowResp getDetailByUuid(String uuid) {
        LlmWorkflow workflow = getOne(Wrappers.<LlmWorkflow>lambdaQuery()
                .eq(LlmWorkflow::getUuid, uuid)
                .eq(LlmWorkflow::getIsDeleted, false)
                .last("limit 1"));
        if (workflow == null) {
            throw new CommonBusinessException("工作流不存在");
        }
        return fillNodesAndEdges(workflow);
    }

    @Override
    @Transactional
    public LlmWorkflowResp update(LlmWorkflowUpdateReq req) {
        LlmWorkflow workflow = getOne(Wrappers.<LlmWorkflow>lambdaQuery()
                .eq(LlmWorkflow::getUuid, req.getUuid())
                .eq(LlmWorkflow::getIsDeleted, false)
                .last("limit 1"));
        if (workflow == null) {
            throw new CommonBusinessException("工作流不存在");
        }
        long workflowId = workflow.getId();
        nodeService.createOrUpdateNodes(workflowId, req.getNodes());
        edgeService.createOrUpdateEdges(workflowId, req.getEdges());
        return getDetailByUuid(req.getUuid());
    }

    @Override
    @Transactional
    public LlmWorkflow createForApp(String appId) {
        // check if workflow already exists for this app
        LlmWorkflow existing = getOne(Wrappers.<LlmWorkflow>lambdaQuery()
                .eq(LlmWorkflow::getAppId, appId)
                .eq(LlmWorkflow::getIsDeleted, false)
                .last("limit 1"));
        if (existing != null) {
            return existing;
        }

        // create workflow
        String uuid = UUID.randomUUID().toString().replace("-", "");
        LlmWorkflow workflow = new LlmWorkflow();
        workflow.setUuid(uuid);
        workflow.setAppId(appId);
        workflow.setTitle("默认工作流");
        workflow.setIsEnable(true);
        workflow.setIsDeleted(false);
        save(workflow);

        // create default Start node
        String startUuid = UUID.randomUUID().toString().replace("-", "");
        LlmWfNodeDto startNode = new LlmWfNodeDto();
        startNode.setUuid(startUuid);
        startNode.setNodeType("Start");
        startNode.setTitle("开始");
        startNode.setNodeConfig(objectMapper.createObjectNode());
        startNode.setInputConfig(objectMapper.createObjectNode());
        startNode.setPositionX(100.0);
        startNode.setPositionY(200.0);

        // create default End node
        String endUuid = UUID.randomUUID().toString().replace("-", "");
        LlmWfNodeDto endNode = new LlmWfNodeDto();
        endNode.setUuid(endUuid);
        endNode.setNodeType("End");
        endNode.setTitle("结束");
        endNode.setNodeConfig(objectMapper.createObjectNode());
        endNode.setInputConfig(objectMapper.createObjectNode());
        endNode.setPositionX(600.0);
        endNode.setPositionY(200.0);

        nodeService.createOrUpdateNodes(workflow.getId(), List.of(startNode, endNode));

        // create default edge: Start -> End
        String edgeUuid = UUID.randomUUID().toString().replace("-", "");
        LlmWfEdgeReq edge = new LlmWfEdgeReq();
        edge.setUuid(edgeUuid);
        edge.setSourceNodeUuid(startUuid);
        edge.setTargetNodeUuid(endUuid);
        edgeService.createOrUpdateEdges(workflow.getId(), List.of(edge));

        log.info("为应用 {} 创建默认工作流, uuid: {}", appId, uuid);
        return workflow;
    }

    private LlmWorkflowResp fillNodesAndEdges(LlmWorkflow workflow) {
        LlmWorkflowResp resp = new LlmWorkflowResp();
        BeanUtils.copyProperties(workflow, resp);
        resp.setNodes(nodeService.listDtoByWorkflowId(workflow.getId()));
        resp.setEdges(edgeService.listDtoByWorkflowId(workflow.getId()));
        return resp;
    }
}
