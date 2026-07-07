package cn.nitemoon.cloud.llm.service.impl;

import cn.nitemoon.cloud.llm.entity.LlmExecutionNode;
import cn.nitemoon.cloud.llm.mapper.LlmExecutionNodeMapper;
import cn.nitemoon.cloud.llm.service.LlmExecutionNodeService;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author hetao
 * @date 2025/7/26
 */
@RequiredArgsConstructor
@Service
public class LlmExecutionNodeServiceImpl extends ServiceImpl<LlmExecutionNodeMapper, LlmExecutionNode> implements LlmExecutionNodeService {

    @Override
    public List<LlmExecutionNode> listByExecutionId(String executionId) {
        return baseMapper.selectList(Wrappers.<LlmExecutionNode>lambdaQuery()
                .eq(LlmExecutionNode::getExecutionId, executionId)
                .orderByAsc(LlmExecutionNode::getSortOrder));
    }
}
