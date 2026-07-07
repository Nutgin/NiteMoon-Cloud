package cn.nitemoon.cloud.upms.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.nitemoon.cloud.upms.api.dto.SysTenantMenuDTO;
import cn.nitemoon.cloud.upms.api.entity.SysTenantMenu;
import cn.nitemoon.cloud.upms.mapper.SysTenantMenuMapper;
import cn.nitemoon.cloud.upms.service.ISysTenantMenuService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 租户分配菜单
 *
 * @author hetao
 * @since 2022/2/26 16:51
 */
@Service
public class SysTenantMenuServiceImpl extends ServiceImpl<SysTenantMenuMapper, SysTenantMenu>
		implements ISysTenantMenuService {

	@Override
	@Transactional(rollbackFor = Exception.class)
	public boolean saveTenantMenu(SysTenantMenuDTO sysTenantMenuDTO) {
		this.remove(Wrappers.query());
		List<SysTenantMenu> sysTenantMenuList = sysTenantMenuDTO.getMenuIds().stream().map(v -> {
			SysTenantMenu sysTenantMenu = new SysTenantMenu();
			sysTenantMenu.setMenuId(v);
			return sysTenantMenu;
		}).collect(Collectors.toList());
		return this.saveBatch(sysTenantMenuList);
	}

}
