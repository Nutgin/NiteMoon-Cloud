import apiClient from "../apiClient";

export interface Job {
	jobId?: string;
	beanName: string;
	methodName: string;
	params: string;
	cronExpression: string;
	status: string; // "0" 运行, "1" 暂停
	remark: string;
	createTime?: string;
}

export interface JobQueryParams {
	pageNum?: number;
	pageSize?: number;
	beanName?: string;
	status?: string;
}

export interface JobListResponse {
	rows: Job[];
	total: number;
}

const SystemJobApi = {
	Job: "/job/job",
};

// 查询任务列表
export const queryJob = (params: JobQueryParams) => {
	return apiClient.get<JobListResponse>({
		url: SystemJobApi.Job,
		params,
	});
};

// 新增任务
export const addJob = (data: Omit<Job, "jobId" | "createTime">) => {
	const formData = new URLSearchParams();
	Object.entries(data).forEach(([key, value]) => {
		if (value !== null && value !== undefined) {
			formData.append(key, String(value));
		}
	});
	return apiClient.post({
		url: SystemJobApi.Job,
		data: formData,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	});
};

// 修改任务
export const updateJob = (data: Job) => {
	// 排除createTime字段，只传递需要更新的字段
	const { createTime, ...updateData } = data;
	const formData = new URLSearchParams();
	Object.entries(updateData).forEach(([key, value]) => {
		if (value !== null && value !== undefined) {
			formData.append(key, String(value));
		}
	});
	return apiClient.put({
		url: SystemJobApi.Job,
		data: formData,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	});
};

// 删除任务
export const deleteJob = (jobId: string) => {
	return apiClient.delete({
		url: `${SystemJobApi.Job}/${jobId}`,
	});
};

// 运行一次
export const runOnce = (jobId: string) => {
	return apiClient.get({
		url: `${SystemJobApi.Job}/run/${jobId}`,
	});
};

// 暂停任务
export const pauseJob = (jobId: string) => {
	return apiClient.get({
		url: `${SystemJobApi.Job}/pause/${jobId}`,
	});
};

// 恢复任务
export const resumeJob = (jobId: string) => {
	return apiClient.get({
		url: `${SystemJobApi.Job}/resume/${jobId}`,
	});
};

export default {
	queryJob,
	addJob,
	updateJob,
	deleteJob,
	runOnce,
	pauseJob,
	resumeJob,
};
