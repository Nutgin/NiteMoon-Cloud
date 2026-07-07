import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { TreeSelect } from "@/components/tree-select";
import { MultiSelect } from "@/components/multi-select";
import { AppImage } from "@/components/app-image";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
	queryUser,
	deleteUser,
	resetPwd,
	addUser,
	updateUser,
	type SystemUser,
	type UserQueryParams
} from "@/api/services/systemUserService";
import {
	queryDept,
	type SystemDept
} from "@/api/services/systemDeptService";
import {
	queryRoleAll,
	type SystemRole
} from "@/api/services/systemRoleService";

interface SearchFormData {
	username: string;
}

interface UserFormData {
	username: string;
	password: string;
	email: string;
	nikeName: string;
	avatar?: string;
	deptId: string;
	phone: string;
	status: string;
	permissions: any[];
	roles: string[];
}

export default function UserPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [userList, setUserList] = useState<SystemUser[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
	const [isEdit, setIsEdit] = useState(false);
	const [deptList, setDeptList] = useState<SystemDept[]>([]);
	const [roleList, setRoleList] = useState<SystemRole[]>([]);
	const [deptTreeData, setDeptTreeData] = useState<any[]>([]);
	const [roleOptions, setRoleOptions] = useState<any[]>([]);
	const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
	const [newPassword, setNewPassword] = useState<string>("");
	const { copyFn } = useCopyToClipboard();

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			username: "",
		},
	});

	const userForm = useForm<UserFormData>({
		defaultValues: {
			username: "",
			password: "",
			email: "",
			nikeName: "",
			avatar: "",
			deptId: "",
			phone: "",
			status: "0",
			permissions: [],
			roles: [],
		},
	});

	const loadUsers = async (params?: Partial<UserQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: UserQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await queryUser(queryParams);

			const users = response.records || response.rows || [];
			const totalCount = response.total || 0;

			setUserList(users);
			setTotal(totalCount);
		} catch (error) {
			console.error("Failed to load users:", error);
			toast.error(t('system.user.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const loadDepts = async () => {
		try {
			const response = await queryDept();
			setDeptList(response || []);

			const treeData = buildDeptTree(response || []);
			setDeptTreeData(treeData);
		} catch (error) {
			console.error("Failed to load departments:", error);
			toast.error(t('system.user.loadDeptFailed'));
		}
	};

	const loadRoles = async () => {
		try {
			const response = await queryRoleAll();

			setRoleList(response || []);

			const options = (response || []).map((role: SystemRole) => ({
				value: role.id,
				label: role.roleName
			}));
			setRoleOptions(options);
		} catch (error) {
			console.error("Failed to load roles:", error);
			toast.error(t('system.user.loadRoleFailed'));
		}
	};

	const buildDeptTree = (depts: SystemDept[]): any[] => {
		const deptMap = new Map<string, any>();
		const rootDepts: any[] = [];

		depts.forEach(dept => {
			deptMap.set(dept.id, {
				id: dept.id,
				name: dept.deptName,
				children: []
			});
		});

		depts.forEach(dept => {
			const deptNode = deptMap.get(dept.id)!;
			const parentId = dept.parentId;

			if (parentId && parentId !== "0" && deptMap.has(parentId)) {
				const parent = deptMap.get(parentId)!;
				parent.children = parent.children || [];
				parent.children.push(deptNode);
			} else {
				rootDepts.push(deptNode);
			}
		});

		return rootDepts;
	};

	const handleSearch = (values: SearchFormData) => {
		setCurrentPage(1);
		loadUsers(values);
	};

	const handleReset = () => {
		searchForm.reset();
		setCurrentPage(1);
		loadUsers({});
	};

	const handleEdit = (record: SystemUser) => {
		setEditingUser(record);
		setIsEdit(true);

		const roles = record.roles || [];

		userForm.reset({
			username: record.username || "",
			password: "",
			email: record.email || "",
			nikeName: record.nikeName || "",
			avatar: record.avatar || "",
			status: record.status || "0",
			deptId: record.deptId || "",
			phone: record.phone || "",
			permissions: record.permissions || [],
			roles: roles,
		});
		setDialogOpen(true);
	};

	const handleAdd = () => {
		setEditingUser(null);
		setIsEdit(false);
		userForm.reset({
			username: "",
			password: "",
			email: "",
			nikeName: "",
			avatar: "",
			status: "0",
			deptId: "",
			phone: "",
			permissions: [],
			roles: [],
		});
		setDialogOpen(true);
	};

	const handleUserSubmit = async (data: UserFormData) => {
		try {
			setLoading(true);
			const userData: SystemUser = {
				id: isEdit ? editingUser?.id : undefined,
				username: data.username,
				password: data.password || undefined,
				email: data.email,
				nikeName: data.nikeName,
				avatar: data.avatar,
				deptId: data.deptId,
				phone: data.phone,
				status: data.status,
				permissions: data.permissions,
				roles: data.roles,
			};

			if (isEdit) {
				await updateUser(userData);
				toast.success(t('system.user.editSuccess'));
			} else {
				await addUser(userData);
				toast.success(t('system.user.addSuccess'));
			}

			setDialogOpen(false);
			loadUsers();
		} catch (error) {
			console.error("Failed to save user:", error);
			toast.error(isEdit ? t('system.user.editFailed') : t('system.user.addFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = (record: SystemUser) => {
		if (window.confirm(t('system.user.deleteConfirmMsg'))) {
			deleteUser(record.id || record.userId).then(() => {
				toast.success(t('system.user.deleteUserSuccess'));
				loadUsers();
			});
		}
	};

	const handleResetPwd = (record: SystemUser) => {
		if (window.confirm(t('system.user.resetPwdConfirm'))) {
			resetPwd({ usernames: record.username }).then((response) => {
				if (response) {
					setNewPassword(response);
					setResetPasswordDialogOpen(true);
					toast.success(t('system.user.resetPwdSuccess'));
				}
			});
		}
	};

	useEffect(() => {
		loadUsers();
		loadDepts();
		loadRoles();
	}, [currentPage, pageSize]);

	const columns: ColumnsType<SystemUser> = [
		{
			title: t('system.user.avatar'),
			dataIndex: "avatar",
			width: 80,
			align: "center",
			render: (avatar: string, record: SystemUser) => (
				<div className="flex justify-center">
					{avatar ? (
						<AppImage
							src={avatar}
							alt={record.nikeName || record.username}
							className="w-8 h-8 rounded-full object-cover border border-gray-200"
							showLoading={false}
							fallbackText={""}
						/>
					) : (
						<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium border border-gray-300">
							{(record.nikeName || record.username || '').charAt(0).toUpperCase()}
						</div>
					)}
				</div>
			),
		},
		{
			title: t('system.user.nickname'),
			dataIndex: "nikeName",
			width: 120,
		},
		{
			title: t('system.user.username'),
			dataIndex: "username",
			width: 150,
		},
		{
			title: t('system.user.phone'),
			dataIndex: "phone",
			width: 120,
		},
		{
			title: t('system.user.dept'),
			dataIndex: "deptId",
			width: 120,
			render: (deptId: string) => {
				const dept = deptList.find(d => d.id === deptId);
				return dept?.deptName || deptId;
			},
		},
		{
			title: t('system.user.email'),
			dataIndex: "email",
			width: 200,
		},
		{
			title: t('system.user.status'),
			dataIndex: "status",
			align: "center",
			width: 80,
			render: (status: string) => (
				<Badge variant={status === "1" ? "error" : "success"}>
					{status === "1" ? t('system.user.disable') : t('system.user.enable')}
				</Badge>
			),
		},
		{
			title: t('system.user.createdAt'),
			dataIndex: "createTime",
			width: 150,
		},
		{
			title: t('system.user.actions'),
			key: "operation",
			align: "center",
			width: 200,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleEdit(record)}
						title={t('system.user.edit')}
					>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleResetPwd(record)}
						title={t('system.user.resetPwd')}
					>
						<Icon icon="solar:refresh-circle-line-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleDelete(record)}
						title={t('system.user.delete')}
					>
						<Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
					</Button>
				</div>
			),
		},
	];

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('system.user.userList')}</div>
						<Button onClick={handleAdd}>{t('system.user.newUser')}</Button>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...searchForm}>
						<form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
							<div className="flex gap-4 items-end">
								<FormField
									control={searchForm.control}
									name="username"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.username')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.user.pleaseInputUsername')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('system.user.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('system.user.reset')}
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
							showTotal: (total, range) => t('system.user.selectedRange', { start: range[0], end: range[1], total }),
							onChange: (page, size) => {
								setCurrentPage(page);
								setPageSize(size || 10);
							},
						}}
						loading={loading}
						columns={columns}
						dataSource={userList}
					/>
				</CardContent>
			</Card>

			{/* User Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{isEdit ? t('system.user.edit') : t('system.user.add')}</DialogTitle>
					</DialogHeader>
					<Form {...userForm}>
						<form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={userForm.control}
									name="nikeName"
									rules={{ required: t('system.user.pleaseInputName') }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.name')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.user.pleaseInputName')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={userForm.control}
									name="username"
									rules={{
										required: t('system.user.pleaseInputUsername'),
									}}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.username')}</FormLabel>
											<FormControl>
												<Input
													placeholder={t('system.user.pleaseInputUsername')}
													{...field}
													disabled={isEdit}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={userForm.control}
									name="password"
									rules={{
										required: !isEdit ? t('system.user.pleaseInputPassword') : false,
									}}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.password')}</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder={isEdit ? "******" : t('system.user.pleaseInputPassword')}
													value={isEdit ? "******" : field.value}
													onChange={field.onChange}
													disabled={isEdit}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={userForm.control}
									name="phone"
									rules={{
										required: t('system.user.pleaseInputPhone'),
										pattern: isEdit ? undefined : {
											value: /^1[3456789]\d{9}$/,
											message: t('system.user.phoneFormatError')
										}
									}}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.phone')}</FormLabel>
											<FormControl>
												<Input
													placeholder={t('system.user.pleaseInputPhone')}
													{...field}
													disabled={isEdit}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={userForm.control}
									name="email"
									rules={{
										required: t('system.user.pleaseInputEmail'),
										pattern: {
											value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
											message: t('system.user.emailFormatError')
										}
									}}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.email')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.user.pleaseInputEmail')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={userForm.control}
									name="deptId"
									rules={{ required: t('system.user.pleaseSelectDept') }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.dept')}</FormLabel>
											<FormControl>
												<div className="w-full">
													<TreeSelect
														data={deptTreeData}
														value={field.value}
														onValueChange={field.onChange}
														placeholder={t('system.user.pleaseSelectDept')}
														className="w-full"
														style={{ width: '100%' }}
													/>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={userForm.control}
									name="status"
									rules={{ required: t('system.user.pleaseSelectStatus') }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.status')}</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t('system.user.pleaseSelectStatus')} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="0">{t('system.user.enable')}</SelectItem>
													<SelectItem value="1">{t('system.user.disable')}</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={userForm.control}
									name="roles"
									rules={{ required: t('system.user.pleaseSelectRole') }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.user.role')}</FormLabel>
											<FormControl>
												<MultiSelect
													options={roleOptions}
													value={field.value}
													onValueChange={field.onChange}
													placeholder={t('system.user.pleaseSelectRole')}
													className="w-full"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
									{t('system.user.cancel')}
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? t('system.user.saving') : (isEdit ? t('system.user.update') : t('system.user.add'))}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Reset Password Result Dialog */}
			<Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
				<DialogContent className="max-w-sm">
					<div className="space-y-4">
						<div className="p-4 bg-gray-50 rounded-lg">
							<p className="text-sm text-gray-600 mb-2">{t('system.user.newPassword')}：</p>
							<div className="flex items-center gap-2">
								<Input
									value={newPassword}
									readOnly
									className="font-mono text-lg"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={() => copyFn(newPassword)}
									title={t('system.user.copyPwd')}
								>
									<Icon icon="solar:copy-bold-duotone" size={16} />
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
