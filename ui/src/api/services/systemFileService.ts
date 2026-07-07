import apiClient from "../apiClient";

export interface SystemFile {
	id: string;
	configId: number;
	name: string;
	path: string;
	url: string;
	type: string;
	size: number;
	creator: string | null;
	updater: string | null;
	deleted: boolean;
	createTime: string;
	updateTime: string;
}

export interface FileQueryParams {
	pageNum?: number;
	pageSize?: number;
	name?: string;
	type?: string;
}

export interface FileListResponse {
	records: SystemFile[];
	total: number;
	size: number;
	current: number;
	pages: number;
}

export interface FileUploadResponse {
	id: string;
	name: string;
	path: string;
	url: string;
	type: string;
	size: number;
	creator: string;
	createTime: string;
}

const SystemFileApi = {
	File: "/system/file/page",
	Upload: "/system/file/upload",
	Delete: "/system/file/delete",
};

// 查询文件列表
export const queryFile = (params: FileQueryParams) => {
	return apiClient.get<FileListResponse>({
		url: SystemFileApi.File,
		params,
	});
};

// 删除文件
export const deleteFile = (id: string) => {
	return apiClient.delete({
		url: SystemFileApi.Delete,
		params: { id },
	});
};

// 上传文件
export const uploadFile = (formData: FormData) => {
	return apiClient.post<FileUploadResponse>({
		url: SystemFileApi.Upload,
		data: formData,
	});
};

export default {
	queryFile,
	deleteFile,
	uploadFile,
};
