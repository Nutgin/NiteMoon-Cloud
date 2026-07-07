import apiClient from "../apiClient";
import type { Result } from "#/api";
import type { LlmMessage } from "./llmMessageService";

export interface LlmConversation {
	id?: string;
	username?: string;
	title?: string;
	chatTotal?: number;
	tokenUsed?: number;
	endTime?: string;
	createTime?: string;
}

export interface ConversationQueryParams {
	pageNum?: number;
	pageSize?: number;
	text?: string;
	username?: string;
	appId?: string;
}

export interface ConversationPageResult {
	rows: LlmConversation[];
	total: number;
}

export const llmConversationService = {
	/**
	 * 分页查询会话列表
	 */
	queryPage: (params: ConversationQueryParams): Promise<ConversationPageResult> => {
		return apiClient.get({
			url: "/llm/aigc/conversation/page",
			params,
		});
	},

	/**
	 * 查询会话列表
	 */
	queryList: (params: ConversationQueryParams): Promise<LlmConversation[]> => {
		return apiClient.get({
			url: "/llm/aigc/conversation/list",
			params,
		});
	},

	/**
	 * 获取会话下的消息列表
	 */
	getMessages: (conversationId: string): Promise<LlmMessage[]> => {
		return apiClient.get({
			url: `/llm/aigc/conversation/messages/${conversationId}`,
		});
	},

	/**
	 * 删除会话
	 */
	delete: (id: string): Promise<void> => {
		return apiClient.delete({
			url: `/llm/aigc/conversation/${id}`,
		});
	},
};
