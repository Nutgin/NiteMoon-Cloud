package cn.nitemoon.cloud.upms.mapper;

import com.baomidou.mybatisplus.annotation.InterceptorIgnore;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import cn.nitemoon.cloud.upms.api.entity.SysMenu;
import cn.nitemoon.cloud.upms.api.vo.MenuVO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 菜单
 *
 * @author hetao
 * @since 2022/2/26 16:46
 */
@Mapper
public interface SysMenuMapper extends BaseMapper<SysMenu> {

	/**
	 * 通过角色主键查询菜单
	 *
	 * @author hetao
	 * @date 2022/7/18
	 * @param roleId
	 * @return: java.util.List<cn.nitemoon.cloud.upms.common.vo.MenuVO>
	 */
	List<MenuVO> listMenuByRoleId(String roleId);

	/**
	 * 查询租户菜单树
	 * @param tenantId
	 * @return
	 */
	@InterceptorIgnore(tenantLine = "true")
	List<SysMenu> selectTenantMenuTree(String tenantId);

}
