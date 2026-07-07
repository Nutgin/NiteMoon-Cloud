import apiClient from "../apiClient";

export enum ProviderEnum {
  REDIS = 'REDIS',
  PGVECTOR = 'PGVECTOR',
  MILVUS = 'MILVUS'
}

export interface EmbedStore {
  id?: string;
  name: string;
  provider: ProviderEnum;
  host: string;
  port: number;
  username?: string;
  password?: string;
  databaseName?: string;
  tableName?: string;
  dimension: number;
  updateTime?: string;
}

export interface EmbedStoreQueryParams {
  page?: number;
  limit?: number;
  name?: string;
  provider?: ProviderEnum;
}

export interface PageResult<T> {
  rows: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

const EmbedStoreApi = {
  EmbedStore: "/llm/aigc/embed-store",
};

/**
 * 分页查询向量数据库列表
 */
export function pageEmbedStoreApi(params: EmbedStoreQueryParams) {
  return apiClient.get<PageResult<EmbedStore>>({
    url: EmbedStoreApi.EmbedStore + "/page",
    params,
  });
}

/**
 * 获取向量数据库列表
 */
export function listEmbedStoreApi(params?: Partial<EmbedStoreQueryParams>) {
  return apiClient.get<EmbedStore[]>({
    url: EmbedStoreApi.EmbedStore + "/list",
    params,
  });
}

/**
 * 新增向量数据库
 */
export function addEmbedStoreApi(data: EmbedStore) {
  return apiClient.post<EmbedStore>({
    url: EmbedStoreApi.EmbedStore,
    data,
  });
}

/**
 * 修改向量数据库
 */
export function updateEmbedStoreApi(data: EmbedStore) {
  return apiClient.put<EmbedStore>({
    url: EmbedStoreApi.EmbedStore,
    data,
  });
}

/**
 * 删除向量数据库
 */
export function deleteEmbedStoreApi(id: string) {
  return apiClient.delete<void>({
    url: EmbedStoreApi.EmbedStore + `/${id}`,
  });
}

/**
 * 获取向量数据库详情
 */
export function getEmbedStoreApi(id: string) {
  return apiClient.get<EmbedStore>({
    url: EmbedStoreApi.EmbedStore + `/${id}`,
  });
}
