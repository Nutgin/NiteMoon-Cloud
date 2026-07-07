

package cn.nitemoon.cloud.llm.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.llm.entity.LlmConversation;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.mapper.LlmConversationMapper;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import cn.nitemoon.cloud.llm.service.LlmMessageService;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import cn.nitemoon.cloud.upms.api.entity.SysUser;
import cn.nitemoon.cloud.upms.api.remote.RemoteSysUserService;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * @author hetao
 * @date 2025/1/4
 */
@Service
@RequiredArgsConstructor
public class LlmMessageServiceImpl extends ServiceImpl<LlmMessageMapper, LlmMessage> implements
        LlmMessageService {
    private final LlmConversationMapper conversationMapper;
    @DubboReference
    private final RemoteSysUserService userService;

    @Override
    public List<LlmConversation> conversations(String userId, String appId) {
        return conversationMapper.selectList(
                Wrappers.<LlmConversation>lambdaQuery()
                        .eq(LlmConversation::getUserId, userId)
                        .eq(StrUtil.isNotBlank(appId), LlmConversation::getAppId, appId)
                        .orderByDesc(LlmConversation::getCreateTime));
    }

    @Override
    public IPage<LlmConversation> conversationPages(LlmConversation data, QueryRequest queryPage) {
        Page<LlmConversation> page = new Page<>(queryPage.getPageNum(), queryPage.getPageSize());
        Page<LlmConversation> iPage = conversationMapper.selectPage(page, Wrappers.<LlmConversation>lambdaQuery()
                .like(!StrUtil.isBlank(data.getTitle()), LlmConversation::getTitle, data.getTitle())
                .orderByDesc(LlmConversation::getCreateTime));

        if (!iPage.getRecords().isEmpty()) {
            Map<String, List<SysUser>> map = userService.list().stream().collect(Collectors.groupingBy(SysUser::getId));
            Set<String> ids = iPage.getRecords().stream().map(LlmConversation::getId).collect(Collectors.toSet());
            List<LlmMessage> messages = baseMapper.selectList(Wrappers.<LlmMessage>lambdaQuery()
                    .in(LlmMessage::getConversationId, ids)
                    .orderByDesc(LlmMessage::getCreateTime));

            iPage.getRecords().forEach(i -> {
                List<SysUser> list = map.get(i.getUserId());
                if (list != null && !list.isEmpty()) {
                    i.setUsername(list.get(0).getUsername());
                }

                List<LlmMessage> messageList = messages.stream().filter(m -> m.getConversationId() != null && m.getConversationId().equals(i.getId())).collect(Collectors.toList());
                if (!messageList.isEmpty()) {
                    i.setChatTotal(messageList.size());
                    i.setEndTime(messageList.get(0).getCreateTime());
                    i.setTokenUsed(messageList.stream().filter(m -> m.getCompletionTokens() != null).mapToInt(LlmMessage::getCompletionTokens).sum());
                }
            });
        }
        return iPage;
    }

    @Override
    @Transactional
    public LlmConversation addConversation(LlmConversation conversation) {
        conversation.setCreateTime(new Date());
        conversationMapper.insert(conversation);
        return conversation;
    }

    @Override
    @Transactional
    public void updateConversation(LlmConversation conversation) {
        conversationMapper.updateById(
                new LlmConversation().setId(conversation.getId())
                        .setTitle(conversation.getTitle()));
    }

    @Override
    @Transactional
    public void delConversation(String conversationId) {
        conversationMapper.deleteById(conversationId);
        baseMapper.delete(
                Wrappers.<LlmMessage>lambdaQuery()
                        .eq(LlmMessage::getConversationId, conversationId));
    }

    @Override
    @Transactional
    public LlmMessage addMessage(LlmMessage message) {
        message.setCreateTime(new Date());
        baseMapper.insert(message);
        return message;
    }

    @Override
    @Transactional
    public void clearMessage(String conversationId) {
        baseMapper.delete(
                Wrappers.<LlmMessage>lambdaQuery()
                        .eq(LlmMessage::getConversationId, conversationId));
    }

    @Override
    public List<LlmMessage> getMessages(String conversationId) {
        // 避免页面渲染压力大，只截取最新的20条数据
        return baseMapper.selectPage(new Page<>(0, 20), Wrappers.<LlmMessage>lambdaQuery()
                .eq(LlmMessage::getConversationId, conversationId)
                .orderByAsc(LlmMessage::getCreateTime)
        ).getRecords();
    }

    @Override
    public List<LlmMessage> getMessages(String conversationId, String userId) {
        // 避免页面渲染压力大，只截取最新的100条数据
        return baseMapper.selectPage(new Page<>(0, 100), Wrappers.<LlmMessage>lambdaQuery()
                .eq(LlmMessage::getConversationId, conversationId)
                .eq(LlmMessage::getUserId, userId)
                .orderByAsc(LlmMessage::getCreateTime)
        ).getRecords();
    }
}

