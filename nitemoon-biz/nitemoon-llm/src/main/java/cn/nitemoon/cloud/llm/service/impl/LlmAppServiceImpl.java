package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.entity.LlmApp;
import cn.nitemoon.cloud.llm.mapper.LlmAppMapper;
import cn.nitemoon.cloud.llm.service.LlmAppService;
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
public class LlmAppServiceImpl extends ServiceImpl<LlmAppMapper, LlmApp> implements LlmAppService {

    @Override
    public List<LlmApp> list(LlmApp data) {
        return baseMapper.selectList(Wrappers.<LlmApp>lambdaQuery()
                .like(StrUtil.isNotBlank(data.getName()), LlmApp::getName, data.getName()));
    }

    @Override
    public LlmApp getById(String id) {
        return baseMapper.selectById(id);
    }

    @Override
    public LlmApp getByWebPageKey(String webPageKey) {
        return getOne(Wrappers.<LlmApp>lambdaQuery()
                .eq(LlmApp::getWebPageKey, webPageKey)
                .eq(LlmApp::getEnableWebPage, true));
    }
}
