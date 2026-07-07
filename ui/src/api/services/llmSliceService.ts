import apiClient from "../apiClient";

export interface Slice {
  id?: string;
  vectorId?: string;
  docsId?: string;
  knowledgeId?: string;
  name?: string; // 文档名称
  content?: string; // 切片内容
  wordNum?: number; // 字符数
  status?: boolean; // 切片状态
  createTime?: string;
}

export interface SliceQueryParams {
  pageNum?: number;
  pageSize?: number;
  knowledgeId?: string;
  docsId?: string;
  content?: string;
}

export interface PageResult<T> {
  rows: T[];
  total: number;
}

const SliceApi = {
  Slice: "/llm/aigc/docs/slice",
};

/**
 * 分页查询切片列表
 */
export function pageSlicesApi(params: SliceQueryParams) {
  return apiClient.get<PageResult<Slice>>({
    url: SliceApi.Slice + "/page",
    params,
  });
}

/**
 * 获取切片列表
 */
export function listSlicesApi(params?: { knowledgeId?: string; docsId?: string }) {
  return apiClient.get<Slice[]>({
    url: SliceApi.Slice + "/list",
    params,
  });
}

/**
 * 获取切片详情
 */
export function getSliceApi(sliceId: string) {
  return apiClient.get<Slice>({
    url: SliceApi.Slice + `/${sliceId}`,
  });
}

/**
 * 新增切片
 */
export function addSliceApi(data: Slice) {
  return apiClient.post<Slice>({
    url: SliceApi.Slice,
    data,
  });
}

/**
 * 修改切片
 */
export function updateSliceApi(data: Slice) {
  return apiClient.put<Slice>({
    url: SliceApi.Slice,
    data,
  });
}

/**
 * 删除切片
 */
export function deleteSliceApi(sliceId: string) {
  return apiClient.delete<void>({
    url: SliceApi.Slice + `/${sliceId}`,
  });
}
