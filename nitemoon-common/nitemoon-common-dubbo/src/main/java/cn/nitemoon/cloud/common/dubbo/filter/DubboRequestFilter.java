package cn.nitemoon.cloud.common.dubbo.filter;

import cn.nitemoon.cloud.common.myabtis.tenant.TenantContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.apache.dubbo.common.constants.CommonConstants;
import org.apache.dubbo.common.extension.Activate;
import org.apache.dubbo.rpc.*;

/**
 * Sa-Token 整合 Dubbo过滤器
 */
@Slf4j
@Activate(group = { CommonConstants.PROVIDER, CommonConstants.CONSUMER }, order = Integer.MAX_VALUE)
public class DubboRequestFilter implements Filter {

	@Override
	public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
		// 判断是消费者 还是 服务提供者
		if (RpcContext.getServiceContext().isConsumerSide()) {
			// 传递租户ID
			invocation.setAttachment("tenantId", TenantContextHolder.getTenantId());
		}
		else {
			TenantContextHolder.setTenantId(invocation.getAttachment("tenantId"));
		}
		return invoker.invoke(invocation);
	}

}
