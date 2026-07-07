import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Tree } from "antd";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { queryDept, addDept, updateDept, deleteDept, type SystemDept } from "@/api/services/systemDeptService";
import "@/utils/dept-tree-fix";

const validatePhone = (phone: string) => {
	const phoneRegex = /^1[3-9]\d{9}$/;
	return phoneRegex.test(phone);
};

const convertDeptToSelectOptions = (depts: SystemDept[], excludeId?: string): Array<{ value: string; label: string; disabled?: boolean }> => {
	const options: Array<{ value: string; label: string; disabled?: boolean }> = [];

	const traverse = (parentId: string, level = 0) => {
		const children = depts.filter(dept => dept.parentId === parentId);
		children.forEach(child => {
			const prefix = '　'.repeat(level);
			if (excludeId && child.id === excludeId) {
				return;
			}
			options.push({
				value: child.id,
				label: `${prefix}${child.deptName}`,
				disabled: false,
			});
			traverse(child.id, level + 1);
		});
	};

	traverse("0");
	options.unshift({ value: "0", label: "topDept", disabled: false });

	if (excludeId) {
		const excludeDescendants = (deptId: string): string[] => {
			const descendants = [deptId];
			const children = depts.filter(d => d.parentId === deptId);
			children.forEach(child => {
				descendants.push(...excludeDescendants(child.id));
			});
			return descendants;
		};

		const excludedIds = excludeDescendants(excludeId);
		return options.filter(option => !excludedIds.includes(option.value));
	}

	return options;
};

interface DeptFormData {
	deptName: string;
	parentId: string;
	leader?: string;
	leaderPhone?: string;
	sort?: number;
	status?: string;
}

interface DeptTreeNode {
	key: string;
	title: string;
	children: DeptTreeNode[];
	deptData: SystemDept;
}

const buildDeptTree = (depts: SystemDept[]): DeptTreeNode[] => {
	if (!depts || !depts.length) return [];

	const handle = (parentId: any): DeptTreeNode[] => {
		const arr: DeptTreeNode[] = [];
		depts.forEach((item) => {
			if (item.parentId === parentId) {
				const children = handle(item.id);
				const curr: DeptTreeNode = {
					key: item.id || '',
					title: item.deptName,
					children,
					deptData: item,
				};
				arr.push(curr);
			}
		});
		return arr;
	};

	return handle('0');
};

