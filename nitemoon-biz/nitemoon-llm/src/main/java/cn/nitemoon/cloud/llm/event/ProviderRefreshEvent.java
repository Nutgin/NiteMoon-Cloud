

package cn.nitemoon.cloud.llm.event;

import org.springframework.context.ApplicationEvent;

/**
 * @author hetao
 * @date 2025/6/16
 */
public class ProviderRefreshEvent extends ApplicationEvent {
    private static final long serialVersionUID = 4109980679877560773L;

    public ProviderRefreshEvent(Object source) {
        super(source);
    }
}
