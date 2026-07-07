import apiClient from "../apiClient";
import type { Result } from "#/api";

export interface LlmMessage {
	id?: string;
	username?: string;
	ip?: string;
	role?: string;
	appId?: string;
	modelName?: string;
	promptTokens?: number;
	completionTokens?: number;
	message?: string;
	createTime?: string;
}

export interface MessageQueryParams {
	pageNum?: number;
	pageSize?: number;
	text?: string;
	username?: string;
	role?: string;
}

export interface MessagePageResult {
	rows: LlmMessage[];
	total: number;
}

export const llmMessageService = {
	/**
	 * 分页查询消息列表
	 */
	queryPage: (params: MessageQueryParams): Promise<MessagePageResult> => {
		return apiClient.get({
			url: "/llm/aigc/message/page",
			params,
		});
	},

	/**
	 * 查询消息列表
	 */
	queryList: (params: MessageQueryParams): Promise<LlmMessage[]> => {
		return apiClient.get({
			url: "/llm/aigc/message/list",
			params,
		});
	},

	/**
	 * 新增消息
	 */
	add: (data: LlmMessage): Promise<void> => {
		return apiClient.post({
			url: "/llm/aigc/message",
			data,
		});
	},

	/**
	 * 修改消息
	 */
	update: (data: LlmMessage): Promise<void> => {
		return apiClient.put({
			url: "/llm/aigc/message",
			data,
		});
	},

	/**
	 * 删除消息
	 */
	delete: (id: string): Promise<void> => {
		return apiClient.delete({
			url: `/llm/aigc/message/${id}`,
		});
	},
};
