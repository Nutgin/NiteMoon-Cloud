package cn.nitemoon.cloud.upms.dubbo;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import cn.nitemoon.cloud.common.core.constant.CommonConstants;
import cn.nitemoon.cloud.upms.api.entity.SysTenant;
import cn.nitemoon.cloud.upms.api.remote.RemoteTenantService;
import cn.nitemoon.cloud.upms.service.ISysTenantService;
import lombok.RequiredArgsConstructor;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author lijia
 * @description
 * @date 2024/11/22
 */
@Service
@DubboService
@RequiredArgsConstructor
public class RemoteTenantServiceImpl implements RemoteTenantService {

	private final ISysTenantService sysTenantService;

	@Override
	public List<SysTenant> list() {
		return sysTenantService
			.list(Wrappers.<SysTenant>lambdaQuery().eq(SysTenant::getStatus, CommonConstants.NORMAL_STATUS));
	}

}
