package cn.nitemoon.cloud.common.log.event;

import cn.nitemoon.cloud.upms.api.entity.SysLoginLog;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * @author hetao
 * @date: 2023/6/26 11:51
 **/
public class GlobalLoginLogEvent extends ApplicationEvent {

	@Getter
	private final SysLoginLog sysLoginLog;

	public GlobalLoginLogEvent(Object source, SysLoginLog sysLoginLog) {
		super(source);
		this.sysLoginLog = sysLoginLog;
	}

}
