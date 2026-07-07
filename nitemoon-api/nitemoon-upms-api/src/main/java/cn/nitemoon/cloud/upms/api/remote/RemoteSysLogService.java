package cn.nitemoon.cloud.upms.api.remote;

import cn.nitemoon.cloud.upms.api.entity.SysLog;
import cn.nitemoon.cloud.upms.api.entity.SysLoginLog;

/**
 * 系统操作日志
 *
 * @author hetao
 * @date: 2023/6/26 11:01
 **/
public interface RemoteSysLogService {

	/**
	 * 保存系统操作日志
	 * @param sysLog
	 * @author hetao
	 * @date 2022/6/28
	 * @return: cn.nitemoon.cloud.common.core.util.Result
	 */
	Boolean saveLog(SysLog sysLog);

	/**
	 * 保存登录日志
	 * @param sysLoginLog
	 * @author hetao
	 * @date 2022/6/28
	 * @return: cn.nitemoon.cloud.common.core.util.Result
	 */
	Boolean saveLoginLog(SysLoginLog sysLoginLog);

}
