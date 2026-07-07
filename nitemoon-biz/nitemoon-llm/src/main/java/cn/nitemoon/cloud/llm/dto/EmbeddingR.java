package cn.nitemoon.cloud.llm.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * @author hetao
 * @date 2025/05/26
 */
@Data
@Accessors(chain = true)
@Schema(description = "向量嵌入响应对象")
public class EmbeddingR {

    /**
     * 写入到vector store的ID
     */
    @Schema(description= "向量ID")
    private String vectorId;

    /**
     * 文档ID
     */
    @Schema(description= "文档ID")
    private String docsId;

    /**
     * 知识库ID
     */
    @Schema(description= "知识库ID")
    private String knowledgeId;

    /**
     * Embedding后切片的文本
     */
    @Schema(description= "切片文本")
    private String text;
}
