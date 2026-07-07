import type { NavItemDataProps } from "@/components/nav/types";
import type { BasicStatus, PermissionType } from "./enum";

export interface UserToken {
	accessToken?: string;
	refreshToken?: string;
}

export interface UserInfo {
	id: string;
	username: string;
	password?: string;
	email: string;
	nikeName?: string; // 新增字段
	avatar?: string;
	deptId?: string; // 新增字段
	phone?: string; // 新增字段
	status?: string; // 新增字段，从 BasicStatus 改为 string
	createBy?: string; // 新增字段
	updateBy?: string; // 新增字段
	createTime?: string; // 新增字段
	updateTime?: string; // 新增字段
	delFlag?: string; // 新增字段
	tenantId?: string; // 新增字段
	type?: string; // 新增字段
	permissions?: string[]; // 从 Permission[] 改为 string[]
	roles?: string[]; // 从 Role[] 改为 string[]
	menu?: MenuTree[]; // 保持兼容
}

export interface Permission_Old {
	id: string;
	parentId: string;
	name: string;
	label: string;
	type: PermissionType;
	route: string;
	status?: BasicStatus;
	order?: number;
	icon?: string;
	component?: string;
	hide?: boolean;
	hideTab?: boolean;
	frameSrc?: URL;
	newFeature?: boolean;
	children?: Permission_Old[];
}

export interface Role_Old {
	id: string;
	name: string;
	code: string;
	status: BasicStatus;
	order?: number;
	desc?: string;
	permission?: Permission_Old[];
}

export interface CommonOptions {
	status?: BasicStatus;
	desc?: string;
	createdAt?: string;
	updatedAt?: string;
}
export interface User extends CommonOptions {
	id: string; // uuid
	username: string;
	password: string;
	email: string;
	phone?: string;
	avatar?: string;
}

export interface Role extends CommonOptions {
	id: string; // uuid
	name: string;
	code: string;
}

export interface Permission extends CommonOptions {
	id: string; // uuid
	name: string;
	code: string; // resource:action  example: "user-management:read"
}

export interface Menu extends CommonOptions, MenuMetaInfo {
	id: string; // MENU_ID → id (字符串)
	parentId: string; // PARENT_ID → parent_id (字符串)
	name: string; // MENU_NAME → name
	code: string;
	order?: number;
	type: PermissionType;
	
	// 新增字段以匹配后端格式
	weight?: number;
	redirect?: string | null;
	component?: string;
	createTime?: string;
	meta?: {
		title: string;
		icon: string;
		order: number;
	};
	icon?: string;
	applicationKey?: string | null;
	permission?: string; // PERMS → permission
	sort?: number; // ORDER_NUM → sort
	children?: Menu[];
}

export type MenuMetaInfo = Partial<Pick<NavItemDataProps, "path" | "icon" | "caption" | "info" | "disabled" | "auth" | "hidden">> & {
	externalLink?: URL;
	component?: string;
};

export type MenuTree = Menu & {
	children?: MenuTree[];
};
