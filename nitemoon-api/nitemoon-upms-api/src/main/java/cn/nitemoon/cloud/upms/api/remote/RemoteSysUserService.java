package cn.nitemoon.cloud.upms.api.remote;

import cn.nitemoon.cloud.upms.api.entity.SysUser;

import java.util.List;

/**
 * 系统用户 feign
 *
 * @author hetao
 * @date 2022/6/28
 */
public interface RemoteSysUserService {

	/**
	 * 通过用户名查询用户、角色信息
	 *
	 * @author hetao
	 * @date 2022/6/28
	 * @param username
	 * @return: cn.nitemoon.cloud.upms.common.entity.SysUser
	 */
	SysUser getUserInfo(String username);

	/**
	 * 通过手机号查询用户、角色信息
	 *
	 * @author hetao
	 * @date 2022/7/5
	 * @param phone
	 * @return: cn.nitemoon.cloud.common.core.util.Result<cn.nitemoon.cloud.upms.common.entity.SysUser>
	 */
	SysUser getUserInfoByPhone(String phone);

	/**
	 * 通过openId查询用户、角色信息
	 *
	 * @author hetao
	 * @date 2025/03/09
	 * @param openId
	 * @return: cn.nitemoon.cloud.upms.api.entity.SysUser
	 */
	SysUser getUserInfoByOpenId(String openId);

	/**
	 * 保存微信小程序用户
	 *
	 * @author hetao
	 * @date 2025/03/09
	 * @param sysUser
	 * @return: boolean
	 */
	boolean saveWechatUser(SysUser sysUser);


	List<SysUser> list();

	List<SysUser> listByIds(List<String> userIds);
}
