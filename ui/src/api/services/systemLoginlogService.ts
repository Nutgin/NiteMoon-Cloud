import apiClient from "../apiClient";

export interface LoginLog {
	id: string;
	ipAddr: string;
	location: string;
	userName: string;
	status: string;
	msg: string;
	browser: string;
	os: string;
	createBy: string;
	createTime: string;
	delFlag: string;
	tenantId: string;
}

export interface LoginLogQueryParams {
	pageNum?: number;
	pageSize?: number;
	userName?: string;
	ip?: string;
	startTime?: string;
	endTime?: string;
}

export interface LoginLogListResponse {
	records: LoginLog[];
	total: number;
	size: number;
	current: number;
	pages: number;
}

const SystemLoginlogApi = {
	LoginLog: "/system/loginlog/page",
};

// 查询登录日志列表
export const queryLoginLog = (params: LoginLogQueryParams) => {
	return apiClient.get<LoginLogListResponse>({
		url: SystemLoginlogApi.LoginLog,
		params,
	});
};

export default {
	queryLoginLog,
};
