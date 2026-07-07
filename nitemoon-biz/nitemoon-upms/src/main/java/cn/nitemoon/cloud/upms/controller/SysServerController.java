package cn.nitemoon.cloud.upms.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.upms.api.vo.server.Server;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * CPU相关信息
 *
 * @author hetao
 * @since 2022/5/21 15:35
 */
@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/server")
@Tag(description = "server", name = "服务器监控")
public class SysServerController {

	@Operation(summary = "查询服务器监控信息")
	@GetMapping
	@SaCheckPermission("upms:server:get")
	public Result<Server> getServerInfo() throws Exception {
		Server server = new Server();
		server.copyTo();
		return Result.success(server);
	}

}
