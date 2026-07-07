package cn.nitemoon.cloud.llm.api.remote;

import cn.nitemoon.cloud.llm.api.dto.LlmDocsDTO;
import cn.nitemoon.cloud.llm.api.dto.LlmDocsSliceDTO;
import cn.nitemoon.cloud.llm.api.dto.LlmModelDTO;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * LLM远程服务接口
 * 供其他模块（如nitemoon-kg）调用的抽象接口
 *
 * @author hetao
 */
public interface RemoteLlmService {

    /**
     * 获取所有聊天模型
     */
    List<LlmModelDTO> getChatModels();

    /**
     * 根据模型名称查询模型（按显示名称查询，API Key会被遮掩）
     */
    LlmModelDTO getModelByName(String modelName);

    /**
     * 根据模型标识查询模型（按model字段查询，返回真实API Key，仅供内部调用）
     */
    LlmModelDTO getModelByModelName(String modelName);

    /**
     * 获取默认聊天模型（返回真实API Key，仅供内部调用）
     */
    LlmModelDTO getDefaultChatModel();

    /**
     * 根据ID查询模型（返回真实API Key，仅供内部调用）
     */
    LlmModelDTO getModelById(String id);

    /**
     * 根据文档ID查询文档切片列表
     */
    List<LlmDocsSliceDTO> listSlicesByDocsId(String docsId);

    /**
     * 根据知识库ID查询所有文档切片列表
     */
    List<LlmDocsSliceDTO> listSlicesByKnowledgeId(String knowledgeId);

    /**
     * 根据知识库ID查询指定时间之前的文档切片列表（增量构建用）
     *
     * @param knowledgeId 知识库ID
     * @param beforeTime  截止时间，只返回该时间之前创建的切片
     * @return 切片列表
     */
    List<LlmDocsSliceDTO> listSlicesByKnowledgeIdBeforeTime(String knowledgeId, Date beforeTime);

    /**
     * 根据ID查询文档
     */
    LlmDocsDTO getDocsById(String docsId);

    /**
     * 向量语义检索
     * @param knowledgeId 知识库ID
     * @param content 查询内容
     * @param maxResults 最大返回结果数
     * @return 检索结果列表，每个Map包含text(文本内容)和score(相似度分数)
     */
    List<Map<String, Object>> searchEmbeddings(String knowledgeId, String content, int maxResults);
}
