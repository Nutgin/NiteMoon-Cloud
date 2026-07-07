package cn.nitemoon.cloud.upms.service;

import com.baomidou.mybatisplus.extension.service.IService;
import cn.nitemoon.cloud.upms.api.dto.SysRoleMenuDTO;
import cn.nitemoon.cloud.upms.api.entity.SysRoleMenu;

/**
 * 角色关联菜单
 *
 * @author hetao
 * @since 2022/2/26 16:47
 */
public interface ISysRoleMenuService extends IService<SysRoleMenu> {

	boolean saveRoleMenu(SysRoleMenuDTO request);

}
