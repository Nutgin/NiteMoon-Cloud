package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.nitemoon.cloud.llm.dto.LlmWfEdgeReq;
import cn.nitemoon.cloud.llm.entity.LlmWorkflowEdge;
import cn.nitemoon.cloud.llm.mapper.LlmWorkflowEdgeMapper;
import cn.nitemoon.cloud.llm.service.LlmWorkflowEdgeService;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LlmWorkflowEdgeServiceImpl extends ServiceImpl<LlmWorkflowEdgeMapper, LlmWorkflowEdge>
        implements LlmWorkflowEdgeService {

    @Override
    public List<LlmWfEdgeReq> listDtoByWorkflowId(Long workflowId) {
        List<LlmWorkflowEdge> edges = listByWorkflowId(workflowId);
        return edges.stream().map(edge -> {
            LlmWfEdgeReq req = new LlmWfEdgeReq();
            BeanUtils.copyProperties(edge, req);
            return req;
        }).collect(Collectors.toList());
    }

    @Override
    public List<LlmWorkflowEdge> listByWorkflowId(Long workflowId) {
        return list(Wrappers.<LlmWorkflowEdge>lambdaQuery()
                .eq(LlmWorkflowEdge::getWorkflowId, workflowId)
                .eq(LlmWorkflowEdge::getIsDeleted, false));
    }

    @Override
    @Transactional
    public void createOrUpdateEdges(Long workflowId, List<LlmWfEdgeReq> edges) {
        List<String> uuidList = new ArrayList<>();
        for (LlmWfEdgeReq edge : edges) {
            LlmWorkflowEdge entity = new LlmWorkflowEdge();
            BeanUtils.copyProperties(edge, entity);
            entity.setWorkflowId(workflowId);

            LlmWorkflowEdge old = getOne(Wrappers.<LlmWorkflowEdge>lambdaQuery()
                    .eq(LlmWorkflowEdge::getUuid, edge.getUuid())
                    .eq(LlmWorkflowEdge::getIsDeleted, false)
                    .last("limit 1"));
            if (old != null) {
                log.info("更新边,uuid:{},source:{},target:{}", edge.getUuid(), edge.getSourceNodeUuid(), edge.getTargetNodeUuid());
                entity.setId(old.getId());
            } else {
                log.info("新增边,uuid:{},source:{},target:{}", edge.getUuid(), edge.getSourceNodeUuid(), edge.getTargetNodeUuid());
                entity.setId(null);
            }
            uuidList.add(edge.getUuid());
            saveOrUpdate(entity);
        }
        // soft-delete edges not in the list
        update(Wrappers.<LlmWorkflowEdge>lambdaUpdate()
                .eq(LlmWorkflowEdge::getWorkflowId, workflowId)
                .notIn(CollUtil.isNotEmpty(uuidList), LlmWorkflowEdge::getUuid, uuidList)
                .set(LlmWorkflowEdge::getIsDeleted, true));
    }
}
