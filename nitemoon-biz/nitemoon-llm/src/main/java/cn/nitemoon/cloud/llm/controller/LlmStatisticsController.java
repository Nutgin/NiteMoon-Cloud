package cn.nitemoon.cloud.llm.controller;

import cn.hutool.core.lang.Dict;
import cn.nitemoon.cloud.llm.mapper.LlmAppMapper;
import cn.nitemoon.cloud.llm.mapper.LlmKnowledgeMapper;
import cn.nitemoon.cloud.llm.mapper.LlmMessageMapper;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.upms.api.remote.RemoteSysUserService;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author hetao
 * @date 2025/6/8
 */
@RequestMapping("/aigc/statistic")
@RestController
@AllArgsConstructor
@Tag(name = "AI统计管理")
public class LlmStatisticsController {

    private final LlmMessageMapper messageMapper;
    @DubboReference
    private final RemoteSysUserService userService;
    private final LlmKnowledgeMapper knowledgeMapper;
    private final LlmAppMapper appMapper;

    @GetMapping("/requestBy30")
    public Result request30Chart() {
        return Result.success(messageMapper.getReqChartBy30());
    }

    @GetMapping("/tokenBy30")
    public Result token30Chart() {
        return Result.success(messageMapper.getTokenChartBy30());
    }

    @GetMapping("/token")
    public Result tokenChart() {
        return Result.success(messageMapper.getTokenChart());
    }

    @GetMapping("/request")
    public Result requestChart() {
        return Result.success(messageMapper.getReqChart());
    }

    @GetMapping("/home")
    public Result home() {
        Dict reqData = messageMapper.getCount();
        Dict totalData = messageMapper.getTotalSum();
        Long userData = null;
        Long totalKnowledge = knowledgeMapper.selectCount(Wrappers.query());
        Long totalPrompt = appMapper.selectCount(Wrappers.query());
        Dict result = Dict.create();
        result.putAll(reqData);
        result.putAll(totalData);
        result.set("totalUser",userData);
        result.set("totalKnowledge", totalKnowledge.intValue()).set("totalPrompt", totalPrompt.intValue());
        return Result.success(result);
    }
}
