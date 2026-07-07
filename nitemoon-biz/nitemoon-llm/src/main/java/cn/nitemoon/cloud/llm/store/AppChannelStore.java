package cn.nitemoon.cloud.llm.store;

import cn.dev33.satoken.stp.StpUtil;
import cn.nitemoon.cloud.llm.constants.AppConst;
import cn.nitemoon.cloud.llm.entity.LlmAppApi;
import cn.nitemoon.cloud.llm.service.LlmAppApiService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * API渠道配置缓存
 *
 * @author hetao
 */
@Slf4j
@Component
@AllArgsConstructor
public class AppChannelStore {

    private final Map<String, LlmAppApi> apiMap = new ConcurrentHashMap<>();
    private final LlmAppApiService appApiService;

    @PostConstruct
    public void init() {
        log.info("加载API渠道配置列表...");
        List<LlmAppApi> apis = appApiService.list();
        apis.stream()
                .filter(api -> api.getApiKey() != null && !api.getApiKey().isBlank())
                .forEach(api -> {
                    apiMap.put(api.getApiKey(), api);
                    log.info("加载API配置: appId={}, apiKey={}", api.getAppId(), maskApiKey(api.getApiKey()));
                });
        log.info("已加载 {} 条API渠道配置", apis.size());
    }

    public LlmAppApi getApiChannel() {
        String token = StpUtil.getTokenValue();
        LlmAppApi api = apiMap.get(token);
        if (api == null) {
            throw new RuntimeException("API Key 未配置或已失效，请检查 AppChannelStore 配置");
        }
        return api;
    }

    public void isExpired(String channel) {
        String token = StpUtil.getTokenValue();
        if (AppConst.CHANNEL_API.equals(channel)) {
            LlmAppApi data = apiMap.get(token);
            if (data == null) {
                throw new RuntimeException("The ApiKey is empty");
            }
        }
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() < 8) {
            return "***";
        }
        return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4);
    }
}
