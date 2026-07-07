package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.llm.entity.LlmMessage;
import cn.nitemoon.cloud.llm.service.LlmMessageService;
import cn.nitemoon.cloud.llm.utils.MybatisUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.llm.utils.QueryRequest;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * @author hetao
 * @date 2025/1/19
 */
@RequestMapping("/aigc/message")
@RestController
@AllArgsConstructor
public class LlmMessageController {

    private final LlmMessageService messageMapper;

    @GetMapping("/page")
    @Operation(description = "分页查询消息")
    public Result list(LlmMessage data, QueryRequest queryPage) {
        LambdaQueryWrapper<LlmMessage> queryWrapper = Wrappers.<LlmMessage>lambdaQuery()
                .like(!StrUtil.isBlank(data.getMessage()), LlmMessage::getMessage, data.getMessage())
                .like(!StrUtil.isBlank(data.getUsername()), LlmMessage::getUsername, data.getUsername())
                .like(!StrUtil.isBlank(data.getModelName()), LlmMessage::getModelName, data.getModelName())
                .eq(!StrUtil.isBlank(data.getRole()), LlmMessage::getRole, data.getRole())
                .orderByDesc(LlmMessage::getCreateTime);
        IPage<LlmMessage> iPage = messageMapper.page(MybatisUtil.wrap(data, queryPage), queryWrapper);
        return Result.success(MybatisUtil.getData(iPage));
    }

    @GetMapping("/{id}")
    @Operation(description = "根据ID获取消息")
    public Result getById(@PathVariable String id) {
        return Result.success(messageMapper.getById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除会话消息")
    //@SaCheckPermission("aigc:message:delete")
    @DemoTrail(onlyView = true)
    public Result del(@PathVariable String id) {
        return Result.success(messageMapper.removeById(id));
    }

}
