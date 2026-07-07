package cn.nitemoon.cloud.llm.provider;

import cn.nitemoon.cloud.llm.event.EmbeddingRefreshEvent;
import cn.nitemoon.cloud.llm.event.ProviderRefreshEvent;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * @author hetao
 * @date 2025/6/16
 */
@Slf4j
@Component
@AllArgsConstructor
public class ProviderListener {

    private final ModelStoreFactory providerInitialize;
    private final EmbeddingStoreFactory embeddingStoreInitialize;

    @EventListener
    public void providerEvent(ProviderRefreshEvent event) {
        log.info("refresh provider beans begin......");
        providerInitialize.init();
        log.info("refresh provider beans success......");
    }

    @EventListener
    public void providerEvent(EmbeddingRefreshEvent event) {
        log.info("refresh embedding beans begin......");
        embeddingStoreInitialize.init();
        log.info("refresh embedding beans success......");
    }
}
