import apiClient from "../apiClient";

export interface Document {
  id?: string;
  knowledgeId?: string;
  name?: string;
  type?: string; // 文档来源类型
  url?: string; // 文档链接
  size?: number; // 文件大小（字节）
  sliceNum?: number; // 切片数量
  sliceStatus?: boolean; // 切片状态
  createTime?: string;
}

export interface DocumentQueryParams {
  pageNum?: number;
  pageSize?: number;
  knowledgeId?: string;
  name?: string;
}

export interface PageResult<T> {
  rows: T[];
  total: number;
}

const DocumentApi = {
  Document: "/llm/aigc/docs",
};

/**
 * 分页查询文档列表
 */
export function pageDocumentsApi(params: DocumentQueryParams) {
  return apiClient.get<PageResult<Document>>({
    url: DocumentApi.Document + "/page",
    params,
  });
}

/**
 * 获取文档列表
 */
export function listDocumentsApi(params?: { knowledgeId?: string; name?: string }) {
  return apiClient.get<Document[]>({
    url: DocumentApi.Document + "/list",
    params,
  });
}

/**
 * 获取文档详情
 */
export function getDocumentApi(documentId: string) {
  return apiClient.get<Document>({
    url: DocumentApi.Document + `/${documentId}`,
  });
}

/**
 * 新增文档
 */
export function addDocumentApi(data: Document) {
  return apiClient.post<Document>({
    url: DocumentApi.Document,
    data,
  });
}

/**
 * 修改文档
 */
export function updateDocumentApi(data: Document) {
  return apiClient.put<Document>({
    url: DocumentApi.Document,
    data,
  });
}

/**
 * 删除文档
 */
export function deleteDocumentApi(documentId: string) {
  return apiClient.delete<void>({
    url: DocumentApi.Document + `/${documentId}`,
  });
}

/**
 * 重新向量化文档
 */
export function reEmbedDocumentApi(documentId: string) {
  return apiClient.get<string>({
    url: `/llm/aigc/embedding/re-embed/${documentId}`,
  });
}
