package cn.nitemoon.cloud.upms.service;

import com.baomidou.mybatisplus.extension.service.IService;
import cn.nitemoon.cloud.upms.api.dto.SysTenantMenuDTO;
import cn.nitemoon.cloud.upms.api.entity.SysTenantMenu;

/**
 * 租户分配菜单
 *
 * @author hetao
 * @since 2022/2/26 16:47
 */
public interface ISysTenantMenuService extends IService<SysTenantMenu> {

	boolean saveTenantMenu(SysTenantMenuDTO sysTenantMenuDTO);

}
