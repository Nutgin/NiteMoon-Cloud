package cn.nitemoon.cloud.upms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import cn.nitemoon.cloud.upms.api.entity.SysRoleMenu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 角色管理菜单
 *
 * @author hetao
 * @since 2022/2/26 16:50
 */
@Mapper
public interface SysRoleMenuMapper extends BaseMapper<SysRoleMenu> {

	void saveBatch(@Param("list") List<SysRoleMenu> sysRoleMenus);

}
