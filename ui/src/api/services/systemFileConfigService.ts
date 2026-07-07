import apiClient from "../apiClient";

export interface SystemFileConfig {
	id: string;
	name: string;
	storage: number;
	remark: string;
	master: boolean;
	config: FileConfigDetail;
	createTime: string;
	updateTime: string;
	creator: string;
	updater: string;
	deleted: boolean;
}

export interface FileConfigDetail {
	"@class"?: string;
	domain?: string;
	basePath?: string;
	host?: string;
	port?: string;
	username?: string;
	password?: string;
	mode?: string;
	endpoint?: string;
	bucket?: string;
	accessKey?: string;
	accessSecret?: string;
	enablePathStyleAccess?: string;
	privateBucket?: string;
	backendDomain?: string;
}

export interface ConfigQueryParams {
	pageNum?: number;
	pageSize?: number;
	name?: string;
	storage?: number;
}

export interface ConfigListResponse {
	records: SystemFileConfig[];
	total: number;
	size: number;
	current: number;
	pages: number;
}

const SystemFileConfigApi = {
	Config: "/system/file-config/page",
	Create: "/system/file-config/create",
	Update: "/system/file-config/update",
	Delete: "/system/file-config/delete",
	UpdateMaster: "/system/file-config/update-master",
	Test: "/system/file-config/test",
};

// 查询配置列表
export const queryConfig = (params: ConfigQueryParams) => {
	return apiClient.get<ConfigListResponse>({
		url: SystemFileConfigApi.Config,
		params,
	});
};

// 新增配置
export const addConfig = (data: Partial<SystemFileConfig>) => {
	return apiClient.post({
		url: SystemFileConfigApi.Create,
		data,
	});
};

// 更新配置
export const updateConfig = (data: Partial<SystemFileConfig>) => {
	return apiClient.put({
		url: SystemFileConfigApi.Update,
		data,
	});
};

// 删除配置
export const deleteConfig = (id: string) => {
	return apiClient.delete({
		url: SystemFileConfigApi.Delete,
		params: { id },
	});
};

// 设为主配置
export const setMasterConfig = (id: string) => {
	return apiClient.put({
		url: SystemFileConfigApi.UpdateMaster,
		params: { id },
	});
};

// 测试配置
export const testConfig = (id: string) => {
	return apiClient.get({
		url: SystemFileConfigApi.Test,
		params: { id },
	});
};

export default {
	queryConfig,
	addConfig,
	updateConfig,
	deleteConfig,
	setMasterConfig,
	testConfig,
};
