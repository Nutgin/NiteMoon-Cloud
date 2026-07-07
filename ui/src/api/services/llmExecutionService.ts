import apiClient from "../apiClient";

export interface LlmExecution {
  id: string;
  appId: string;
  conversationId?: string;
  userId?: string;
  userName?: string;
  requestMessage?: string;
  responseMessage?: string;
  status: "running" | "success" | "failed";
  errorMessage?: string;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalDuration?: number;
  executionPath?: string;
  triggerType: "chat" | "api";
  createTime?: string;
  updateTime?: string;
}

export interface LlmExecutionNode {
  id: string;
  executionId: string;
  nodeUuid: string;
  nodeType: string;
  nodeTitle?: string;
  inputParams?: string;
  outputParams?: string;
  outputText?: string;
  logs?: string;
  status: "running" | "success" | "failed";
  errorMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  duration?: number;
  sortOrder: number;
  createTime?: string;
}

export interface ExecutionQueryParams {
  pageNum?: number;
  pageSize?: number;
  appId?: string;
  status?: string;
  triggerType?: string;
}

export interface ExecutionDetail {
  execution: LlmExecution;
  nodes: LlmExecutionNode[];
}

export interface PageResult<T> {
  rows?: T[];
  records?: T[];
  total: number;
}

const ExecutionApi = {
  Base: "/llm/aigc/execution",
};

export function getExecutionPageApi(params: ExecutionQueryParams) {
  return apiClient.get<PageResult<LlmExecution>>({
    url: `${ExecutionApi.Base}/page`,
    params,
  });
}

export function getExecutionDetailApi(id: string) {
  return apiClient.get<ExecutionDetail>({
    url: `${ExecutionApi.Base}/${id}`,
  });
}

export function deleteExecutionApi(id: string) {
  return apiClient.delete<void>({
    url: `${ExecutionApi.Base}/${id}`,
  });
}
