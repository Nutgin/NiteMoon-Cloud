package cn.nitemoon.cloud.llm.service.impl;

import cn.nitemoon.cloud.llm.entity.LlmExecution;
import cn.nitemoon.cloud.llm.entity.LlmExecutionNode;
import cn.nitemoon.cloud.llm.mapper.LlmExecutionMapper;
import cn.nitemoon.cloud.llm.service.LlmExecutionNodeService;
import cn.nitemoon.cloud.llm.service.LlmExecutionService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * @author hetao
 * @date 2025/7/26
 */
@RequiredArgsConstructor
@Service
public class LlmExecutionServiceImpl extends ServiceImpl<LlmExecutionMapper, LlmExecution> implements LlmExecutionService {

    private final LlmExecutionNodeService nodeService;

    @Override
    public IPage<LlmExecution> page(IPage<LlmExecution> page, LambdaQueryWrapper<LlmExecution> wrapper) {
        return baseMapper.selectPage(page, wrapper);
    }

    @Override
    public Map<String, Object> getWithNodes(String id) {
        LlmExecution execution = baseMapper.selectById(id);
        List<LlmExecutionNode> nodes = nodeService.listByExecutionId(id);
        Map<String, Object> result = new HashMap<>();
        result.put("execution", execution);
        result.put("nodes", nodes);
        return result;
    }

    @Override
    public void cleanExpired(int days) {
        Date expireTime = Date.from(LocalDateTime.now().minusDays(days)
                .atZone(ZoneId.systemDefault()).toInstant());

        // Find expired execution records
        List<LlmExecution> expiredList = baseMapper.selectList(Wrappers.<LlmExecution>lambdaQuery()
                .le(LlmExecution::getCreateTime, expireTime)
                .select(LlmExecution::getId));

        if (expiredList.isEmpty()) {
            return;
        }

        List<String> expiredIds = expiredList.stream()
                .map(LlmExecution::getId)
                .toList();

        // Delete child records first (in batches of 500)
        for (int i = 0; i < expiredIds.size(); i += 500) {
            List<String> batch = expiredIds.subList(i, Math.min(i + 500, expiredIds.size()));
            nodeService.remove(Wrappers.<LlmExecutionNode>lambdaQuery()
                    .in(LlmExecutionNode::getExecutionId, batch));
        }

        // Delete parent records (in batches of 500)
        for (int i = 0; i < expiredIds.size(); i += 500) {
            List<String> batch = expiredIds.subList(i, Math.min(i + 500, expiredIds.size()));
            baseMapper.deleteBatchIds(batch);
        }
    }
}
