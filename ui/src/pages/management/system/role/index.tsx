import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import Table, { type ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { queryRole, deleteRole, addRole, updateRole, getRoleMenus, getRoleManagementMenus, saveRoleMenus, type SystemRole, type RoleQueryParams } from "@/api/services/systemRoleService";
import { TreeCheckbox } from "@/components/tree-checkbox";

interface SearchFormData {
	roleName: string;
}

interface RoleFormData {
	roleName: string;
	roleCode: string;
	roleDesc: string;
}
export default function RolePage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [roleList, setRoleList] = useState<SystemRole[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<SystemRole | null>(null);
	const [isEdit, setIsEdit] = useState(false);

	const [menuList, setMenuList] = useState<SystemMenu[]>([]);
	const [menuTreeData, setMenuTreeData] = useState<any[]>([]);
	const [checkStrictly, setCheckStrictly] = useState(false);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

	const [menuConfigDialogOpen, setMenuConfigDialogOpen] = useState(false);
	const [configuringRole, setConfiguringRole] = useState<SystemRole | null>(null);
	const [menuConfigLoading, setMenuConfigLoading] = useState(false);
	const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
	const [menuConfigTreeData, setMenuConfigTreeData] = useState<any[]>([]);
	const [menuConfigExpandedKeys, setMenuConfigExpandedKeys] = useState<string[]>([]);

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			roleName: "",
		},
	});

	const roleForm = useForm<RoleFormData>({
		defaultValues: {
			roleName: "",
			roleCode: "",
			roleDesc: "",
		},
	});
	const loadRoles = async (params?: Partial<RoleQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: RoleQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await queryRole(queryParams);

			const roles = response.records || response.rows || [];
			const totalCount = response.total || 0;

			setRoleList(roles);
			setTotal(totalCount);
		} catch (error) {
			console.error("Failed to load roles:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadMenus = async () => {
		try {
			const response = await getRoleManagementMenus();
			setMenuList(response || []);

			const treeData = buildMenuTree(response || []);
			setMenuTreeData(treeData);
		} catch (error) {
			console.error("Failed to load menus:", error);
		}
	};

	const buildMenuTree = (menus: SystemMenu[]): any[] => {
		const convertToTreeNode = (menu: SystemMenu): any => {
			return {
				id: menu.id,
				name: menu.name,
				children: menu.children ? menu.children.map(convertToTreeNode) : []
			};
		};

		return menus.map(convertToTreeNode);
	};

	const getAllMenuIds = (menus: any[]): string[] => {
		let ids: string[] = [];
		menus.forEach(menu => {
			ids.push(menu.id);
			if (menu.children) {
				ids = ids.concat(getAllMenuIds(menu.children));
			}
		});
		return ids;
	};

	const handleExpandAll = () => {
		const allIds = getAllMenuIds(menuTreeData);
		setExpandedKeys(allIds);
	};

	const handleCollapseAll = () => {
		setExpandedKeys([]);
	};

	const handleMenuConfig = (record: SystemRole) => {
		setConfiguringRole(record);
		setMenuConfigDialogOpen(true);
		setSelectedMenus([]);
		setMenuConfigExpandedKeys([]);
		loadMenuConfig(record.id);
	};

	const loadMenuConfig = async (roleId: string) => {
		setMenuConfigLoading(true);
		try {
			const menuResponse = await getRoleManagementMenus();
			const allMenus = menuResponse || [];
			const treeData = buildMenuTree(allMenus);
			setMenuConfigTreeData(treeData);

			const roleMenus = await getRoleMenus(roleId);
			const menuIds = (roleMenus || []).map((menu: any) => menu.id);
			setSelectedMenus(menuIds);
		} catch (error) {
			console.error("Failed to load menu config:", error);
			toast.error(t('system.role.loadMenuConfigFailed'));
		} finally {
			setMenuConfigLoading(false);
		}
	};

	const handleSaveMenuConfig = async () => {
		if (!configuringRole) return;

		setMenuConfigLoading(true);
		try {
			await saveRoleMenus(configuringRole.id, selectedMenus);
			toast.success(t('system.role.menuConfigSaveSuccess'));
			setMenuConfigDialogOpen(false);
		} catch (error) {
			console.error("Failed to save menu config:", error);
		} finally {
			setMenuConfigLoading(false);
		}
	};

	const getAllMenuConfigIds = (menus: any[]): string[] => {
		let ids: string[] = [];
		menus.forEach(menu => {
			ids.push(menu.id);
			if (menu.children) {
				ids = ids.concat(getAllMenuConfigIds(menu.children));
			}
		});
		return ids;
	};

	const handleMenuConfigExpandAll = () => {
		const allIds = getAllMenuConfigIds(menuConfigTreeData);
		setMenuConfigExpandedKeys(allIds);
	};

	const handleMenuConfigCollapseAll = () => {
		setMenuConfigExpandedKeys([]);
	};

	const handleSearch = (values: SearchFormData) => {
		setCurrentPage(1);
		loadRoles(values);
	};

	const handleReset = () => {
		searchForm.reset();
		setCurrentPage(1);
		loadRoles({});
	};

	const columns: ColumnsType<SystemRole> = [
		{
			title: t('system.role.name'),
			dataIndex: "roleName",
			width: 200,
		},
		{
			title: t('system.role.code'),
			dataIndex: "roleCode",
			width: 150,
		},
		{
			title: t('system.role.roleDesc'),
			dataIndex: "roleDesc",
		},
		{
			title: t('system.role.createdAt'),
			dataIndex: "createTime",
			width: 150,
		},
		{
			title: t('system.role.actions'),
			key: "operation",
			align: "center",
			width: 200,
			render: (_, record) => (
				<div key={`operation-${record.id}`} className="flex w-full justify-center gap-1">
					<Button
						key={`edit-${record.id}`}
						variant="ghost"
						size="icon"
						onClick={() => onEdit(record)}
						title={t('system.role.edit')}
					>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
					<Button
						key={`menu-config-${record.id}`}
						variant="ghost"
						size="icon"
						onClick={() => handleMenuConfig(record)}
						title={t('system.role.menuConfig')}
					>
						<Icon icon="solar:menu-dots-bold-duotone" size={18} />
					</Button>
					<Button
						key={`delete-${record.id}`}
						variant="ghost"
						size="icon"
						onClick={() => handleDelete(record)}
						title={t('system.role.delete')}
					>
						<Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
					</Button>
				</div>
			),
		},
	];

	const onCreate = () => {
		setEditingRole(null);
		setIsEdit(false);
		roleForm.reset({
			roleName: "",
			roleCode: "",
			roleDesc: "",
		});
		setDialogOpen(true);
	};

	const onEdit = (record: SystemRole) => {
		setEditingRole(record);
		setIsEdit(true);
		roleForm.reset({
			roleName: record.roleName,
			roleCode: record.roleCode || "",
			roleDesc: record.roleDesc || "",
		});
		setDialogOpen(true);
	};

	const handleRoleSubmit = async (data: RoleFormData) => {
		try {
			setLoading(true);
			const roleData: SystemRole = {
				id: isEdit ? editingRole?.id : null,
				roleName: data.roleName,
				roleCode: data.roleCode,
				roleDesc: data.roleDesc,
			};

			if (isEdit) {
				await updateRole(roleData);
				toast.success(t('system.role.editSuccess'));
			} else {
				await addRole(roleData);
				toast.success(t('system.role.addSuccess'));
			}

			setDialogOpen(false);
			loadRoles();
		} catch (error) {
			console.error("Failed to save role:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = (record: SystemRole) => {
		if (window.confirm(t('system.role.deleteConfirmMsg'))) {
			deleteRole(record.id!).then(() => {
				toast.success(t('system.role.deleteRoleSuccess'));
				loadRoles();
			}).catch(() => {
				toast.error(t('system.role.deleteFailed'));
			});
		}
	};

	useEffect(() => {
		loadRoles();
		loadMenus();
	}, [currentPage, pageSize]);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('system.role.roleList')}</div>
						<Button onClick={onCreate}>{t('system.role.newRole')}</Button>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...searchForm}>
						<form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
							<div className="flex gap-4 items-end">
								<FormField
									control={searchForm.control}
									name="roleName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.role.name')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.role.pleaseInputRoleName')} {...field} />
											</FormControl>
										</FormItem>
								)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('system.role.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('system.role.reset')}
									</Button>
								</div>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			<Card className="mt-4">
				<CardContent>
					<Table
						rowKey="id"
						size="small"
						scroll={{ x: "max-content" }}
						pagination={{
							current: currentPage,
							pageSize: pageSize,
							total: total,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (total, range) => t('system.role.selectedRange', { start: range[0], end: range[1], total }),
							onChange: (page, size) => {
								setCurrentPage(page);
								setPageSize(size || 10);
							},
						}}
						loading={loading}
						columns={columns}
						dataSource={roleList}
					/>
				</CardContent>
			</Card>

			{/* Role Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{isEdit ? t('system.role.edit') : t('system.role.add')}</DialogTitle>
					</DialogHeader>
					<Form {...roleForm}>
						<form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-6">
							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={roleForm.control}
									name="roleName"
									rules={{ required: t('system.role.pleaseInputRoleName') }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.role.name')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.role.pleaseInputRoleName')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
								)}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={roleForm.control}
									name="roleCode"
									rules={{ required: t('system.role.pleaseInputRoleCode') }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.role.code')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.role.pleaseInputRoleCode')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
								)}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={roleForm.control}
									name="roleDesc"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.role.roleDesc')}</FormLabel>
											<FormControl>
												<Textarea placeholder={t('system.role.pleaseInputRoleDesc')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
								)}
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
									{t('system.role.cancel')}
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? t('system.role.saving') : (isEdit ? t('system.role.update') : t('system.role.add'))}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Role Menu Config Dialog */}
			<Dialog open={menuConfigDialogOpen} onOpenChange={setMenuConfigDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t('system.role.menuConfig')} - {configuringRole?.roleName}</DialogTitle>
					</DialogHeader>
					<div className="space-y-6">
						<div className="grid grid-cols-1 gap-4">
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 block">{t('system.role.menuLinkage')}</label>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="menuConfigCheckStrictly"
										checked={checkStrictly}
										onChange={(e) => setCheckStrictly(e.target.checked)}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<label htmlFor="menuConfigCheckStrictly" className="text-sm text-gray-700">
										{t('system.role.menuLinkageDesc')}
									</label>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 block">{t('system.role.menuOperation')}</label>
								<div className="flex items-center space-x-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleMenuConfigExpandAll}
										className="text-xs px-2 py-1"
									>
										{t('system.role.expandAll')}
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleMenuConfigCollapseAll}
										className="text-xs px-2 py-1"
									>
										{t('system.role.collapseAll')}
									</Button>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 block">{t('system.role.menuPermission')}</label>
								<TreeCheckbox
									data={menuConfigTreeData}
									value={selectedMenus}
									onValueChange={setSelectedMenus}
									placeholder={t('system.role.menuPermission')}
									checkStrictly={checkStrictly}
									expandedKeys={menuConfigExpandedKeys}
									onExpandedKeysChange={setMenuConfigExpandedKeys}
								/>
							</div>
						</div>

						<div className="flex justify-end space-x-2">
							<Button type="button" variant="outline" onClick={() => setMenuConfigDialogOpen(false)}>
								{t('system.role.cancel')}
							</Button>
							<Button type="button" onClick={handleSaveMenuConfig} disabled={menuConfigLoading}>
								{menuConfigLoading ? t('system.role.saving') : t('system.role.save')}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
