import apiClient from "../apiClient";

export interface SystemMenu {
	id: string; // MENU_ID → id (字符串)
	parentId: string; // PARENT_ID → parent_id (字符串)
	weight: number; // 新增字段
	name: string; // MENU_NAME → name
	enName?: string; // EN_NAME → en_name (英文菜单名称)
	redirect: string | null; // 新增字段
	path: string; // PATH → path
	component: string; // COMPONENT → component
	createTime: string; // CREATE_TIME → create_time
	meta: {
		title: string;
		enTitle?: string;
		icon: string;
		order: number;
	};
	icon: string; // ICON → icon
	applicationKey: string | null; // 新增字段
	permission: string; // PERMS → permission
	sort: number; // ORDER_NUM → sort
	type: string; // TYPE → type
	children?: SystemMenu[]; // 子菜单
}

const SystemMenuApi = {
	Menu: "/system/menu",
};

// 查询菜单列表（树形结构）
export const queryMenu = () => {
	return apiClient.get<SystemMenu[]>({
		url: SystemMenuApi.Menu + "/tree",
	});
};

// 新增菜单
export const addMenu = (menu: SystemMenu) => {
	return apiClient.post({
		url: SystemMenuApi.Menu,
		data: menu,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};

// 修改菜单
export const updateMenu = (menu: SystemMenu) => {
	return apiClient.put({
		url: SystemMenuApi.Menu,
		data: menu,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};

// 删除菜单
export const deleteMenu = (id: string) => {
	return apiClient.delete({
		url: `${SystemMenuApi.Menu}/${id}`,
	});
};

export default {
	queryMenu,
	addMenu,
	updateMenu,
	deleteMenu,
};
