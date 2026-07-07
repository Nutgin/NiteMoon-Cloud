package cn.nitemoon.cloud.upms.dubbo;

import cn.nitemoon.cloud.upms.api.entity.SysLog;
import cn.nitemoon.cloud.upms.api.entity.SysLoginLog;
import cn.nitemoon.cloud.upms.api.remote.RemoteSysLogService;
import cn.nitemoon.cloud.upms.service.ISysLogService;
import cn.nitemoon.cloud.upms.service.ISysLoginLogService;
import lombok.RequiredArgsConstructor;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.stereotype.Service;

/**
 * @author lijia
 * @description
 * @date 2024/11/22
 */
@Service
@DubboService
@RequiredArgsConstructor
public class RemoteSysLogServiceImpl implements RemoteSysLogService {

	private final ISysLogService sysLogService;

	private final ISysLoginLogService sysLoginLogService;

	@Override
	public Boolean saveLog(SysLog sysLog) {
		return sysLogService.save(sysLog);
	}

	@Override
	public Boolean saveLoginLog(SysLoginLog sysLoginLog) {
		return sysLoginLogService.save(sysLoginLog);
	}

}
