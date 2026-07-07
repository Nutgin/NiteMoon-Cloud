package cn.nitemoon.cloud.common.sentinel.handler;

import cn.hutool.json.JSONUtil;
import com.alibaba.csp.sentinel.adapter.spring.webmvc_v6x.callback.BlockExceptionHandler;

import com.alibaba.csp.sentinel.slots.block.BlockException;
import cn.nitemoon.cloud.common.core.util.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * 自定义限流处理逻辑
 *
 * @author hetao
 */
@Slf4j
@Component
public class NitemoonUrlBlockHandler implements BlockExceptionHandler {

	@Override
	public void handle(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, String s,
			BlockException e) throws Exception {
		log.error("sentinel block exception: {}", s, e);
		httpServletResponse.setContentType("application/json");
		httpServletResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
		httpServletResponse.getWriter().print(JSONUtil.toJsonStr(Result.fail(e.getMessage())));
	}

}
