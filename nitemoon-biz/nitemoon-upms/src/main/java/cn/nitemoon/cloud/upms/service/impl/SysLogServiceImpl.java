package cn.nitemoon.cloud.upms.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.nitemoon.cloud.upms.api.entity.SysLog;
import cn.nitemoon.cloud.upms.mapper.SysLogMapper;
import cn.nitemoon.cloud.upms.service.ISysLogService;
import org.springframework.stereotype.Service;

/**
 * 操作日志
 *
 * @author hetao
 * @since 2022/2/26 16:47
 */
@Service
public class SysLogServiceImpl extends ServiceImpl<SysLogMapper, SysLog> implements ISysLogService {

}
