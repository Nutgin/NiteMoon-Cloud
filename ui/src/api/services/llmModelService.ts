import apiClient from "../apiClient";

export enum ModelTypeEnum {
  CHAT = 'CHAT',
  EMBEDDING = 'EMBEDDING',
  IMAGE = 'IMAGE'
}

export enum ProviderEnum {
  OPENAI = 'OPENAI',
  AZURE_OPENAI = 'AZURE_OPENAI',
  GEMINI = 'GEMINI',
  OLLAMA = 'OLLAMA',
  CLAUDE = 'CLAUDE',
  Q_FAN = 'Q_FAN',
  Q_WEN = 'Q_WEN',
  ZHIPU = 'ZHIPU',
  GITEEAI = 'GITEEAI',
  DEEPSEEK = 'DEEPSEEK',
  DOUYIN = 'DOUYIN',
  SILICON = 'SILICON',
  YI = 'YI',
  SPARK = 'SPARK',
  MIMO = 'MIMO',
}

export interface LLMModel {
  id?: string;
  name: string;
  model: string;
  provider: string;
  type: ModelTypeEnum;
  apiKey?: string;
  secretKey?: string; // 百度千帆专用
  baseUrl?: string;
  // Chat 模型字段
  responseLimit?: number;
  temperature?: number;
  topP?: number;
  // Embedding 模型字段
  dimension?: number; // 向量维度
  // Image 模型字段
  imageSize?: string; // 图片大小
  imageQuality?: string; // 图片质量
  imageStyle?: string; // 图片风格
  // MIMO 多模态字段
  fps?: number; // 视频抽帧率，范围 0.1-10，默认 2
  mediaResolution?: string; // 媒体分辨率档次：default 或 max
  // Provider 专用字段
  endpoint?: string; // Azure OpenAI 专用
  azureDeploymentName?: string; // Azure OpenAI 专用
  geminiLocation?: string; // Gemini 专用
  geminiProject?: string; // Gemini 专用
  updateTime?: string;
}

export interface ModelQueryParams {
  pageNum?: number;
  pageSize?: number;
  provider?: string;
  type?: ModelTypeEnum;
  name?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

const LLMModelApi = {
  Model: "/llm/aigc/model",
};

/**
 * 分页查询模型列表
 */
export function pageModelsApi(params: ModelQueryParams) {
  return apiClient.post<PageResult<LLMModel>>({
    url: LLMModelApi.Model + "/page",
    data: params,
  });
}

/**
 * 获取模型列表
 */
export function listModelsApi(params: { provider?: string; type?: ModelTypeEnum }) {
  return apiClient.get<LLMModel[]>({
    url: LLMModelApi.Model + "/list",
    params,
  });
}

/**
 * 新增模型
 */
export function addModelApi(data: LLMModel) {
  return apiClient.post<LLMModel>({
    url: LLMModelApi.Model,
    data,
  });
}

/**
 * 修改模型
 */
export function updateModelApi(data: LLMModel) {
  return apiClient.put<LLMModel>({
    url: LLMModelApi.Model,
    data,
  });
}

/**
 * 删除模型
 */
export function deleteModelApi(modelId: string) {
  return apiClient.delete<void>({
    url: LLMModelApi.Model + `/${modelId}`,
  });
}

/**
 * 获取模型详情
 */
export function getModelApi(modelId: string) {
  return apiClient.get<LLMModel>({
    url: LLMModelApi.Model + `/${modelId}`,
  });
}

/**
 * 测试模型连接
 */
export function testModelApi(modelId: string) {
  return apiClient.post<any>({
    url: LLMModelApi.Model + `/test/${modelId}`,
  });
}

