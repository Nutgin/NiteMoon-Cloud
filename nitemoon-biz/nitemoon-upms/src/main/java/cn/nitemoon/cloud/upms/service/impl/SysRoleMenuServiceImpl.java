package cn.nitemoon.cloud.upms.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.nitemoon.cloud.common.core.constant.CacheConstants;
import cn.nitemoon.cloud.common.myabtis.tenant.TenantContextHolder;
import cn.nitemoon.cloud.upms.api.dto.SysRoleMenuDTO;
import cn.nitemoon.cloud.upms.api.entity.SysRoleMenu;
import cn.nitemoon.cloud.upms.mapper.SysRoleMenuMapper;
import cn.nitemoon.cloud.upms.service.ISysRoleMenuService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 角色关联菜单
 *
 * @author hetao
 * @since 2022/2/26 16:47
 */
@Service
public class SysRoleMenuServiceImpl extends ServiceImpl<SysRoleMenuMapper, SysRoleMenu> implements ISysRoleMenuService {

	@Override
	@Transactional(rollbackFor = Exception.class)
	@CacheEvict(value = CacheConstants.MENU_CACHE, allEntries = true)
	public boolean saveRoleMenu(SysRoleMenuDTO request) {
		String tenantId = TenantContextHolder.getTenantId();
		LocalDateTime now = LocalDateTime.now();
		super.remove(Wrappers.<SysRoleMenu>lambdaQuery().eq(SysRoleMenu::getRoleId, request.getRoleId()));
		List<String> menuIds = request.getMenuIds();
		List<SysRoleMenu> sysRoleMenus = menuIds.stream().map(menuId -> {
			SysRoleMenu roleMenu = new SysRoleMenu();
			roleMenu.setRoleId(request.getRoleId());
			roleMenu.setMenuId(menuId);
			roleMenu.setId(IdUtil.getSnowflakeNextIdStr());
			roleMenu.setTenantId(tenantId);
			roleMenu.setCreateTime(now);
			return roleMenu;
		}).collect(Collectors.toList());

		// 每批1000条
		int batchSize = 1000;
		for (int i = 0; i < sysRoleMenus.size(); i += batchSize) {
			int end = Math.min(i + batchSize, sysRoleMenus.size());
			List<SysRoleMenu> batchList = sysRoleMenus.subList(i, end);
			baseMapper.saveBatch(batchList);
		}
		return Boolean.TRUE;
	}

}
