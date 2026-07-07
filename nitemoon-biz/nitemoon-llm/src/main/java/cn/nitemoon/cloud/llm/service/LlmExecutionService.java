package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.entity.LlmExecution;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Map;

/**
 * @author hetao
 * @date 2025/7/26
 */
public interface LlmExecutionService extends IService<LlmExecution> {

    IPage<LlmExecution> page(IPage<LlmExecution> page, LambdaQueryWrapper<LlmExecution> wrapper);

    Map<String, Object> getWithNodes(String id);

    void cleanExpired(int days);
}
