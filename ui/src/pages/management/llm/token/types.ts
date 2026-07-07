export interface TokenStatistic {
	date: string;
	tokens: number;
}

export interface TokenMessage {
	id: string;
	username: string;
	modelName: string;
	promptTokens: number;
	completionTokens: number;
	ip: string;
	createTime: string;
}

export interface TokenQueryParams {
	page?: number;
	limit?: number;
	username?: string;
	modelName?: string;
	startDate?: string;
	endDate?: string;
}

export interface TokenPageResponse {
	rows: TokenMessage[];
	total: number;
}
