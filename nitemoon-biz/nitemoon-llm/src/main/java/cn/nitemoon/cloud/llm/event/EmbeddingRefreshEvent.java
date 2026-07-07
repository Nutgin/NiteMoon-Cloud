

package cn.nitemoon.cloud.llm.event;

import org.springframework.context.ApplicationEvent;

/**
 * @author hetao
 * @date 2025/6/16
 */
public class EmbeddingRefreshEvent extends ApplicationEvent {
    private static final long serialVersionUID = 4109980679877560773L;

    public EmbeddingRefreshEvent(Object source) {
        super(source);
    }
}
