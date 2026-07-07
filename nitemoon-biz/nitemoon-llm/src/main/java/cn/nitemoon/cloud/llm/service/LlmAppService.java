

package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.entity.LlmApp;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * @author hetao
 * @date 2025/7/26
 */
public interface LlmAppService extends IService<LlmApp> {

    List<LlmApp> list(LlmApp data);

    LlmApp getById(String id);

    LlmApp getByWebPageKey(String webPageKey);
}
