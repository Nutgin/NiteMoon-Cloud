package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.entity.LlmExecutionNode;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * @author hetao
 * @date 2025/7/26
 */
public interface LlmExecutionNodeService extends IService<LlmExecutionNode> {

    List<LlmExecutionNode> listByExecutionId(String executionId);
}
