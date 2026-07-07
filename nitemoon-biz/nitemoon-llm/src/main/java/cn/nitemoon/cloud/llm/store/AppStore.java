package cn.nitemoon.cloud.llm.store;

import cn.nitemoon.cloud.llm.entity.LlmApp;
import cn.nitemoon.cloud.llm.service.LlmAppService;
import javax.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 应用配置缓存
 *
 * @author hetao
 */
@Slf4j
@Component
@AllArgsConstructor
public class AppStore {

    private final Map<String, LlmApp> appMap = new ConcurrentHashMap<>();
    private final LlmAppService appService;

    @PostConstruct
    public void init() {
        log.info("加载应用配置列表...");
        List<LlmApp> list = appService.list();
        list.stream()
                .filter(i -> i.getId() != null)
                .forEach(i -> appMap.put(i.getId(), i));
        log.info("已加载 {} 条应用配置", list.size());
    }

    public LlmApp get(String appId) {
        LlmApp app = appMap.get(appId);
        if (app == null) {
            throw new RuntimeException("应用配置不存在，appId: " + appId + "，请检查 AppStore 配置");
        }
        return app;
    }
}
