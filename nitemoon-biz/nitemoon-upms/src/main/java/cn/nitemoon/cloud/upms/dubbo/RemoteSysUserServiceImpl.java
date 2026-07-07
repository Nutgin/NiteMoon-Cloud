package cn.nitemoon.cloud.upms.dubbo;

import cn.hutool.core.util.ObjectUtil;
import cn.nitemoon.cloud.common.myabtis.tenant.TenantContextHolder;
import cn.nitemoon.cloud.upms.api.entity.SysUser;
import cn.nitemoon.cloud.upms.api.remote.RemoteSysUserService;
import cn.nitemoon.cloud.upms.service.ISysUserService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author lijia
 * @description
 * @date 2024/11/22
 */
@Service
@DubboService
@RequiredArgsConstructor
public class RemoteSysUserServiceImpl implements RemoteSysUserService {

	private final ISysUserService sysUserService;

	@Override
	public SysUser getUserInfo(String username) {
		// 首先通过用户名获取用户信息
		SysUser sysUser = sysUserService.findUserByName(username);
		if (ObjectUtil.isNull(sysUser)) {
			return null;
		}
		// 从用户信息中获取租户ID，设置到线程变量中
		TenantContextHolder.setTenantId(sysUser.getTenantId());
		return sysUserService.findUserInfo(sysUser);
	}

	@Override
	public SysUser getUserInfoByPhone(String phone) {
		// 首先通过手机号获取用户信息
		SysUser sysUser = sysUserService.findUserByPhone(phone);
		if (ObjectUtil.isNull(sysUser)) {
			return null;
		}
		// 从用户信息中获取租户ID，设置到线程变量中
		TenantContextHolder.setTenantId(sysUser.getTenantId());
		return sysUserService.findUserInfo(sysUser);
	}

	@Override
	public SysUser getUserInfoByOpenId(String openId) {
		// 首先通过openId获取用户信息
		SysUser sysUser = sysUserService.findUserByOpenId(openId);
		if (ObjectUtil.isNull(sysUser)) {
			return null;
		}
		// 从用户信息中获取租户ID，设置到线程变量中
		TenantContextHolder.setTenantId(sysUser.getTenantId());
		return sysUserService.findUserInfo(sysUser);
	}

	@Override
	public boolean saveWechatUser(SysUser sysUser) {
		// 设置租户ID到线程变量中
		TenantContextHolder.setTenantId(sysUser.getTenantId());
		return sysUserService.saveUser(sysUser);
	}

	@Override
	public List<SysUser> list() {
		return sysUserService.list(new LambdaQueryWrapper<SysUser>()
				.eq(SysUser::getDelFlag,0));
	}

	@Override
	public List<SysUser> listByIds(List<String> userIds) {
		return sysUserService.list(new LambdaQueryWrapper<SysUser>()
				.eq(SysUser::getDelFlag,0)
				.in(SysUser::getId, userIds));
	}
}
