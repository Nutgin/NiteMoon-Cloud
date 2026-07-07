import apiClient from "../apiClient";
import type {
	TokenStatistic,
	TokenMessage,
	TokenQueryParams,
	TokenPageResponse
} from "@/pages/management/llm/token/types";

const TokenApi = {
	ChartBy30: "/llm/aigc/statistic/tokenBy30",
	MessagePage: "/llm/aigc/message/page",
	Message: "/llm/aigc/message",
	Export: "/llm/aigc/message/export",
};

// 获取近30天Token统计图表数据
export const getTokenChartBy30 = () => {
	return apiClient.get<TokenStatistic[]>({
		url: TokenApi.ChartBy30,
	});
};

// 获取Token使用分页列表
export const getTokenMessagePage = (params: TokenQueryParams) => {
	return apiClient.get<TokenPageResponse>({
		url: TokenApi.MessagePage,
		params,
	});
};

// 删除Token使用记录
export const deleteTokenMessage = (id: string) => {
	return apiClient.delete({
		url: `${TokenApi.Message}/${id}`,
	});
};

// 导出Token使用记录
export const exportTokenMessages = (params: TokenQueryParams) => {
	return apiClient.get({
		url: TokenApi.Export,
		params,
		responseType: 'blob',
	});
};
