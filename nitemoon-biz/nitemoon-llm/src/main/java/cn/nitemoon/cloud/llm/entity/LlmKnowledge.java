

package cn.nitemoon.cloud.llm.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * @author hetao
 * @date 2025/05/15
 */
@Data
@TableName(autoResultMap = true)
public class LlmKnowledge implements Serializable {
    private static final long serialVersionUID = 548724967827903685L;

    /**
     * 主键
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String embedStoreId;
    private String embedModelId;

    /**
     * 知识库名称
     */
    private String name;

    /**
     * 封面
     */
    private String cover;

    /**
     * 描述
     */
    private String des;

    /**
     * 分块策略: RECURSIVE/FIXED_SIZE
     */
    private String chunkStrategy;

    /**
     * 分块粒度
     */
    private Integer chunkSize;

    /**
     * 重叠长度
     */
    private Integer chunkOverlap;

    /**
     * 分块单位: TOKEN/CHAR
     */
    private String chunkUnit;

    /**
     * Embedding模型参数配置JSON
     */
    private String embeddingConfig;

    /**
     * 检索策略配置JSON
     */
    private String retrievalConfig;

    /**
     * 创建时间
     */
    private String createTime;

    @TableField(exist = false)
    private Integer docsNum = 0;
    @TableField(exist = false)
    private Long totalSize = 0L;
    @TableField(exist = false)
    private List<LlmDocs> docs = new ArrayList<>();

    @TableField(exist = false)
    private LlmEmbedStore embedStore;
    @TableField(exist = false)
    private LlmModel embedModel;
}

