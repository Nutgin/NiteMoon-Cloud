import apiClient from "../apiClient";

export interface AigcTool {
	id?: string;
	name: string;
	description?: string;
	toolType: string;
	parametersSchema?: string;
	endpointUrl?: string;
	httpMethod?: string;
	headers?: string;
	createTime?: string;
	updateTime?: string;
}

export interface ToolQueryParams {
	pageNum?: number;
	pageSize?: number;
	name?: string;
}

export interface PageResult<T> {
	records: T[];
	total: number;
	size: number;
	current: number;
	pages: number;
}

const LlmToolApi = {
	Tool: "/llm/aigc/tool",
};

export function getToolListApi(params?: ToolQueryParams) {
	return apiClient.get<AigcTool[]>({
		url: `${LlmToolApi.Tool}/list`,
		params,
	});
}

export function getToolPageApi(params: ToolQueryParams) {
	return apiClient.get<PageResult<AigcTool>>({
		url: `${LlmToolApi.Tool}/page`,
		params,
	});
}

export function getToolByIdApi(id: string) {
	return apiClient.get<AigcTool>({
		url: `${LlmToolApi.Tool}/${id}`,
	});
}

export function createToolApi(data: AigcTool) {
	return apiClient.post({
		url: LlmToolApi.Tool,
		data,
	});
}

export function updateToolApi(data: AigcTool) {
	return apiClient.put({
		url: LlmToolApi.Tool,
		data,
	});
}

export function deleteToolApi(id: string) {
	return apiClient.delete({
		url: `${LlmToolApi.Tool}/${id}`,
	});
}
