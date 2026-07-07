

package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.entity.LlmModel;
import cn.nitemoon.cloud.llm.enums.ModelTypeEnum;
import cn.nitemoon.cloud.llm.mapper.LlmModelMapper;
import cn.nitemoon.cloud.llm.service.LlmModelService;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author hetao
 * @date 2025/1/19
 */
@Service
@RequiredArgsConstructor
public class LlmModelServiceImpl extends ServiceImpl<LlmModelMapper, LlmModel> implements LlmModelService {

    @Override
    public List<LlmModel> getChatModels() {
        List<LlmModel> list = baseMapper.selectList(Wrappers.<LlmModel>lambdaQuery()
                .eq(LlmModel::getType, ModelTypeEnum.CHAT.name()));
        list.forEach(this::hide);
        return list;
    }

    @Override
    public List<LlmModel> getImageModels() {
        List<LlmModel> list = baseMapper.selectList(Wrappers.<LlmModel>lambdaQuery()
                .eq(LlmModel::getType, ModelTypeEnum.TEXT_IMAGE.name()));
        list.forEach(this::hide);
        return list;
    }

    @Override
    public List<LlmModel> getEmbeddingModels() {
        List<LlmModel> list = baseMapper.selectList(Wrappers.<LlmModel>lambdaQuery()
                .eq(LlmModel::getType, ModelTypeEnum.EMBEDDING.name()));
        list.forEach(this::hide);
        return list;
    }

    @Override
    public List<LlmModel> list(LlmModel data) {
        List<LlmModel> list = this.list(Wrappers.<LlmModel>lambdaQuery()
                .eq(StrUtil.isNotBlank(data.getType()), LlmModel::getType, data.getType())
                .eq(StrUtil.isNotBlank(data.getProvider()), LlmModel::getProvider, data.getProvider()));
        list.forEach(this::hide);
        return list;
    }

    @Override
    public Page<LlmModel> page(LlmModel data, QueryRequest queryPage) {
        Page<LlmModel> page = new Page<>(queryPage.getPageNum(), queryPage.getPageSize());
        Page<LlmModel> iPage = this.page(page, Wrappers.<LlmModel>lambdaQuery().eq(LlmModel::getProvider, data.getProvider()));
        iPage.getRecords().forEach(this::hide);
        return iPage;
    }

    @Override
    public LlmModel selectById(String id) {
        LlmModel model = this.getById(id);
        hide(model);
        return model;
    }

    @Override
    public LlmModel selectByIdRaw(String id) {
        return this.getById(id);
    }

    private void hide(LlmModel model) {
        if (model == null || StrUtil.isBlank(model.getApiKey())) {
            return;
        }
        String key = StrUtil.hide(model.getApiKey(), 3, model.getApiKey().length() - 4);
        model.setApiKey(key);

        if (StrUtil.isBlank(model.getSecretKey())) {
            return;
        }
        String sec = StrUtil.hide(model.getSecretKey(), 3, model.getSecretKey().length() - 4);
        model.setSecretKey(sec);
    }
}

