

package cn.nitemoon.cloud.llm.service.impl;

import cn.nitemoon.cloud.llm.entity.LlmEmbedStore;
import cn.nitemoon.cloud.llm.mapper.LlmEmbedStoreMapper;
import cn.nitemoon.cloud.llm.service.LlmEmbedStoreService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * @author hetao
 * @date 2025/10/28
 */
@Service
@RequiredArgsConstructor
public class LlmEmbedStoreServiceImpl extends ServiceImpl<LlmEmbedStoreMapper, LlmEmbedStore> implements LlmEmbedStoreService {

}
