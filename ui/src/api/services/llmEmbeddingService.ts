import apiClient from "../apiClient";

export interface EmbeddingSearchParams {
  content: string;
  knowledgeId: string;
  topK?: number;
  similarityThreshold?: number;
  retrievalMode?: string;
}

export interface EmbeddingSearchResult {
  index: number;
  docsName: string;
  text: string;
  score?: number;
  chunkIndex?: number;
}

export interface EmbeddingTextParams {
  text: string;
  knowledgeId?: string;
}

const EmbeddingApi = {
  Embedding: "/llm/aigc/embedding",
};

/**
 * 向量搜索
 */
export function embeddingSearchApi(data: EmbeddingSearchParams) {
  return apiClient.post<EmbeddingSearchResult[]>({
    url: EmbeddingApi.Embedding + "/search",
    data,
  });
}

/**
 * 增强向量搜索（支持topK、相似度阈值）
 */
export function embeddingAdvancedSearchApi(data: EmbeddingSearchParams) {
  return apiClient.post<EmbeddingSearchResult[]>({
    url: EmbeddingApi.Embedding + "/search/advanced",
    data,
  });
}

/**
 * 文本向量化
 */
export function embeddingTextApi(data: EmbeddingTextParams) {
  return apiClient.post<any>({
    url: EmbeddingApi.Embedding + "/text",
    data,
  });
}

/**
 * 文档向量化上传
 */
export function embeddingDocsApi(
  knowledgeId: string,
  file: File,
  onUploadProgress?: (progressEvent: any) => void
) {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<string>({
    url: `${EmbeddingApi.Embedding}/docs/${knowledgeId}`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
}