export default function DeptPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [deptList, setDeptList] = useState<SystemDept[]>([]);
	const [treeData, setTreeData] = useState<DeptTreeNode[]>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingDept, setEditingDept] = useState<SystemDept | null>(null);
	const [isEdit, setIsEdit] = useState(false);
	const [isCreatingChild, setIsCreatingChild] = useState(false);
	const [selectedDept, setSelectedDept] = useState<SystemDept | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [isDetailEditing, setIsDetailEditing] = useState(false);
	const [parentDeptOptions, setParentDeptOptions] = useState<Array<{ value: string; label: string; disabled?: boolean }>>([]);

	const deptForm = useForm<DeptFormData>({
		defaultValues: {
			deptName: "",
			parentId: "0",
			leader: "",
			leaderPhone: "",
			sort: 0,
			status: "0",
		},
	});

	const loadDepts = async () => {
		setLoading(true);
		try {
			const response = await queryDept();
			const deptData = response || [];
			setDeptList(deptData);

			if (deptData.length > 0) {
				const builtTreeData = buildDeptTree(deptData);
				setTreeData(builtTreeData);

				const allKeys = getAllKeysFromTree(builtTreeData);
				setExpandedKeys(allKeys);

				const options = convertDeptToSelectOptions(deptData);
				setParentDeptOptions(options);
			}
		} catch (error) {
			console.error("Failed to load departments:", error);
		} finally {
			setLoading(false);
		}
	};

	const getAllKeysFromTree = (treeNodes: DeptTreeNode[]): string[] => {
		const keys: string[] = [];
		const traverse = (nodes: DeptTreeNode[]) => {
			nodes.forEach(node => {
				keys.push(node.key);
				if (node.children && node.children.length > 0) {
					traverse(node.children);
				}
			});
		};
		traverse(treeNodes);
		return keys;
	};

	const handleSelect = (selectedKeys: string[], info: any) => {
		if (isDetailEditing) {
			setIsDetailEditing(false);
		}

		if (selectedKeys.length > 0) {
			const selected = findDeptInTree(treeData, selectedKeys[0]);
			setSelectedDept(selected);
			setIsEdit(true);
			if (selected) {
				deptForm.reset({
					deptName: selected.deptName,
					parentId: selected.parentId,
					leader: selected.leader,
					leaderPhone: selected.leaderPhone,
					sort: selected.sort,
					status: selected.status,
				});
			}
		} else {
			setSelectedDept(null);
			setIsEdit(false);
		}
	};

	const findDeptInTree = (treeNodes: DeptTreeNode[], id: string): SystemDept | null => {
		for (const node of treeNodes) {
			if (node.key === id) {
				return node.deptData;
			}
			if (node.children && node.children.length > 0) {
				const found = findDeptInTree(node.children, id);
				if (found) return found;
			}
		}
		return null;
	};

	const onCreateParent = () => {
		setEditingDept(null);
		setIsEdit(false);
		setIsCreatingChild(false);
		deptForm.reset({
			deptName: "",
			parentId: "0",
			leader: "",
			leaderPhone: "",
			sort: 0,
			status: "0",
		});
		setDialogOpen(true);
	};

	const onCreateChild = () => {
		if (!selectedDept) {
			toast.warning(t('system.dept.selectDeptFirst'));
			return;
		}
		setEditingDept(null);
		setIsEdit(false);
		setIsCreatingChild(true);
		deptForm.reset({
			deptName: "",
			parentId: selectedDept.id,
			leader: "",
			leaderPhone: "",
			sort: 0,
			status: "0",
		});
		setDialogOpen(true);
	};

	const onEdit = () => {
		if (!selectedDept) {
			toast.warning(t('system.dept.selectEditDeptFirst'));
			return;
		}
		setEditingDept(selectedDept);
		setIsEdit(true);
		const options = convertDeptToSelectOptions(deptList, selectedDept.id);
		setParentDeptOptions(options);
		deptForm.reset({
			deptName: selectedDept.deptName,
			parentId: selectedDept.parentId,
			leader: selectedDept.leader,
			leaderPhone: selectedDept.leaderPhone,
			sort: selectedDept.sort,
			status: selectedDept.status,
		});
		setDialogOpen(true);
	};

	const handleStartDetailEdit = () => {
		if (selectedDept) {
			setIsDetailEditing(true);
			const options = convertDeptToSelectOptions(deptList, selectedDept.id);
			setParentDeptOptions(options);
			deptForm.reset({
				deptName: selectedDept.deptName,
				parentId: selectedDept.parentId,
				leader: selectedDept.leader,
				leaderPhone: selectedDept.leaderPhone,
				sort: selectedDept.sort,
				status: selectedDept.status,
			});
		}
	};

	const handleCancelDetailEdit = () => {
		setIsDetailEditing(false);
		const options = convertDeptToSelectOptions(deptList);
		setParentDeptOptions(options);
		if (selectedDept) {
			deptForm.reset({
				deptName: selectedDept.deptName,
				parentId: selectedDept.parentId,
				leader: selectedDept.leader,
				leaderPhone: selectedDept.leaderPhone,
				sort: selectedDept.sort,
				status: selectedDept.status,
			});
		}
	};

	const handleSaveDetailEdit = async () => {
		if (!selectedDept) return;

		try {
			setLoading(true);
			const formData = deptForm.getValues();
			const deptData: SystemDept = {
				id: selectedDept.id,
				...formData,
			};
			await updateDept(deptData);
			toast.success(t('system.dept.editSuccess'));

			setSelectedDept(deptData);

			loadDepts();

			const options = convertDeptToSelectOptions(deptList);
			setParentDeptOptions(options);

			setIsDetailEditing(false);
		} catch (error) {
			console.error("Failed to save department:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeptSubmit = async (data: DeptFormData) => {
		try {
			setLoading(true);

			if (isEdit) {
				if (!selectedDept) return;
				const deptData: SystemDept = {
					id: selectedDept.id,
					...data,
				};
				await updateDept(deptData);
				toast.success(t('system.dept.editSuccess'));
			} else {
				const deptData: SystemDept = {
					id: null,
					...data,
				};
				await addDept(deptData);
				toast.success(t('system.dept.addSuccess'));
				setDialogOpen(false);
				setIsCreatingChild(false);
			}

			loadDepts();
		} catch (error) {
			console.error("Failed to save department:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = () => {
		if (!selectedDept) {
			toast.warning(t('system.dept.selectDeleteDeptFirst'));
			return;
		}

		if (window.confirm(t('system.dept.deleteConfirmMsg'))) {
			deleteDept(selectedDept.id!).then(() => {
				toast.success(t('system.dept.deleteDeptSuccess'));
				setSelectedDept(null);
				loadDepts();
			});
		}
	};

	useEffect(() => {
		loadDepts();
	}, []);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('system.dept.title')}</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
						<Card className="lg:col-span-1">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>{t('system.dept.deptStructure')}</div>
									<div className="flex gap-2">
										<Button onClick={onCreateParent} size="sm">
											<Icon icon="solar:add-circle-bold-duotone" size={16} className="mr-1" />
											{t('system.dept.newTopDept')}
										</Button>
										<Button onClick={onCreateChild} variant="outline" size="sm">
											<Icon icon="solar:add-circle-bold-duotone" size={16} className="mr-1" />
											{t('system.dept.newSubDept')}
										</Button>
										<Button
											onClick={handleDelete}
											variant="outline"
											size="sm"
											disabled={!selectedDept}
											className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
										>
											<Icon icon="mingcute:delete-2-fill" size={16} className="mr-1" />
											{t('system.dept.deleteDept')}
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<Tree
									treeData={treeData}
									onSelect={handleSelect}
									expandedKeys={expandedKeys}
									onExpand={setExpandedKeys}
									showLine
									showIcon
									loading={loading}
									style={{ minHeight: '400px' }}
									selectedKeys={selectedDept ? [selectedDept.id] : []}
								/>
							</CardContent>
						</Card>

						<Card className="lg:col-span-2">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>{t('system.dept.deptDetail')}</div>
									<div className="flex items-center gap-2">
										{selectedDept && (
											<>
												{!isDetailEditing ? (
													<Button
														onClick={handleStartDetailEdit}
														variant="outline"
														size="sm"
													>
														<Icon icon="lucide:edit" size={16} className="mr-1" />
														{t('system.dept.editDept')}
													</Button>
												) : (
													<>
														<Button
															onClick={handleCancelDetailEdit}
															variant="outline"
															size="sm"
															disabled={loading}
														>
															<Icon icon="lucide:x" size={16} className="mr-1" />
															{t('system.dept.cancelEdit')}
														</Button>
														<Button
															onClick={handleSaveDetailEdit}
															variant="outline"
															size="sm"
															disabled={loading}
															className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
														>
															<Icon icon="lucide:save" size={16} className="mr-1" />
															{loading ? t('system.dept.saving') : t('system.dept.save')}
														</Button>
													</>
												)}
												<Button
													onClick={handleDelete}
													variant="outline"
													size="sm"
													disabled={!selectedDept || isDetailEditing}
													className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
												>
													<Icon icon="mingcute:delete-2-fill" size={16} className="mr-1" />
													{t('system.dept.deleteDept')}
												</Button>
											</>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{selectedDept ? (
									<Form {...deptForm}>
										<form onSubmit={isDetailEditing ? deptForm.handleSubmit(handleSaveDetailEdit) : deptForm.handleSubmit(handleDeptSubmit)} className="space-y-6">
											<FormField
												control={deptForm.control}
												name="parentId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t('system.dept.parentDept')}</FormLabel>
														<FormControl>
															<Select
																value={field.value}
																onValueChange={field.onChange}
																disabled={!isDetailEditing}
															>
																<SelectTrigger className={!isDetailEditing ? "bg-gray-50" : ""}>
																	<SelectValue placeholder={t('system.dept.pleaseSelectParentDept')} />
																</SelectTrigger>
																<SelectContent>
																	{parentDeptOptions.map((option) => (
																		<SelectItem key={option.value} value={option.value}>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={deptForm.control}
												name="deptName"
												rules={{ required: t('system.dept.pleaseInputDeptName') }}
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t('system.dept.name')}</FormLabel>
														<FormControl>
															<Input
																placeholder={t('system.dept.pleaseInputDeptName')}
																{...field}
																disabled={!isDetailEditing}
																className={!isDetailEditing ? "bg-gray-50" : ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={deptForm.control}
													name="leader"
													render={({ field }) => (
														<FormItem>
															<FormLabel>{t('system.dept.leader')}</FormLabel>
															<FormControl>
																<Input
																	placeholder={t('system.dept.pleaseInputLeader')}
																	{...field}
																	disabled={!isDetailEditing}
																	className={!isDetailEditing ? "bg-gray-50" : ""}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
														control={deptForm.control}
													name="leaderPhone"
													rules={{
														validate: (value) => {
															if (!value) return true;
															if (!validatePhone(value)) {
																return t('system.dept.phoneFormatError');
															}
															return true;
														}
													}}
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.dept.leaderPhone')}</FormLabel>
																<FormControl>
																	<Input
																		placeholder={t('system.dept.pleaseInputPhone')}
																		{...field}
																		type="tel"
																		disabled={!isDetailEditing}
																		className={!isDetailEditing ? "bg-gray-50" : ""}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={deptForm.control}
													name="sort"
													render={({ field }) => (
														<FormItem>
															<FormLabel>{t('system.dept.sortLabel')}</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	placeholder={t('system.dept.pleaseInputSort')}
																	{...field}
																	onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
																	disabled={!isDetailEditing}
																	className={!isDetailEditing ? "bg-gray-50" : ""}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={deptForm.control}
													name="status"
													render={({ field }) => (
														<FormItem>
															<FormLabel>{t('system.dept.status')}</FormLabel>
															<FormControl>
																<RadioGroup
																	value={field.value}
																	onValueChange={field.onChange}
																	disabled={!isDetailEditing}
																>
																	<div className="flex items-center space-x-2">
																		<RadioGroupItem value="0" id="detail-status-normal" disabled={!isDetailEditing} />
																		<Label htmlFor="detail-status-normal">{t('system.dept.normal')}</Label>
																	</div>
																	<div className="flex items-center space-x-2">
																		<RadioGroupItem value="1" id="detail-status-disabled" disabled={!isDetailEditing} />
																		<Label htmlFor="detail-status-disabled">{t('system.dept.disabled')}</Label>
																	</div>
																</RadioGroup>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="flex justify-end space-x-2">
												<Button
													type="button"
													variant="outline"
													onClick={() => setSelectedDept(null)}
												>
													{t('system.dept.cancel')}
												</Button>
												<Button type="submit" disabled={loading}>
													{loading ? t('system.dept.saving') : t('system.dept.save')}
												</Button>
											</div>
										</form>
									</Form>
								) : (
									<div className="text-center text-gray-500 py-8">
										{t('system.dept.selectDeptToEdit')}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>

			{/* Department Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={(open) => {
				if (!open) {
					setIsCreatingChild(false);
					setIsEdit(false);
					const options = convertDeptToSelectOptions(deptList);
					setParentDeptOptions(options);
				}
				setDialogOpen(open);
			}}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
						{isEdit ? t('system.dept.edit') : (isCreatingChild ? t('system.dept.addSub') : t('system.dept.add'))}
					</DialogTitle>
					</DialogHeader>
					<Form {...deptForm}>
						<form onSubmit={deptForm.handleSubmit(handleDeptSubmit)} className="space-y-6">
							{!isEdit && isCreatingChild && (
								<FormField
									control={deptForm.control}
									name="parentId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.dept.parentDept')}</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
													disabled={true}
												>
													<SelectTrigger className="bg-gray-50">
														<SelectValue placeholder={t('system.dept.pleaseSelectParentDept')} />
													</SelectTrigger>
													<SelectContent>
														{parentDeptOptions.map((option) => (
															<SelectItem key={option.value} value={option.value}>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{isEdit && (
								<FormField
									control={deptForm.control}
									name="parentId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.dept.parentDept')}</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger>
														<SelectValue placeholder={t('system.dept.pleaseSelectParentDept')} />
													</SelectTrigger>
													<SelectContent>
														{parentDeptOptions.map((option) => (
															<SelectItem key={option.value} value={option.value}>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={deptForm.control}
								name="deptName"
								rules={{ required: t('system.dept.pleaseInputDeptName') }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.dept.name')}</FormLabel>
										<FormControl>
											<Input placeholder={t('system.dept.pleaseInputDeptName')} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={deptForm.control}
									name="leader"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.dept.leader')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.dept.pleaseInputLeader')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={deptForm.control}
									name="leaderPhone"
									rules={{
										validate: (value) => {
											if (!value) return true;
											if (!validatePhone(value)) {
												return t('system.dept.phoneFormatError');
											}
											return true;
										}
									}}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.dept.leaderPhone')}</FormLabel>
											<FormControl>
												<Input
													placeholder={t('system.dept.pleaseInputPhone')}
													{...field}
													type="tel"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={deptForm.control}
									name="sort"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.dept.sortLabel')}</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder={t('system.dept.pleaseInputSort')}
													{...field}
													onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={deptForm.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.dept.status')}</FormLabel>
											<FormControl>
												<RadioGroup value={field.value} onValueChange={field.onChange}>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="0" id="status-normal" />
														<Label htmlFor="status-normal">{t('system.dept.normal')}</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="1" id="status-disabled" />
														<Label htmlFor="status-disabled">{t('system.dept.disabled')}</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={() => {
								setDialogOpen(false);
								setIsCreatingChild(false);
								setIsEdit(false);
								const options = convertDeptToSelectOptions(deptList);
								setParentDeptOptions(options);
							}}>
									{t('system.dept.cancel')}
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? t('system.dept.saving') : (isEdit ? t('system.dept.update') : t('system.dept.add'))}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
}
