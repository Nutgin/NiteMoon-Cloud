package cn.nitemoon.cloud.upms.api.remote;

import cn.nitemoon.cloud.upms.api.entity.SysTenant;

import java.util.List;

/**
 * 租户
 *
 * @author hetao
 * @date 2023/1/06
 */
public interface RemoteTenantService {

	/**
	 * 查询全部有效租户
	 * @return
	 */
	List<SysTenant> list();

}
