package cn.nitemoon.cloud.upms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import cn.nitemoon.cloud.upms.api.entity.SysUserRole;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户关联角色
 *
 * @author hetao
 * @since 2022/2/26 16:50
 */
@Mapper
public interface SysUserRoleMapper extends BaseMapper<SysUserRole> {

}
