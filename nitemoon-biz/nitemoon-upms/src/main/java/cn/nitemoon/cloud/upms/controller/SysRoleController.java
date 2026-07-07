package cn.nitemoon.cloud.upms.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.log.annotation.SysLog;
import cn.nitemoon.cloud.upms.api.dto.SysRoleMenuDTO;
import cn.nitemoon.cloud.upms.api.entity.SysRole;
import cn.nitemoon.cloud.upms.api.entity.SysRoleMenu;
import cn.nitemoon.cloud.upms.api.entity.SysUserRole;
import cn.nitemoon.cloud.upms.service.ISysRoleMenuService;
import cn.nitemoon.cloud.upms.service.ISysRoleService;
import cn.nitemoon.cloud.upms.service.ISysUserRoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 角色管理
 *
 * @author hetao
 * @since 2022/2/10 16:17
 */
@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/role")
@Tag(description = "role", name = "角色管理")
public class SysRoleController {

	private final ISysRoleService sysRoleService;

	private final ISysUserRoleService sysUserRoleService;

	private final ISysRoleMenuService sysRoleMenuService;

	@Operation(summary = "角色列表")
	@SaCheckPermission("upms:role:list")
	@GetMapping("/page")
	public Result<IPage<SysRole>> page(Page page, SysRole sysRole) {
		return Result.success(sysRoleService.getPage(page, sysRole));
	}

	@Operation(summary = "查询全部角色")
	@SaCheckPermission("upms:role:list")
	@GetMapping("/list")
	public Result<List<SysRole>> getList(SysRole sysRole) {
		return Result.success(
				sysRoleService.list(Wrappers.query(sysRole).lambda().select(SysRole::getRoleName, SysRole::getId)));
	}

	@Operation(summary = "角色查询")
	@SaCheckPermission("upms:role:get")
	@GetMapping("/{id}")
	public Result getById(@PathVariable String id) {
		return Result.success(sysRoleService.getById(id));
	}

	@Operation(summary = "角色新增")
	@SysLog("新增角色")
	@SaCheckPermission("upms:role:add")
	@PostMapping
	public Result add(@RequestBody SysRole sysRole) {
		if (sysRoleService.checkRole(new SysRole(null, sysRole.getRoleCode()))) {
			return Result.fail("角色编码已存在");
		}
		if (sysRoleService.checkRole(new SysRole(sysRole.getRoleName(), null))) {
			return Result.fail("角色名称已存在");
		}
		return Result.success(sysRoleService.save(sysRole));
	}

	@SysLog("修改角色")
	@Operation(summary = "角色修改")
	@SaCheckPermission("upms:role:edit")
	@PutMapping
	public Result edit(@RequestBody SysRole sysRole) {
		if (sysRoleService.checkRole(new SysRole(sysRole.getId(), sysRole.getRoleName(), null))) {
			return Result.fail("角色名称已存在");
		}
		return Result.success(sysRoleService.updateById(sysRole));
	}

	@Operation(summary = "角色删除")
	@SaCheckPermission("upms:role:del")
	@DeleteMapping("/{id}")
	public Result edit(@PathVariable String id) {
		long count = sysUserRoleService.count(Wrappers.<SysUserRole>lambdaQuery().eq(SysUserRole::getRoleId, id));
		if (count > 0) {
			return Result.fail("该角色已被用户绑定，不可删除");
		}
		// 删除角色关联菜单
		sysRoleMenuService.remove(Wrappers.<SysRoleMenu>lambdaQuery().eq(SysRoleMenu::getRoleId, id));
		return Result.success(sysRoleService.removeById(id));
	}

	@Operation(summary = "更新角色菜单")
	@SaCheckPermission("upms:role:edit")
	@PostMapping("/role/menu")
	public Result saveRoleMenu(@RequestBody SysRoleMenuDTO request) {
		return Result.success(sysRoleMenuService.saveRoleMenu(request));
	}

}
