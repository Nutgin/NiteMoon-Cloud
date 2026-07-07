package cn.nitemoon.cloud.upms.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.upms.api.entity.SysLog;
import cn.nitemoon.cloud.upms.service.ISysLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 日志管理
 *
 * @author hetao
 * @since 2022/2/26 16:39
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/log")
@Tag(description = "log", name = "日志管理")

public class SysLogController {

	private final ISysLogService sysLogService;

	@Operation(summary = "日志列表")
	@SaCheckPermission("upms:log:page")
	@GetMapping("/page")
	public Result page(Page page, SysLog sysLog) {
		QueryWrapper<SysLog> query = Wrappers.query();
		// 支持userName模糊查询
		if (sysLog.getUserName() != null && !sysLog.getUserName().isEmpty()) {
			query.like("user_name", sysLog.getUserName());
		}
		// 支持title模糊查询
		if (sysLog.getTitle() != null && !sysLog.getTitle().isEmpty()) {
			query.like("title", sysLog.getTitle());
		}
		query.orderByDesc("create_time");
		return Result.success(sysLogService.page(page, query));
	}

	@Operation(summary = "通过id查询日志")
	@SaCheckPermission("upms:log:get")
	@GetMapping("/{id}")
	public Result getById(@PathVariable String id) {
		return Result.success(sysLogService.getById(id));
	}

}
