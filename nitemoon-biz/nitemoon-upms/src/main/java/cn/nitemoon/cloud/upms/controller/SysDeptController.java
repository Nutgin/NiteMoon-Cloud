package cn.nitemoon.cloud.upms.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.log.annotation.SysLog;
import cn.nitemoon.cloud.upms.api.entity.SysDept;
import cn.nitemoon.cloud.upms.service.ISysDeptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 部门管理
 *
 * @author hetao
 * @since 2022/2/26 16:37
 */
@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/dept")
@Tag(description = "dept", name = "部门管理")
public class SysDeptController {

	private final ISysDeptService sysDeptService;

	@Operation(summary = "树形结构部门列表")
	@SaCheckPermission("upms:dept:page")
	@GetMapping("/tree")
	public Result tree() {
		return Result.success(sysDeptService.getTreeList());
	}

	@Operation(summary = "列表结构部门列表")
	@SaCheckPermission("upms:dept:page")
	@GetMapping("/list")
	public Result list() {
		return Result.success(sysDeptService.list());
	}


	@Operation(summary = "部门查询")
	@SaCheckPermission("upms:dept:get")
	@GetMapping("/{id}")
	public Result getById(@PathVariable String id) {
		return Result.success(sysDeptService.getById(id));
	}

	@Operation(summary = "部门新增")
	@SysLog("新增部门")
	@SaCheckPermission("upms:dept:add")
	@PostMapping
	public Result add(@RequestBody SysDept sysDept) {
		return Result.success(sysDeptService.save(sysDept));
	}

	@Operation(summary = "部门修改")
	@SysLog("修改部门")
	@SaCheckPermission("upms:dept:edit")
	@PutMapping
	public Result edit(@RequestBody SysDept sysDept) {
		return Result.success(sysDeptService.updateById(sysDept));
	}

	@Operation(summary = "部门删除")
	@SysLog("删除部门")
	@SaCheckPermission("upms:dept:del")
	@DeleteMapping("/{id}")
	public Result del(@PathVariable String id) {
		long count = sysDeptService.count(Wrappers.<SysDept>lambdaQuery().eq(SysDept::getParentId, id));
		if (count > 0) {
			return Result.fail("存在下级部门，不可删除");
		}
		return Result.success(sysDeptService.removeById(id));
	}

}
