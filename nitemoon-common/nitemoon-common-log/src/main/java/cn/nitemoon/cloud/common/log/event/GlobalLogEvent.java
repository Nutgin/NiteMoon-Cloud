package cn.nitemoon.cloud.common.log.event;

import cn.nitemoon.cloud.upms.api.entity.SysLog;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * @author hetao
 * @date: 2023/6/26 11:51
 **/
public class GlobalLogEvent extends ApplicationEvent {

	@Getter
	private final SysLog sysLog;

	public GlobalLogEvent(Object source, SysLog sysLog) {
		super(source);
		this.sysLog = sysLog;
	}

}
