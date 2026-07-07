import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Tree } from "antd";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { queryMenu, deleteMenu, addMenu, updateMenu, type SystemMenu } from "@/api/services/systemMenuService";
import { type PermissionModalProps } from "./permission-modal";
import "@/utils/menu-tree-fix";
import { useTranslation } from "react-i18next";
import type { Permission_Old } from "#/entity";
import { BasicStatus, PermissionType } from "#/enum";

// Icon options
const iconOptions = [
	{ value: "ic-search", label: "ic-search", icon: "ic-search" },
	{ value: "ic-menu", label: "ic-menu", icon: "ic-menu" },
	{ value: "ic-label", label: "ic-label", icon: "ic-label" },
	{ value: "ic-code", label: "ic-code", icon: "ic-code" },
	{ value: "carbon:home", label: "carbon:home", icon: "carbon:home" },
	{ value: "carbon:user", label: "carbon:user", icon: "carbon:user" },
	{ value: "carbon:settings", label: "carbon:settings", icon: "carbon:settings" },
	{ value: "carbon:document", label: "carbon:document", icon: "carbon:document" },
	{ value: "carbon:folder", label: "carbon:folder", icon: "carbon:folder" },
	{ value: "carbon:dashboard", label: "carbon:dashboard", icon: "carbon:dashboard" },
	{ value: "carbon:analytics", label: "carbon:analytics", icon: "carbon:analytics" },
	{ value: "carbon:notification", label: "carbon:notification", icon: "carbon:notification" },
	{ value: "carbon:security", label: "carbon:security", icon: "carbon:security" },
	{ value: "carbon:api", label: "carbon:api", icon: "carbon:api" },
	{ value: "carbon:cloud", label: "carbon:cloud", icon: "carbon:cloud" },
	{ value: "carbon:calendar", label: "carbon:calendar", icon: "carbon:calendar" },
	{ value: "carbon:email", label: "carbon:email", icon: "carbon:email" },
	{ value: "carbon:phone", label: "carbon:phone", icon: "carbon:phone" },
	{ value: "carbon:location", label: "carbon:location", icon: "carbon:location" },
	{ value: "carbon:time", label: "carbon:time", icon: "carbon:time" },
	{ value: "carbon:download", label: "carbon:download", icon: "carbon:download" },
	{ value: "carbon:upload", label: "carbon:upload", icon: "carbon:upload" },
	{ value: "mdi:home", label: "mdi:home", icon: "mdi:home" },
	{ value: "mdi:account", label: "mdi:account", icon: "mdi:account" },
	{ value: "mdi:cog", label: "mdi:cog", icon: "mdi:cog" },
	{ value: "mdi:file", label: "mdi:file", icon: "mdi:file" },
	{ value: "mdi:folder", label: "mdi:folder", icon: "mdi:folder" },
	{ value: "mdi:chart-line", label: "mdi:chart-line", icon: "mdi:chart-line" },
	{ value: "mdi:bell", label: "mdi:bell", icon: "mdi:bell" },
	{ value: "mdi:shield", label: "mdi:shield", icon: "mdi:shield" },
	{ value: "mdi:database", label: "mdi:database", icon: "mdi:database" },
	{ value: "mdi:cloud", label: "mdi:cloud", icon: "mdi:cloud" },
	{ value: "mdi:server", label: "mdi:server", icon: "mdi:server" },
	{ value: "mdi:network", label: "mdi:network", icon: "mdi:network" },
	{ value: "mdi:pencil", label: "mdi:pencil", icon: "mdi:pencil" },
	{ value: "mdi:delete", label: "mdi:delete", icon: "mdi:delete" },
	{ value: "mdi:plus", label: "mdi:plus", icon: "mdi:plus" },
	{ value: "mdi:minus", label: "mdi:minus", icon: "mdi:minus" },
	{ value: "mdi:eye", label: "mdi:eye", icon: "mdi:eye" },
	{ value: "mdi:eye-off", label: "mdi:eye-off", icon: "mdi:eye-off" },
	{ value: "mdi:lock", label: "mdi:lock", icon: "mdi:lock" },
	{ value: "mdi:check", label: "mdi:check", icon: "mdi:check" },
	{ value: "mdi:close", label: "mdi:close", icon: "mdi:close" },
	{ value: "mdi:arrow-left", label: "mdi:arrow-left", icon: "mdi:arrow-left" },
	{ value: "mdi:arrow-right", label: "mdi:arrow-right", icon: "mdi:arrow-right" },
	{ value: "mdi:arrow-up", label: "mdi:arrow-up", icon: "mdi:arrow-up" },
	{ value: "mdi:arrow-down", label: "mdi:arrow-down", icon: "mdi:arrow-down" },
	{ value: "mdi:refresh", label: "mdi:refresh", icon: "mdi:refresh" },
	{ value: "mdi:content-copy", label: "mdi:content-copy", icon: "mdi:content-copy" },
	{ value: "mdi:content-cut", label: "mdi:content-cut", icon: "mdi:content-cut" },
	{ value: "mdi:content-paste", label: "mdi:content-paste", icon: "mdi:content-paste" },
	{ value: "mdi:download", label: "mdi:download", icon: "mdi:download" },
	{ value: "mdi:upload", label: "mdi:upload", icon: "mdi:upload" },
	{ value: "mdi:calendar", label: "mdi:calendar", icon: "mdi:calendar" },
	{ value: "mdi:email", label: "mdi:email", icon: "mdi:email" },
	{ value: "mdi:phone", label: "mdi:phone", icon: "mdi:phone" },
	{ value: "mdi:map-marker", label: "mdi:map-marker", icon: "mdi:map-marker" },
	{ value: "mdi:clock", label: "mdi:clock", icon: "mdi:clock" },
	{ value: "solar:home-smile-bold", label: "solar:home-smile-bold", icon: "solar:home-smile-bold" },
	{ value: "solar:user-circle-bold", label: "solar:user-circle-bold", icon: "solar:user-circle-bold" },
	{ value: "solar:settings-bold", label: "solar:settings-bold", icon: "solar:settings-bold" },
	{ value: "solar:file-text-bold", label: "solar:file-text-bold", icon: "solar:file-text-bold" },
	{ value: "solar:folder-bold", label: "solar:folder-bold", icon: "solar:folder-bold" },
	{ value: "solar:chart-square-bold", label: "solar:chart-square-bold", icon: "solar:chart-square-bold" },
	{ value: "solar:bell-bold", label: "solar:bell-bold", icon: "solar:bell-bold" },
	{ value: "solar:shield-bold", label: "solar:shield-bold", icon: "solar:shield-bold" },
	{ value: "solar:database-bold", label: "solar:database-bold", icon: "solar:database-bold" },
	{ value: "solar:cloud-bold", label: "solar:cloud-bold", icon: "solar:cloud-bold" },
	{ value: "solar:server-bold", label: "solar:server-bold", icon: "solar:server-bold" },
	{ value: "solar:global-bold", label: "solar:global-bold", icon: "solar:global-bold" },
	{ value: "solar:pen-new-square-bold", label: "solar:pen-new-square-bold", icon: "solar:pen-new-square-bold" },
	{ value: "solar:trash-bin-trash-bold", label: "solar:trash-bin-trash-bold", icon: "solar:trash-bin-trash-bold" },
	{ value: "solar:add-circle-bold", label: "solar:add-circle-bold", icon: "solar:add-circle-bold" },
	{ value: "solar:eye-bold", label: "solar:eye-bold", icon: "solar:eye-bold" },
	{ value: "solar:eye-closed-bold", label: "solar:eye-closed-bold", icon: "solar:eye-closed-bold" },
	{ value: "solar:lock-bold", label: "solar:lock-bold", icon: "solar:lock-bold" },
	{ value: "solar:check-circle-bold", label: "solar:check-circle-bold", icon: "solar:check-circle-bold" },
	{ value: "solar:close-circle-bold", label: "solar:close-circle-bold", icon: "solar:close-circle-bold" },
	{ value: "solar:arrow-left-bold", label: "solar:arrow-left-bold", icon: "solar:arrow-left-bold" },
	{ value: "solar:arrow-right-bold", label: "solar:arrow-right-bold", icon: "solar:arrow-right-bold" },
	{ value: "solar:arrow-up-bold", label: "solar:arrow-up-bold", icon: "solar:arrow-up-bold" },
	{ value: "solar:arrow-down-bold", label: "solar:arrow-down-bold", icon: "solar:arrow-down-bold" },
	{ value: "solar:refresh-bold", label: "solar:refresh-bold", icon: "solar:refresh-bold" },
	{ value: "solar:copy-bold", label: "solar:copy-bold", icon: "solar:copy-bold" },
	{ value: "solar:clipboard-bold", label: "solar:clipboard-bold", icon: "solar:clipboard-bold" },
	{ value: "solar:download-bold", label: "solar:download-bold", icon: "solar:download-bold" },
	{ value: "solar:upload-bold", label: "solar:upload-bold", icon: "solar:upload-bold" },
	{ value: "solar:calendar-bold", label: "solar:calendar-bold", icon: "solar:calendar-bold" },
	{ value: "solar:letter-bold", label: "solar:letter-bold", icon: "solar:letter-bold" },
	{ value: "solar:phone-bold", label: "solar:phone-bold", icon: "solar:phone-bold" },
	{ value: "solar:map-point-bold", label: "solar:map-point-bold", icon: "solar:map-point-bold" },
	{ value: "solar:clock-circle-bold", label: "solar:clock-circle-bold", icon: "solar:clock-circle-bold" },
];

