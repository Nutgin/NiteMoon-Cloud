package cn.nitemoon.cloud.llm.enums;

import lombok.Getter;

/**
 * @author hetao
 * @date 2025/10/28
 */
@Getter
public enum EmbedStoreEnum {

    REDIS,
    PGVECTOR,
    MILVUS,
    ;
}
