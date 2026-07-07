package cn.nitemoon.cloud.upms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import cn.nitemoon.cloud.upms.api.entity.SysLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 操作日志
 *
 * @author hetao
 * @since 2022/2/26 16:46
 */
@Mapper
public interface SysLogMapper extends BaseMapper<SysLog> {

}