const convertToSelectOptions = (menus: SystemMenu[], excludeId?: string, lang?: string): Array<{ value: string; label: string; disabled?: boolean }> => {
	const options: Array<{ value: string; label: string; disabled?: boolean }> = [];

	const traverse = (items: SystemMenu[], level = 0) => {
		items.forEach(item => {
			const prefix = '　'.repeat(level);
			if (excludeId && (item.id === excludeId || isDescendant(item, excludeId))) {
				return;
			}
			const displayName = lang === "en_US" && item.enName ? item.enName : item.name;
			options.push({
				value: item.id,
				label: `${prefix}${displayName}`,
				disabled: false
			});
			if (item.children && item.children.length > 0) {
				traverse(item.children, level + 1);
			}
		});
	};

	traverse(menus);
	options.unshift({ value: "0", label: "topMenu", disabled: false });

	return options;
};

const isDescendant = (menu: SystemMenu, ancestorId: string): boolean => {
	if (!menu.children || menu.children.length === 0) {
		return false;
	}

	for (const child of menu.children) {
		if (child.id === ancestorId) {
			return true;
		}
		if (isDescendant(child, ancestorId)) {
			return true;
		}
	}

	return false;
};

interface MenuFormData {
	name: string;
	enName: string;
	permission: string;
	path: string;
	redirect: string;
	parentId: string;
	icon: string;
	component: string;
	sort: number;
	type: string;
	outerStatus: string;
}

