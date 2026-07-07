import apiClient from "../apiClient";

export interface SystemDept {
	id: string;
	parentId: string;
	deptName: string;
	leader?: string;
	leaderPhone?: string;
	sort?: number;
	status?: string;
	createBy?: string;
	updateBy?: string;
	createTime?: string;
	updateTime?: string;
	delFlag?: string;
	tenantId?: string;
}

const SystemDeptApi = {
	Dept: "/system/dept/list",
	DeptOperation: "/system/dept",
};

// 查询部门列表（树形结构）
export const queryDept = () => {
	return apiClient.get<SystemDept[]>({
		url: SystemDeptApi.Dept,
	});
};

// 新增部门
export const addDept = (dept: SystemDept) => {
	return apiClient.post({
		url: SystemDeptApi.DeptOperation,
		data: dept,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};

// 修改部门
export const updateDept = (dept: SystemDept) => {
	// 排除createTime, updateTime, createBy, updateBy字段，只传递需要更新的字段
	const { createTime, updateTime, createBy, updateBy, ...updateData } = dept;
	return apiClient.put({
		url: SystemDeptApi.DeptOperation,
		data: updateData,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};

// 删除部门
export const deleteDept = (id: string) => {
	return apiClient.delete({
		url: `${SystemDeptApi.DeptOperation}/${id}`,
	});
};

export default {
	queryDept,
	addDept,
	updateDept,
	deleteDept,
};
