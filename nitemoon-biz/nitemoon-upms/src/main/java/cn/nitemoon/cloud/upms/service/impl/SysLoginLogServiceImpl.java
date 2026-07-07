package cn.nitemoon.cloud.upms.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.nitemoon.cloud.upms.api.entity.SysLoginLog;
import cn.nitemoon.cloud.upms.mapper.SysLoginLogMapper;
import cn.nitemoon.cloud.upms.service.ISysLoginLogService;
import org.springframework.stereotype.Service;

/**
 * 登录日志
 *
 * @author hetao
 * @since 2022/2/26 16:47
 */
@Service
public class SysLoginLogServiceImpl extends ServiceImpl<SysLoginLogMapper, SysLoginLog> implements ISysLoginLogService {

}
