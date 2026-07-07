import apiClient from "../apiClient";
import type { UserInfo } from "#/entity";

export interface SystemUser {
	id: string; // 后端返回的 id 字段
	username: string;
	password?: string;
	email: string;
	nikeName: string; // 新增字段，对应 nikeName
	avatar?: string; // 新增字段，对应 avatar
	deptId: string; // 部门ID
	phone: string; // 后端返回的 phone 字段
	status: string; // "0" 启用，"1" 禁用（根据后端文档）
	createBy?: string;
	updateBy?: string;
	createTime?: string;
	updateTime?: string;
	delFlag?: string;
	tenantId?: string;
	type?: string;
	permissions?: any[]; // 菜单权限数组
	roles?: string[]; // 角色ID数组
}

export interface UserQueryParams {
	pageNum?: number;
	pageSize?: number;
	username?: string;
	nikeName?: string;
	phone?: string;
	status?: string;
}

export interface UserListResponse {
	rows: SystemUser[];
	total: number;
}

export interface ResetPasswordParams {
	usernames: string;
}

const SystemUserApi = {
	User: "/system/user/page",
	UserOperation: "/system/user",
	CheckUsername: "/system/user/check",
	Password: "/system/user/password",
	ResetPassword: "/system/user/reset",
	Profile: "/system/user/profile",
	Refresh: "/system/user/refresh",
	LoginLog: "/system/loginLog/currentUser",
};

// 查询用户列表
export const queryUser = (params: UserQueryParams) => {
	return apiClient.get<UserListResponse>({
		url: SystemUserApi.User,
		params,
	});
};

// 新增用户
export const addUser = (user: SystemUser) => {
	return apiClient.post({
		url: SystemUserApi.UserOperation,
		data: user,
		headers: { 'Content-Type': 'application/json' },
	});
};

// 修改用户
export const updateUser = (user: SystemUser) => {
	return apiClient.put({
		url: SystemUserApi.UserOperation,
		data: user,
		headers: { 'Content-Type': 'application/json' },
	});
};

// 删除用户
export const deleteUser = (id: string | null) => {
	return apiClient.delete({
		url: `${SystemUserApi.UserOperation}/${id}`,
	});
};

// 检查用户名是否存在
export const checkUsername = (username: string) => {
	return apiClient.get({
		url: `${SystemUserApi.CheckUsername}/${username}`,
	});
};

// 修改密码
export const updatePwd = (data: any) => {
	return apiClient.put({
		url: SystemUserApi.Password,
		data,
	});
};

// 重置密码
export const resetPwd = (data: ResetPasswordParams) => {
	return apiClient.put({
		url: SystemUserApi.ResetPassword,
		data,
	});
};

// 刷新用户缓存
export const refresh = () => {
	return apiClient.get({
		url: SystemUserApi.Refresh,
	});
};

// 修改个人信息
export const updateProfile = (data: any) => {
	return apiClient.put({
		url: SystemUserApi.Profile,
		data,
	});
};

// 获取用户登录日志
export const userLoginLog = () => {
	return apiClient.get({
		url: SystemUserApi.LoginLog,
	});
};

export default {
	queryUser,
	addUser,
	updateUser,
	deleteUser,
	checkUsername,
	updatePwd,
	resetPwd,
	refresh,
	updateProfile,
	userLoginLog,
};
