package cn.nitemoon.cloud.upms.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.nitemoon.cloud.upms.api.entity.SysTenantPackage;
import cn.nitemoon.cloud.upms.mapper.SysTenantPackageMapper;
import cn.nitemoon.cloud.upms.service.ISysTenantPackageService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 租户套餐
 *
 * @author hetao
 * @since 2022/2/26 16:51
 */
@Service
@AllArgsConstructor
public class SysTenantPackageServiceImpl extends ServiceImpl<SysTenantPackageMapper, SysTenantPackage>
		implements ISysTenantPackageService {

}
