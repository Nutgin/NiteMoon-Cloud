package cn.nitemoon.cloud.common.log.event;

import cn.nitemoon.cloud.common.myabtis.tenant.TenantContextHolder;
import cn.nitemoon.cloud.upms.api.entity.SysLog;
import cn.nitemoon.cloud.upms.api.entity.SysLoginLog;
import cn.nitemoon.cloud.upms.api.remote.RemoteSysLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;

/**
 * @author hetao
 * @date: 2023/6/26 11:51
 **/
@Slf4j
@RequiredArgsConstructor
public class GlobalLogEventListener {

	private final RemoteSysLogService remoteSysLogService;

	@Async("nitemoonAsyncExecutor")
	@EventListener(GlobalLogEvent.class)
	public void saveSysLog(GlobalLogEvent event) {
		SysLog sysLog = event.getSysLog();
		log.info("调用远程接口之前: tenantId = {}", TenantContextHolder.getTenantId());

		remoteSysLogService.saveLog(sysLog);
	}

	@Async("nitemoonAsyncExecutor")
	@EventListener(GlobalLoginLogEvent.class)
	public void saveSysLoginLog(GlobalLoginLogEvent event) {
		SysLoginLog sysLoginLog = event.getSysLoginLog();
		remoteSysLogService.saveLoginLog(sysLoginLog);
	}

}