const defaultPermissionValue: Permission_Old = {
	id: "",
	parentId: "",
	name: "",
	label: "",
	route: "",
	component: "",
	icon: "",
	hide: false,
	status: BasicStatus.ENABLE,
	type: PermissionType.CATALOGUE,
};

const defaultMenuValue: SystemMenu = {
	id: null,
	parentId: null,
	weight: 0,
	name: "",
	redirect: null,
	path: "",
	component: "",
	createTime: "",
	meta: {
		title: "",
		icon: "",
		order: 0,
	},
	icon: "",
	applicationKey: null,
	permission: "",
	sort: 0,
	type: "0",
};

interface MenuTreeNode {
	key: string;
	title: string;
	children: MenuTreeNode[];
	menuData: SystemMenu;
}

const convertToTreeNode = (menu: SystemMenu, lang?: string): MenuTreeNode => {
	const displayName = lang === "en_US" && menu.enName ? menu.enName : menu.name;
	return {
		key: menu.id,
		title: displayName,
		children: menu.children ? menu.children.map((child) => convertToTreeNode(child, lang)) : [],
		menuData: menu,
	};
};

export default function PermissionPage() {
	const { t, i18n } = useTranslation();
	const lang = i18n.language;
	const [loading, setLoading] = useState(false);
	const [menuList, setMenuList] = useState<SystemMenu[]>([]);
	const [treeData, setTreeData] = useState<MenuTreeNode[]>([]);
	const [selectedMenu, setSelectedMenu] = useState<SystemMenu | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingMenu, setEditingMenu] = useState<SystemMenu | null>(null);
	const [isEdit, setIsEdit] = useState(false);
	const [isCreatingChild, setIsCreatingChild] = useState(false);
	const [parentMenuOptions, setParentMenuOptions] = useState<Array<{ value: string; label: string; disabled?: boolean }>>([]);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [isDetailEditing, setIsDetailEditing] = useState(false);

	const [permissionModalProps, setPermissionModalProps] = useState<PermissionModalProps>({
		formValue: { ...defaultPermissionValue },
		title: "New",
		show: false,
		onOk: () => {
			setPermissionModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setPermissionModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const menuForm = useForm<MenuFormData>({
		defaultValues: {
			name: "",
			enName: "",
			permission: "",
			path: "",
			redirect: "",
			parentId: "",
			icon: "",
			component: "",
			sort: 0,
			type: "0",
			outerStatus: "0",
		},
	});

	const getParentMenuName = (parentId: string): string => {
		if (!parentId || parentId === "0") {
			return t('system.permission.topMenu');
		}

		const findMenuName = (menus: SystemMenu[], id: string): string => {
			for (const menu of menus) {
				if (menu.id === id) {
					return lang === "en_US" && menu.enName ? menu.enName : menu.name;
				}
				if (menu.children && menu.children.length > 0) {
					const found = findMenuName(menu.children, id);
					if (found) return found;
				}
			}
			return "";
		};

		const name = findMenuName(menuList, parentId);
		return name || parentId;
	};

	const outerStatus = menuForm.watch("outerStatus");

	const handleStartDetailEdit = () => {
		if (selectedMenu) {
			setIsDetailEditing(true);
			menuForm.reset({
				name: selectedMenu.name || "",
				enName: selectedMenu.enName || "",
				permission: selectedMenu.permission || "",
				path: selectedMenu.path || "",
				redirect: selectedMenu.redirect || "",
				parentId: selectedMenu.parentId || "0",
				icon: selectedMenu.icon || "",
				component: selectedMenu.component || "",
				sort: selectedMenu.sort || 0,
				type: selectedMenu.type || "0",
				outerStatus: selectedMenu.outerStatus || "0",
			});

			const options = convertToSelectOptions(menuList, selectedMenu.id, lang);
			setParentMenuOptions(options);
		}
	};

	const handleCancelDetailEdit = () => {
		setIsDetailEditing(false);
		if (selectedMenu) {
			menuForm.reset({
				name: selectedMenu.name || "",
				enName: selectedMenu.enName || "",
				permission: selectedMenu.permission || "",
				path: selectedMenu.path || "",
				redirect: selectedMenu.redirect || "",
				parentId: selectedMenu.parentId || "0",
				icon: selectedMenu.icon || "",
				component: selectedMenu.component || "",
				sort: selectedMenu.sort || 0,
				type: selectedMenu.type || "0",
				outerStatus: selectedMenu.outerStatus || "0",
			});
		}

		const options = convertToSelectOptions(menuList, undefined, lang);
		setParentMenuOptions(options);
	};

	const handleSaveDetailEdit = async () => {
		if (!selectedMenu) return;

		try {
			setLoading(true);
			const formData = menuForm.getValues();
			const menuData: SystemMenu = {
				id: selectedMenu.id,
				name: formData.name,
				enName: formData.enName || undefined,
				permission: formData.permission,
				path: formData.path,
				redirect: formData.redirect || null,
				parentId: formData.parentId === "0" ? "0" : formData.parentId,
				icon: formData.icon,
				component: formData.component,
				sort: formData.sort,
				type: formData.type,
				weight: formData.sort,
				meta: {
					title: formData.name,
					enTitle: formData.enName || undefined,
					icon: formData.icon,
					order: formData.sort,
				},
				outerStatus: formData.outerStatus,
			};

			await updateMenu(menuData);
			toast.success(t('system.permission.editMenuSuccess'));

			setSelectedMenu(menuData);

			loadMenus();

			setIsDetailEditing(false);

			const options = convertToSelectOptions(menuList, undefined, lang);
			setParentMenuOptions(options);
		} catch (error) {
			console.error("Failed to save menu:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadMenus = async () => {
		setLoading(true);
		try {
			const response = await queryMenu();
			console.log("API response:", response);

			let menuData: SystemMenu[] = [];
			if (Array.isArray(response)) {
				menuData = response;
			} else if (response && typeof response === 'object' && 'data' in response) {
				menuData = (response as any).data || [];
			}

			console.log("Menu data:", menuData);
			setMenuList(menuData);

			const options = convertToSelectOptions(menuData, undefined, lang);
			setParentMenuOptions(options);

			if (menuData.length > 0) {
				const treeNodes = menuData.map((menu) => convertToTreeNode(menu, lang));
				console.log("Tree data:", treeNodes);
				setTreeData(treeNodes);

				setExpandedKeys([]);
			} else {
				setTreeData([]);
			}
		} catch (error) {
			console.error("Failed to load menus:", error);
			setTreeData([]);
		} finally {
			setLoading(false);
		}
	};

	const getAllKeysFromTree = (treeNodes: MenuTreeNode[]): string[] => {
		const keys: string[] = [];
		const traverse = (nodes: MenuTreeNode[]) => {
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

	const handleMenuSubmit = async (data: MenuFormData) => {
		try {
			setLoading(true);
			const menuData: SystemMenu = {
				id: isEdit ? editingMenu?.id : null,
				name: data.name,
				enName: data.enName || undefined,
				permission: data.permission,
				path: data.path,
				redirect: data.redirect || null,
				parentId: data.parentId === "0" ? "0" : data.parentId,
				icon: data.icon,
				component: data.component,
				sort: data.sort,
				type: data.type,
				weight: data.sort,
				meta: {
					title: data.name,
					enTitle: data.enName || undefined,
					icon: data.icon,
					order: data.sort,
				},
				outerStatus: data.outerStatus,
			};

			if (isEdit) {
				await updateMenu(menuData);
				toast.success(t('system.permission.editMenuSuccess'));
			} else {
				await addMenu(menuData);
				toast.success(t('system.permission.addMenuSuccess'));
			}

			setDialogOpen(false);
			loadMenus();
			if (!isEdit) {
				menuForm.reset({
					name: "",
					enName: "",
					permission: "",
					path: "",
					redirect: "",
					parentId: "",
					icon: "",
					component: "",
					sort: 0,
					type: "0",
					outerStatus: "0",
				});
			}
		} catch (error) {
			console.error("Failed to save menu:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSelectMenu = (selectedKeys: string[], info: any) => {
		if (isDetailEditing) {
			setIsDetailEditing(false);
			const options = convertToSelectOptions(menuList, undefined, lang);
			setParentMenuOptions(options);
		}

		if (selectedKeys.length > 0) {
			const selected = findMenuInTree(treeData, selectedKeys[0]);
			setSelectedMenu(selected);
			setIsEdit(true);
			setEditingMenu(selected);
			if (selected) {
				menuForm.reset({
					name: selected.name || "",
					enName: selected.enName || "",
					permission: selected.permission || "",
					path: selected.path || "",
					redirect: selected.redirect || "",
					parentId: selected.parentId || "0",
					icon: selected.icon || "",
					component: selected.component || "",
					sort: selected.sort || 0,
					type: selected.type || "0",
					outerStatus: selected.outerStatus || "0",
				});
			}
		} else {
			setSelectedMenu(null);
		}
	};

	const findMenuInTree = (treeNodes: MenuTreeNode[], id: string): SystemMenu | null => {
		for (const node of treeNodes) {
			if (node.key === id) {
				return node.menuData;
			}
			if (node.children && node.children.length > 0) {
				const found = findMenuInTree(node.children, id);
				if (found) return found;
			}
		}
		return null;
	};

	const handleCreateChildMenu = () => {
		setEditingMenu(null);
		setIsEdit(false);
		setIsCreatingChild(false);
		menuForm.reset({
			name: "",
			enName: "",
			permission: "",
			path: "",
			redirect: "",
			parentId: selectedMenu?.id || "",
			icon: "",
			component: "",
			sort: 0,
			type: "0",
			outerStatus: "0",
		});
		setDialogOpen(true);
	};

	const handleDeleteMenu = () => {
		if (!selectedMenu) {
			toast.error(t('system.permission.selectMenuFirst'));
			return;
		}
		if (window.confirm(t('system.permission.deleteMenuConfirm'))) {
			deleteMenu(selectedMenu.id!).then(() => {
				toast.success(t('system.permission.deleteMenuSuccess'));
				loadMenus();
				setSelectedMenu(null);
				menuForm.reset(defaultMenuValue);
			});
		}
	};

	useEffect(() => {
		loadMenus();
	}, []);

	const onEdit = (formValue: Permission_Old) => {
		setPermissionModalProps((prev) => ({
			...prev,
			show: true,
			title: "Edit",
			formValue,
		}));
	};

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('system.permission.menuManagement')}</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
						<Card className="lg:col-span-1">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>{t('system.permission.menuStructure')}</div>
									<div className="flex gap-2">
										<Button onClick={handleCreateChildMenu} variant="outline" size="sm">
											<Icon icon="gridicons:add-outline" size={16} className="mr-1" />
											{t('system.permission.newMenu')}
										</Button>
										<Button
											onClick={handleDeleteMenu}
											variant="outline"
											size="sm"
											disabled={!selectedMenu || isDetailEditing}
											className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
										>
											<Icon icon="mingcute:delete-2-fill" size={16} className="mr-1" />
											{t('system.permission.deleteMenu')}
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<Tree
									treeData={treeData}
									onSelect={handleSelectMenu}
									expandedKeys={expandedKeys}
									onExpand={setExpandedKeys}
									showLine
									showIcon
									loading={loading}
									style={{ minHeight: '400px' }}
									selectedKeys={selectedMenu ? [selectedMenu.id] : []}
								/>
							</CardContent>
						</Card>

						<Card className="lg:col-span-2">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>{t('system.permission.menuDetail')}</div>
									<div className="flex items-center gap-2">
										{selectedMenu && (
											<>
												{!isDetailEditing ? (
													<Button
														onClick={handleStartDetailEdit}
														variant="outline"
														size="sm"
													>
														<Icon icon="lucide:edit" size={16} className="mr-1" />
														{t('system.permission.edit')}
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
															{t('system.permission.cancel')}
														</Button>
														<Button
															onClick={handleSaveDetailEdit}
															variant="outline"
															size="sm"
															disabled={loading}
															className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
														>
															<Icon icon="lucide:save" size={16} className="mr-1" />
															{loading ? t('system.permission.saving') : t('system.permission.save')}
														</Button>
													</>
												)}
												<Button
													onClick={handleDeleteMenu}
													variant="outline"
													size="sm"
													disabled={isDetailEditing}
													className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
												>
													<Icon icon="mingcute:delete-2-fill" size={16} className="mr-1" />
													{t('system.permission.deleteMenu')}
												</Button>
											</>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{selectedMenu ? (
									<Form {...menuForm}>
										{isDetailEditing ? (
											<form onSubmit={menuForm.handleSubmit(handleSaveDetailEdit)} className="space-y-6">
												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={menuForm.control}
														name="name"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.menuName')}</FormLabel>
																<FormControl>
																	<Input placeholder={t('system.permission.pleaseInputMenuName')} {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
													<FormField
														control={menuForm.control}
														name="enName"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.enMenuName')}</FormLabel>
																<FormControl>
																	<Input placeholder={t('system.permission.pleaseInputEnMenuName')} {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={menuForm.control}
														name="permission"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.menuPermission')}</FormLabel>
																<FormControl>
																	<Input placeholder={t('system.permission.pleaseInputMenuPermission')} {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
													<FormField
														control={menuForm.control}
														name="path"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.menuPath')}</FormLabel>
																<FormControl>
																	<Input placeholder={t('system.permission.pleaseInputMenuPath')} {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={menuForm.control}
														name="parentId"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.parentMenu')}</FormLabel>
																<FormControl>
																	<Select onValueChange={field.onChange} value={field.value}>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder={t('system.permission.pleaseSelectParentMenu')} />
																		</SelectTrigger>
																		<SelectContent>
																			{parentMenuOptions.map((option) => (
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
														control={menuForm.control}
														name="icon"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.icon')}</FormLabel>
																<FormControl>
																	<Select onValueChange={field.onChange} value={field.value}>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder={t('system.permission.pleaseSelectIcon')} />
																		</SelectTrigger>
																		<SelectContent>
																			{iconOptions.map((option) => (
																				<SelectItem key={option.value} value={option.value}>
																					<div className="flex items-center space-x-2">
																						<Icon icon={option.icon} size={16} />
																						<span>{option.label}</span>
																					</div>
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={menuForm.control}
														name="component"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.componentPath')}</FormLabel>
																<FormControl>
																	<Input placeholder={t('system.permission.pleaseInputComponentPath')} {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>

													<FormField
														control={menuForm.control}
														name="sort"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.sort')}</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		placeholder={t('system.permission.pleaseInputSort')}
																		{...field}
																		onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={menuForm.control}
														name="type"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.menuType')}</FormLabel>
																<FormControl>
																	<RadioGroup value={field.value} onValueChange={field.onChange}>
																		<div className="flex items-center space-x-2">
																			<RadioGroupItem value="0" id="type-menu" />
																			<Label htmlFor="type-menu">{t('system.permission.menu')}</Label>
																		</div>
																		<div className="flex items-center space-x-2">
																			<RadioGroupItem value="1" id="type-button" />
																			<Label htmlFor="type-button">{t('system.permission.button')}</Label>
																		</div>
																		<div className="flex items-center space-x-2">
																			<RadioGroupItem value="2" id="type-hidden" />
																			<Label htmlFor="type-hidden">{t('system.permission.hiddenMenu')}</Label>
																		</div>
																	</RadioGroup>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>

													<FormField
														control={menuForm.control}
														name="outerStatus"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.outerLink')}</FormLabel>
																<FormControl>
																	<RadioGroup value={field.value} onValueChange={field.onChange}>
																		<div className="flex items-center space-x-2">
																			<RadioGroupItem value="0" id="outer-no" />
																			<Label htmlFor="outer-no">{t('system.permission.no')}</Label>
																		</div>
																		<div className="flex items-center space-x-2">
																			<RadioGroupItem value="1" id="outer-yes" />
																			<Label htmlFor="outer-yes">{t('system.permission.yes')}</Label>
																		</div>
																	</RadioGroup>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												{outerStatus === "1" && (
													<FormField
														control={menuForm.control}
														name="redirect"
														render={({ field }) => (
															<FormItem>
																<FormLabel>{t('system.permission.redirectUrl')}</FormLabel>
																<FormControl>
																	<Input placeholder={t('system.permission.pleaseInputRedirectUrl')} {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}
											</form>
										) : (
											<div className="space-y-6">
												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="text-sm font-medium">{t('system.permission.menuName')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.name || "-"}
														</div>
													</div>
													<div>
														<label className="text-sm font-medium">{t('system.permission.enMenuName')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.enName || "-"}
														</div>
													</div>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="text-sm font-medium">{t('system.permission.menuPermission')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.permission || "-"}
														</div>
													</div>
													<div>
														<label className="text-sm font-medium">{t('system.permission.menuPath')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.path || "-"}
														</div>
													</div>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="text-sm font-medium">{t('system.permission.parentMenu')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{getParentMenuName(selectedMenu.parentId || "")}
														</div>
													</div>
													<div>
														<label className="text-sm font-medium">{t('system.permission.icon')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border flex items-center space-x-2">
															{selectedMenu.icon ? (
																<>
																	<Icon icon={selectedMenu.icon} size={16} />
																	<span>{selectedMenu.icon}</span>
																</>
															) : "-"}
														</div>
													</div>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="text-sm font-medium">{t('system.permission.componentPath')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.component || "-"}
														</div>
													</div>
													<div>
														<label className="text-sm font-medium">{t('system.permission.sort')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.sort || 0}
														</div>
													</div>
												</div>

												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="text-sm font-medium">{t('system.permission.menuType')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.type === "0" ? t('system.permission.menu') :
															 selectedMenu.type === "1" ? t('system.permission.button') :
															 selectedMenu.type === "2" ? t('system.permission.hiddenMenu') : "-"}
														</div>
													</div>
													<div>
														<label className="text-sm font-medium">{t('system.permission.outerLink')}</label>
														<div className="mt-1 p-2 bg-gray-50 rounded border">
															{selectedMenu.outerStatus === "1" ? t('system.permission.yes') :
															 selectedMenu.outerStatus === "0" ? t('system.permission.no') : "-"}
														</div>
													</div>
												</div>
											</div>
										)}
									</Form>
								) : (
									<div className="text-center text-gray-500 py-8">
										{t('system.permission.selectMenuToEdit')}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={(open) => {
				if (!open) {
					setIsCreatingChild(false);
				}
				setDialogOpen(open);
			}}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{isEdit ? t('system.permission.edit') : t('system.permission.newMenu')}
						</DialogTitle>
					</DialogHeader>
					<Form {...menuForm}>
						<form onSubmit={menuForm.handleSubmit(handleMenuSubmit)} className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={menuForm.control}
									name="name"
									rules={{ required: t('system.permission.pleaseInputMenuName') }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.menuName')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.permission.pleaseInputMenuName')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={menuForm.control}
									name="enName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.enMenuName')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.permission.pleaseInputEnMenuName')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={menuForm.control}
									name="permission"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.menuPermission')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.permission.pleaseInputMenuPermission')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={menuForm.control}
									name="path"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.menuPath')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.permission.pleaseInputMenuPath')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={menuForm.control}
									name="parentId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.parentMenu')}</FormLabel>
											<FormControl>
												<Select onValueChange={field.onChange} value={field.value}>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t('system.permission.pleaseSelectParentMenu')} />
													</SelectTrigger>
													<SelectContent>
														{parentMenuOptions.map((option) => (
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
									control={menuForm.control}
									name="icon"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.icon')}</FormLabel>
											<FormControl>
												<Select onValueChange={field.onChange} value={field.value}>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t('system.permission.pleaseSelectIcon')} />
													</SelectTrigger>
													<SelectContent>
														{iconOptions.map((option) => (
															<SelectItem key={option.value} value={option.value}>
																<div className="flex items-center space-x-2">
																	<Icon icon={option.icon} size={16} />
																	<span>{option.label}</span>
																</div>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={menuForm.control}
									name="component"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.componentPath')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.permission.pleaseInputComponentPath')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={menuForm.control}
									name="sort"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.sort')}</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder={t('system.permission.pleaseInputSort')}
													{...field}
													onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={menuForm.control}
									name="type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.menuType')}</FormLabel>
											<FormControl>
												<RadioGroup value={field.value} onValueChange={field.onChange}>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="0" id="type-menu" />
														<Label htmlFor="type-menu">{t('system.permission.menu')}</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="1" id="type-button" />
														<Label htmlFor="type-button">{t('system.permission.button')}</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="2" id="type-hidden" />
														<Label htmlFor="type-hidden">{t('system.permission.hiddenMenu')}</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={menuForm.control}
									name="outerStatus"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.outerLink')}</FormLabel>
											<FormControl>
												<RadioGroup value={field.value} onValueChange={field.onChange}>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="0" id="outer-no" />
														<Label htmlFor="outer-no">{t('system.permission.no')}</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="1" id="outer-yes" />
														<Label htmlFor="outer-yes">{t('system.permission.yes')}</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{outerStatus === "1" && (
								<FormField
									control={menuForm.control}
									name="redirect"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('system.permission.redirectUrl')}</FormLabel>
											<FormControl>
												<Input placeholder={t('system.permission.pleaseInputRedirectUrl')} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<div className="flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={() => {
									setDialogOpen(false);
									setIsCreatingChild(false);
								}}>
									{t('system.permission.cancel')}
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? t('system.permission.saving') : (isEdit ? t('system.permission.update') : t('system.permission.add'))}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
}
