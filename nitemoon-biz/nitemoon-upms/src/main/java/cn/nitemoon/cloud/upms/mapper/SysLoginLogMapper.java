package cn.nitemoon.cloud.upms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import cn.nitemoon.cloud.upms.api.entity.SysLoginLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 登录日志
 *
 * @author hetao
 * @since 2022/2/26 16:46
 */
@Mapper
public interface SysLoginLogMapper extends BaseMapper<SysLoginLog> {

}
