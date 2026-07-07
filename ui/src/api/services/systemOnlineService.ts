import apiClient from "../apiClient";

export interface OnlineUser {
	tokenId: string;
	tokenTimeout: number;
	loginTime: string;
	ipAddr: string;
	location: string;
	userName: string;
	browser: string;
	os: string;
	tenantId: string;
}

export interface OnlineUserQueryParams {
	// 后端接口不需要分页参数，保留接口兼容性
}

// 后端直接返回数组，不需要分页包装
export type OnlineUserListResponse = OnlineUser[];

const SystemOnlineApi = {
	OnlineList: "/system/online/list",
	ForceLogout: "/system/online",
};

// 获取在线用户列表
export const getOnlineUserList = () => {
	return apiClient.get<OnlineUserListResponse>({
		url: SystemOnlineApi.OnlineList,
	});
};

// 强制用户下线
export const forceLogout = (tokenId: string) => {
	return apiClient.delete({
		url: `${SystemOnlineApi.ForceLogout}/${tokenId}`,
	});
};

export default {
	getOnlineUserList,
	forceLogout,
};
