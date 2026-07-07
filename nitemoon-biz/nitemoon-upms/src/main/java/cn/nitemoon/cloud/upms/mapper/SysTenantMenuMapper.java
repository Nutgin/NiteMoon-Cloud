package cn.nitemoon.cloud.upms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import cn.nitemoon.cloud.upms.api.entity.SysTenantMenu;
import org.apache.ibatis.annotations.Mapper;

/**
 * 租户分配菜单
 *
 * @author hetao
 * @since 2022/2/26 16:49
 */
@Mapper
public interface SysTenantMenuMapper extends BaseMapper<SysTenantMenu> {

}
