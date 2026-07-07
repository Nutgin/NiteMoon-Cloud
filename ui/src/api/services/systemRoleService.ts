import apiClient from "../apiClient";
import {SystemMenu} from "@/api/services/systemMenuService.ts";

export interface SystemRole {
	id: string; // 后端返回的 id 字段
	roleName: string; // 角色名称
	roleCode?: string; // 角色编码
	roleDesc?: string; // 角色描述
	createBy?: string;
	updateBy?: string;
	createTime?: string;
	updateTime?: string;
	delFlag?: string;
	tenantId?: string;

	// 兼容旧字段映射
	roleId?: string; // 映射到 id
	remark?: string; // 映射到 roleDesc
	menuIds?: string; // 保持兼容
	menus?: any[]; // 保持兼容
}

export interface RoleQueryParams {
	pageNum?: number;
	pageSize?: number;
	roleName?: string;
}

export interface RoleListResponse {
	rows: SystemRole[];
	total: number;
}

const SystemRoleApi = {
	Role: "/system/role/page",
	RoleOptions: "/system/role/list",
	RoleOperation: "/system/role"
};

// 查询角色列表
export const queryRole = (params: RoleQueryParams) => {
	return apiClient.get<RoleListResponse>({
		url: SystemRoleApi.Role,
		params,
	});
};

// 查询所有角色（不分页）
export const queryRoleAll = () => {
	return apiClient.get({
		url: SystemRoleApi.RoleOptions,
	});
};

// 新增角色
export const addRole = (role: SystemRole) => {
	// 构建符合后端要求的数据格式
	const requestData = {
		roleName: role.roleName,
		roleCode: role.roleCode,
		roleDesc: role.roleDesc,
	};

	return apiClient.post({
		url: SystemRoleApi.RoleOperation,
		data: requestData,
		headers: { 'Content-Type': 'application/json' },
	});
};

// 修改角色
export const updateRole = (role: SystemRole) => {
	// 构建符合后端要求的数据格式
	const requestData = {
		id: role.id,
		roleName: role.roleName,
		roleCode: role.roleCode,
		roleDesc: role.roleDesc,
	};

	return apiClient.put({
		url: SystemRoleApi.RoleOperation,
		data: requestData,
		headers: { 'Content-Type': 'application/json' },
	});
};

// 获取角色菜单权限
export const getRoleMenus = (roleId: string) => {
	return apiClient.get<string[]>({
		url: `/system/menu/role/${roleId}`,
	});
};

// 获取角色管理模块的菜单列表（专用接口）
export const getRoleManagementMenus = () => {
	return apiClient.get<SystemMenu[]>({
		url: "/system/menu/tenant",
	});
};

// 保存角色菜单权限
export const saveRoleMenus = (roleId: string, menuIds: string[]) => {
	return apiClient.post({
		url: "/system/role/role/menu",
		data: {
			roleId,
			menuIds,
		},
		headers: { 'Content-Type': 'application/json' },
	});
};

// 删除角色
export const deleteRole = (id: string) => {
	return apiClient.delete({
		url: `${SystemRoleApi.RoleOperation}/${id}`,
	});
};

export default {
	queryRole,
	queryRoleAll,
	addRole,
	updateRole,
	deleteRole,
	getRoleMenus,
	getRoleManagementMenus,
	saveRoleMenus,
};
