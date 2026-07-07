import apiClient from "../apiClient";

export interface JobLog {
	id?: string;
	beanName: string;
	methodName: string;
	params: string;
	times: number;
	status: string; // "0" 成功, "1" 失败
	error: string;
	createTime: string;
}

export interface JobLogQueryParams {
	pageNum?: number;
	pageSize?: number;
	beanName?: string;
	status?: string;
	startTime?: string;
	endTime?: string;
}

export interface JobLogListResponse {
	rows: JobLog[];
	total: number;
}

const SystemJoblogApi = {
	JobLog: "/job/job/log",
};

// 查询任务日志列表
export const queryJobLog = (params: JobLogQueryParams) => {
	return apiClient.get<JobLogListResponse>({
		url: SystemJoblogApi.JobLog,
		params,
	});
};

export default {
	queryJobLog,
};
