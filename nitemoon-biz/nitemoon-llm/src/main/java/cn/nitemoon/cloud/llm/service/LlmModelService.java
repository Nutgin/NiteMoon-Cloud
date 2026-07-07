package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * @author hetao
 * @date 2025/1/19
 */
public interface LlmModelService extends IService<LlmModel> {

    List<LlmModel> getChatModels();

    List<LlmModel> getImageModels();

    List<LlmModel> getEmbeddingModels();

    List<LlmModel> list(LlmModel data);

    Page<LlmModel> page(LlmModel data, QueryRequest queryPage);

    LlmModel selectById(String id);

    LlmModel selectByIdRaw(String id);
}
