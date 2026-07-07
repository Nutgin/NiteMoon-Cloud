import apiClient from "../apiClient";

export interface EmbedStoreInfo {
  id: string;
  name: string;
  provider?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  databaseName?: string;
  tableName?: string;
  dimension?: number;
}

export interface EmbedModelInfo {
  id: string;
  name: string;
  type?: string;
  model?: string;
  provider?: string;
  responseLimit?: number;
  temperature?: number;
  topP?: number;
  dimension?: number;
  baseUrl?: string;
}

export interface Knowledge {
  id?: string;
  name: string;
  des: string;
  embedStoreId: string;
  embedModelId: string;
  docsNum?: number;
  totalSize?: string | number;
  cover?: string | null;
  embedStore?: EmbedStoreInfo | null;
  embedModel?: EmbedModelInfo | null;
  createTime?: string;
  updateTime?: string;
  docs?: any[];
  // 分块策略
  chunkStrategy?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  chunkUnit?: string;
  // Embedding配置JSON
  embeddingConfig?: string;
  // 检索策略配置JSON
  retrievalConfig?: string;
}

export interface KnowledgeQueryParams {
  pageNum?: number;
  pageSize?: number;
  name?: string;
}

export interface PageResult<T> {
  rows: T[]; // 改为rows以匹配后端返回格式
  total: number;
}

const KnowledgeApi = {
  Knowledge: "/llm/aigc/knowledge",
};

/**
 * 分页查询知识库列表
 */
export function pageKnowledgeApi(params: KnowledgeQueryParams) {
  return apiClient.get<PageResult<Knowledge>>({
    url: KnowledgeApi.Knowledge + "/page",
    params,
  });
}

/**
 * 获取知识库列表
 */
export function listKnowledgeApi(params?: { name?: string }) {
  return apiClient.get<Knowledge[]>({
    url: KnowledgeApi.Knowledge + "/list",
    params,
  });
}

/**
 * 新增知识库
 */
export function addKnowledgeApi(data: Knowledge) {
  return apiClient.post<Knowledge>({
    url: KnowledgeApi.Knowledge,
    data,
  });
}

/**
 * 修改知识库
 */
export function updateKnowledgeApi(data: Knowledge) {
  return apiClient.put<Knowledge>({
    url: KnowledgeApi.Knowledge,
    data,
  });
}

/**
 * 删除知识库
 */
export function deleteKnowledgeApi(knowledgeId: string) {
  return apiClient.delete<void>({
    url: KnowledgeApi.Knowledge + `/${knowledgeId}`,
  });
}

/**
 * 获取知识库详情
 */
export function getKnowledgeApi(knowledgeId: string) {
  return apiClient.get<Knowledge>({
    url: KnowledgeApi.Knowledge + `/${knowledgeId}`,
  });
}
