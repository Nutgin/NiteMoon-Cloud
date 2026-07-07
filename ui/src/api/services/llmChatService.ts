import apiClient from "../apiClient";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { GLOBAL_CONFIG } from "@/global-config";
import userStore from "@/store/userStore";

// 聊天消息接口类型定义
export interface ChatMessage {
	chatId?: string;
	role: 'user' | 'assistant' | 'system';
	message: string;
	createTime?: string;
	isError?: boolean;
	toolCalls?: ToolCallInfo[];
	files?: FileContent[];
}

export interface ToolCallInfo {
	name: string;
	status: 'calling' | 'done';
	result?: string;
}

export interface ChatChunk {
	data: string;
	eventType?: string;
}

// 多模态文件内容
export interface FileContent {
	variableName?: string;
	type: string;       // "image", "audio", "video"
	url: string;
	name: string;
	mimeType?: string;
}

// 聊天请求参数
export interface ChatRequestParams {
	chatId: string;
	conversationId: string | null;
	appId: string | null;
	message: string;
	role: 'user' | 'assistant' | 'system';
	files?: FileContent[];
}

const LlmChatApi = {
	Chat: "/llm/aigc/chat",
};

// ============ 聊天接口 ============

/**
 * 聊天对话（流式响应）
 */
export function chatApi(
	data: ChatRequestParams,
	controller: AbortController,
	onChunk?: (chunk: ChatChunk) => void
) {
	// 构建 URL
	let url = `${GLOBAL_CONFIG.apiBaseUrl}/llm/aigc/chat/completions`;
	
	// 如果不是云部署，替换指定的URL路径前缀
	if (!GLOBAL_CONFIG.isCloud) {
		url = url.replace('/llm/', '/boot/');
	}

	// 获取 token 和 tenant-id
	const { accessToken } = userStore.getState().userToken;
	const { tenantId } = userStore.getState();

	// 构建请求头
	const headers: Record<string, string> = {
		'Content-Type': 'application/json;charset=utf-8',
	};
	if (accessToken) {
		headers['Authorization'] = accessToken;
	}
	if (tenantId) {
		headers['tenant-id'] = tenantId;
	}

	// 使用 fetch API 处理流式响应
	return fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(data),
		signal: controller.signal,
	}).then(async (response) => {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('Response body is not readable');
		}

		const decoder = new TextDecoder();
		let buffer = '';
		let pendingEventType = 'message';
		let pendingData: string | null = null;

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				buffer += chunk;

				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmedLine = line.trim();
					if (!trimmedLine) {
						// Empty line = SSE event boundary — fire pending data
						if (pendingData != null) {
							onChunk?.({ data: pendingData, eventType: pendingEventType });
							pendingData = null;
						}
						pendingEventType = 'message';
						continue;
					}
					if (trimmedLine.startsWith('event:')) {
						pendingEventType = trimmedLine.substring(6).trim() || 'message';
						continue;
					}
					if (trimmedLine.startsWith('data:')) {
						pendingData = (pendingData != null ? pendingData : '') + trimmedLine.substring(5);
					}
				}
			}

			// Flush remaining buffer
			if (pendingData != null) {
				onChunk?.({ data: pendingData, eventType: pendingEventType });
			} else if (buffer.trim()) {
				onChunk?.({ data: buffer.trim(), eventType: pendingEventType });
			}
		} finally {
			reader.releaseLock();
		}
	});
}

/**
 * 清空聊天记录
 */
export function cleanChatApi(conversationId: string | null) {
	return apiClient.delete({
		url: `${LlmChatApi.Chat}/messages/clean/${conversationId}`,
	});
}

/**
 * 获取聊天消息列表
 */
export function getMessagesApi(conversationId?: string, appId?: string) {
	const url = appId
		? `${LlmChatApi.Chat}/messages/${conversationId}?appId=${appId}`
		: `${LlmChatApi.Chat}/messages/${conversationId}`;

	return apiClient.get<ChatMessage[]>({
		url,
	});
}

/**
 * 获取应用信息
 */
export function getAppInfoApi(params: { appId: string; conversationId?: string | null; _t?: string }) {
	return apiClient.get<any>({
		url: `/llm/aigc/app/info`,
		params,
	});
}

/**
 * 获取应用开场白
 */
export function getAppPrologueApi(appId: string): Promise<string> {
	return apiClient.get({
		url: `/llm/aigc/app/prologue`,
		params: { appId },
	});
}

/**
 * 获取图片模型列表
 */
export function getImageModelsApi() {
	return apiClient.get({
		url: `${LlmChatApi.Chat}/getImageModels`,
	});
}

/**
 * 生成图片
 */
export function genImageApi(data: any) {
	return apiClient.post({
		url: `${LlmChatApi.Chat}/image`,
		data,
	});
}

/**
 * 生成思维导图
 */
export function genMindMapApi(data: any) {
	return apiClient.post({
		url: `${LlmChatApi.Chat}/mindmap`,
		data,
	});
}
