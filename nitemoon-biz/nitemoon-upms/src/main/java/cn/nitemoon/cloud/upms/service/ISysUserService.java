package cn.nitemoon.cloud.upms.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import cn.nitemoon.cloud.upms.api.entity.SysUser;

/**
 * 系统用户
 *
 * @author hetao
 * @since 2022/2/26 16:47
 */
public interface ISysUserService extends IService<SysUser> {

	/**
	 * 查询用户信息
	 *
	 * @author hetao
	 * @date 2022/5/31
	 * @param sysUser
	 * @return: cn.nitemoon.cloud.upms.common.entity.SysUser
	 */

	SysUser findUserInfo(SysUser sysUser);

	/**
	 * 用户名查询用户信息
	 *
	 * @author hetao
	 * @date 2022/5/31
	 * @param username
	 * @return: cn.nitemoon.cloud.upms.common.entity.SysUser
	 */
	SysUser findUserByName(String username);

	/**
	 * 手机号查询用户信息
	 *
	 * @author hetao
	 * @date 2022/5/31
	 * @param phone
	 * @return: cn.nitemoon.cloud.upms.common.entity.SysUser
	 */
	SysUser findUserByPhone(String phone);

	/**
	 * openId查询用户信息
	 *
	 * @author hetao
	 * @date 2025/03/09
	 * @param openId
	 * @return: cn.nitemoon.cloud.upms.api.entity.SysUser
	 */
	SysUser findUserByOpenId(String openId);

	/**
	 * 新增用户
	 *
	 * @author hetao
	 * @date 2022/5/31
	 * @param sysUser
	 * @return: boolean
	 */
	boolean saveUser(SysUser sysUser);

	/**
	 * 修改用户
	 *
	 * @author hetao
	 * @date 2022/5/31
	 * @param sysUser
	 * @return: boolean
	 */
	boolean updateUser(SysUser sysUser);

	/**
	 * 用户列表查询
	 *
	 * @author hetao
	 * @date 2022/5/31
	 * @param page
	 * @param sysUser
	 * @return: com.baomidou.mybatisplus.core.metadata.IPage<cn.nitemoon.cloud.upms.common.entity.SysUser>
	 */
	IPage<SysUser> adminPage(Page page, SysUser sysUser);

	/**
	 * 删除用户
	 *
	 * @author hetao
	 * @date 2022/7/19
	 * @param sysUser
	 * @return: boolean
	 */
	boolean delUser(SysUser sysUser);

	int getCount(SysUser sysUser);

}
