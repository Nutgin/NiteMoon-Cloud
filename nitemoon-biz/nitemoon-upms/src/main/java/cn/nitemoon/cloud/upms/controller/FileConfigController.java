package cn.nitemoon.cloud.upms.controller;

import cn.hutool.core.bean.BeanUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.upms.api.dto.FileConfigRespVO;
import cn.nitemoon.cloud.upms.api.dto.FileConfigSaveReqVO;
import cn.nitemoon.cloud.upms.api.entity.FileConfig;
import cn.nitemoon.cloud.upms.service.FileConfigService;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;


@Slf4j
@Validated
@RestController
@AllArgsConstructor
@Tag(description = "file-config", name = "文件配置")
@RequestMapping("/file-config")
public class FileConfigController {

    private final FileConfigService fileConfigService;

    @PostMapping("/create")
    @Operation(summary = "创建文件配置")
//    @SaCheckPermission("infra:file-config:create")
    public Result<Long> createFileConfig(@Valid @RequestBody FileConfigSaveReqVO createReqVO) {
        return Result.success(fileConfigService.createFileConfig(createReqVO));
    }

    @PutMapping("/update")
    @Operation(summary = "更新文件配置")
//    @SaCheckPermission("infra:file-config:update")
    public Result<Boolean> updateFileConfig(@Valid @RequestBody FileConfigSaveReqVO updateReqVO) {
        fileConfigService.updateFileConfig(updateReqVO);
        return Result.success(true);
    }

    @PutMapping("/update-master")
    @Operation(summary = "更新文件配置为 Master")
//    @SaCheckPermission("infra:file-config:update")
    public Result<Boolean> updateFileConfigMaster(@RequestParam("id") Long id) {
        fileConfigService.updateFileConfigMaster(id);
        return Result.success(true);
    }

    @DeleteMapping("/delete")
    @Operation(summary = "删除文件配置")
//    @SaCheckPermission("infra:file-config:delete")
    public Result<Boolean> deleteFileConfig(@RequestParam("id") Long id) {
        fileConfigService.deleteFileConfig(id);
        return Result.success(true);
    }

    @GetMapping("/get")
    @Operation(summary = "获得文件配置")
//    @SaCheckPermission("infra:file-config:query")
    public Result<FileConfigRespVO> getFileConfig(@RequestParam("id") Long id) {
        FileConfig config = fileConfigService.getFileConfig(id);
        return Result.success(BeanUtil.toBean(config, FileConfigRespVO.class));
    }

    @GetMapping("/page")
    @Operation(summary = "获得文件配置分页")
//    @SaCheckPermission("infra:file-config:query")
    public Result getFileConfigPage(Page page, @Valid FileConfig fileConfig) {

        return Result.success(fileConfigService.page(page, Wrappers.query(fileConfig)));
    }

    @GetMapping("/test")
    @Operation(summary = "测试文件配置是否正确")
//    @SaCheckPermission("infra:file-config:query")
    public Result<String> testFileConfig(@RequestParam("id") Long id) throws Exception {
        String url = fileConfigService.testFileConfig(id);
        return Result.success(url);
    }
}
