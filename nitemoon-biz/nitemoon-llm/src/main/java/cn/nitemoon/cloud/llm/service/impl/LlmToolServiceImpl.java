package cn.nitemoon.cloud.llm.service.impl;

import cn.nitemoon.cloud.llm.entity.LlmTool;
import cn.nitemoon.cloud.llm.mapper.LlmToolMapper;
import cn.nitemoon.cloud.llm.service.LlmToolService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LlmToolServiceImpl extends ServiceImpl<LlmToolMapper, LlmTool> implements LlmToolService {
}
