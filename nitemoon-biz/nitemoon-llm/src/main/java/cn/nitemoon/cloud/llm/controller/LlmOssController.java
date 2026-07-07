package cn.nitemoon.cloud.llm.controller;

import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import cn.nitemoon.cloud.llm.entity.LlmOss;
import cn.nitemoon.cloud.llm.service.LlmOssService;
import cn.nitemoon.cloud.common.core.util.Result;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * @author hetao
 * @date 2025/1/19
 */
@RequestMapping("/aigc/oss")
@RestController
@AllArgsConstructor
public class LlmOssController {

    private final LlmOssService ossService;

    @GetMapping("/list")
    @Operation(description = "获取文件列表")
    public Result list() {
        List<LlmOss> list = ossService.list(Wrappers.<LlmOss>lambdaQuery()
                .eq(LlmOss::getUserId, SecurityUtils.getUserId())
                .orderByDesc(LlmOss::getCreateTime)
        );
        return Result.success(list);
    }

    @PostMapping("/upload")
    @Operation(description = "上传OSS文件")
    @DemoTrail(onlyView = true)
    public Result upload(MultipartFile file) {
        return Result.success(ossService.upload(file, String.valueOf(SecurityUtils.getUserId())));
    }

    @PutMapping
    @Operation(description = "更新OSS文件资源")
    @DemoTrail(onlyView = true)
    public Result update(@RequestBody LlmOss data) {
        ossService.updateById(data);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @Operation(description = "删除OSS文件资源")
    @DemoTrail(onlyView = true)
    public Result delete(@PathVariable String id) {
        ossService.removeById(id);
        return Result.success();
    }
}
