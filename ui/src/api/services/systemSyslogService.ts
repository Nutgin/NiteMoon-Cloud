import apiClient from "../apiClient";

export interface SystemSyslog {
	id: string;
	ipAddr: string;
	title: string;
	requestMethod: string;
	requestUri: string;
	requestParams: any;
	requestTime: number;
	location: string;
	method: string;
	userName: string;
	status: string;
	exMsg: any;
	createBy: any;
	createTime: string;
	delFlag: string;
	tenantId: string;
}

export interface SyslogQueryParams {
	pageNum?: number;
	pageSize?: number;
	userName?: string;
	title?: string;
	ipAddr?: string;
}

export interface SyslogListResponse {
	records: SystemSyslog[];
	total: number;
	size: number;
	current: number;
	pages: number;
}

const SystemSyslogApi = {
	Syslog: "/system/log/page",
};

// 查询系统日志列表
export const querySyslog = (params: SyslogQueryParams) => {
	return apiClient.get<SyslogListResponse>({
		url: SystemSyslogApi.Syslog,
		params,
	});
};

export default {
	querySyslog,
};
