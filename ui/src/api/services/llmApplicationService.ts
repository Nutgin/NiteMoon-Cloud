import apiClient from "../apiClient";

// 应用接口类型定义
export interface LlmApplication {
	id?: string;
	name: string;
	des?: string;
	cover?: string;
	workflowUuid?: string;
	enableMemory?: boolean;
	enableWebPage?: boolean;
	webPageKey?: string;
	memoryWindowSize?: number;
	createTime?: string;
	updateTime?: string;
	saveTime?: string;
}

export interface AppQueryParams {
	pageNum?: number;
	pageSize?: number;
	name?: string;
}

export interface PageResult<T> {
	rows?: T[];
	records?: T[];
	total: number;
	size?: number;
	current?: number;
	pages?: number;
}

export interface AppApiChannel {
	id?: string;
	appId: string;
	apiKey?: string;
	apiSecret?: string;
	channel: string;
	channelType?: "API" | "WEB";
	createTime?: string;
	updateTime?: string;
	app?: any;
}

const LlmApplicationApi = {
	Application: "/llm/aigc/app",
	Chat: "/llm/aigc/chat",
	Workflow: "/llm/aigc/workflow",
};

// ============ 应用管理接口 ============

/**
 * 获取应用列表
 */
export function getApplicationListApi(params?: AppQueryParams) {
	return apiClient.get<LlmApplication[]>({
		url: `${LlmApplicationApi.Application}/list`,
		params,
	});
}

/**
 * 分页查询应用列表
 */
export function getApplicationPageApi(params: AppQueryParams) {
	return apiClient.get<PageResult<LlmApplication>>({
		url: `${LlmApplicationApi.Application}/page`,
		params,
	});
}

/**
 * 根据ID获取应用详情
 */
export function getApplicationByIdApi(id: string) {
	return apiClient.get<LlmApplication>({
		url: `${LlmApplicationApi.Application}/${id}`,
	});
}

/**
 * 根据模型ID获取应用
 */
export function getApplicationByModelIdApi(modelId: string) {
	return apiClient.get<LlmApplication>({
		url: `${LlmApplicationApi.Application}/byModelId/${modelId}`,
	});
}

/**
 * 创建应用
 */
export function createApplicationApi(data: LlmApplication) {
	return apiClient.post<LlmApplication>({
		url: LlmApplicationApi.Application,
		data,
	});
}

/**
 * 更新应用
 */
export function updateApplicationApi(data: LlmApplication) {
	return apiClient.put<LlmApplication>({
		url: LlmApplicationApi.Application,
		data,
	});
}

/**
 * 删除应用
 */
export function deleteApplicationApi(id: string) {
	return apiClient.delete<void>({
		url: `${LlmApplicationApi.Application}/${id}`,
	});
}

/**
 * 切换应用Web页面状态
 */
export function toggleWebPageApi(id: string): Promise<string | null> {
	return apiClient.put({
		url: `${LlmApplicationApi.Application}/webpage/toggle/${id}`,
	});
}

/**
 * 获取公开应用信息（无需认证）
 */
export function getPublicAppInfoApi(appId: string): Promise<LlmApplication> {
	return apiClient.get({
		url: `/llm/aigc/app/public/info`,
		params: { appId },
	});
}

/**
 * 获取应用信息（用于聊天）
 */
export function getAppInfoApi(params: { appId: string; conversationId?: string | null; _t?: string }) {
	return apiClient.get<any>({
		url: `${LlmApplicationApi.Application}/info`,
		params,
	});
}

// ============ API渠道管理接口 ============

/**
 * 获取应用API渠道配置
 */
export function getAppApiChannelApi(appId: string) {
	return apiClient.get<AppApiChannel>({
		url: `${LlmApplicationApi.Application}/channel/api/${appId}`,
	});
}

/**
 * 保存应用API渠道配置
 */
export function saveAppApiChannelApi(data: AppApiChannel) {
	return apiClient.post<AppApiChannel>({
		url: `${LlmApplicationApi.Application}/channel/api`,
		data,
	});
}

/**
 * 更新应用API渠道配置
 */
export function updateAppApiChannelApi(data: AppApiChannel) {
	return apiClient.put<AppApiChannel>({
		url: `${LlmApplicationApi.Application}/channel/api`,
		data,
	});
}

/**
 * 删除应用API渠道配置
 */
export function deleteAppApiChannelApi(id: string) {
	return apiClient.delete<void>({
		url: `${LlmApplicationApi.Application}/api/${id}`,
	});
}

/**
 * 创建应用API
 */
export function createAppApiApi(appId: string, channel: string) {
	return apiClient.post<AppApiChannel>({
		url: `${LlmApplicationApi.Application}/api`,
		data: { appId, channel },
	});
}

/**
 * 获取应用API列表
 */
export function listAppApiApi(params: { appId: string; channel: string }) {
	return apiClient.get<AppApiChannel[]>({
		url: `${LlmApplicationApi.Application}/api/list`,
		params,
	});
}

// ============ 工作流接口 ============

export interface LlmWorkflowNode {
	id?: number;
	uuid: string;
	workflowId?: number;
	nodeType: string;
	title: string;
	remark?: string;
	inputConfig?: Record<string, any>;
	nodeConfig?: Record<string, any>;
	positionX?: number;
	positionY?: number;
}

export interface LlmWorkflowEdge {
	id?: number;
	uuid: string;
	workflowId?: number;
	sourceNodeUuid: string;
	sourceHandle?: string;
	targetNodeUuid: string;
}

export interface LlmWorkflowResp {
	id?: number;
	uuid: string;
	appId?: string;
	title: string;
	remark?: string;
	nodes: LlmWorkflowNode[];
	edges: LlmWorkflowEdge[];
	createTime?: string;
	updateTime?: string;
}

/**
 * 根据应用ID获取工作流画布
 */
export function getLlmWorkflowDetailApi(appId: string) {
	return apiClient.get<LlmWorkflowResp>({
		url: `${LlmApplicationApi.Workflow}/detail/${appId}`,
	});
}

/**
 * 保存工作流画布
 */
export function updateLlmWorkflowApi(data: {
	uuid: string;
	nodes: LlmWorkflowNode[];
	edges: LlmWorkflowEdge[];
	deleteNodes?: string[];
	deleteEdges?: string[];
}) {
	return apiClient.post<LlmWorkflowResp>({
		url: `${LlmApplicationApi.Workflow}/update`,
		data,
	});
}

/**
 * 为应用创建工作流
 */
export function createLlmWorkflowApi(appId: string) {
	return apiClient.post<any>({
		url: `${LlmApplicationApi.Workflow}/create/${appId}`,
	});
}
