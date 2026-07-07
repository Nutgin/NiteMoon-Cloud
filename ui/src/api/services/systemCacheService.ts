import apiClient from "../apiClient";

export interface CacheInfo {
	version: string;
	mode: string;
	port: number;
	uptime: number;
	clients: number;
	maxmemory: string;
	aofEnabled: string;
	rdbLastSaveStatus: string;
	keys: number;
	instantaneousInputKbps: string;
	instantaneousOutputKbps: string;
}

export interface MemoryInfo {
	used: number;
	total: number;
}

export interface CacheKey {
	key: string;
	type: string;
	size: number;
	ttl: number;
}

export interface CacheKeyQueryParams {
	pageNum?: number;
	pageSize?: number;
	key?: string;
}

export interface CacheKeyListResponse {
	records: CacheKey[];
	total: number;
}

const SystemCacheApi = {
	Info: "/system/cache/info",
	Memory: "/system/cache/memory",
	Keys: "/system/cache/keys",
};

// 获取缓存基本信息
export const getCacheInfo = () => {
	return apiClient.get<CacheInfo>({
		url: SystemCacheApi.Info,
	});
};

// 获取缓存内存信息
export const getCacheMemory = () => {
	return apiClient.get<MemoryInfo>({
		url: SystemCacheApi.Memory,
	});
};

// 获取缓存键列表
export const getCacheKeys = (params: CacheKeyQueryParams) => {
	return apiClient.get<CacheKeyListResponse>({
		url: SystemCacheApi.Keys,
		params,
	});
};

export default {
	getCacheInfo,
	getCacheMemory,
	getCacheKeys,
};
