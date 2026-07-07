import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import Table, { type ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
	queryConfig, 
	deleteConfig, 
	setMasterConfig, 
	testConfig,
	type SystemFileConfig, 
	type ConfigQueryParams 
} from "@/api/services/systemFileConfigService";
import { ConfigModal } from "./config-modal";

interface SearchFormData {
	name: string;
	storage: "all" | string;
}

export default function ConfigPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [configList, setConfigList] = useState<SystemFileConfig[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [configModalProps, setConfigModalProps] = useState({
		title: t('oss.config.pageHeader'),
		show: false,
		isEdit: false,
		isDetail: false,
		config: null as SystemFileConfig | null,
		onOk: () => {},
		onCancel: () => {},
	});

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			name: "",
			storage: "all",
		},
	});

	const loadConfigs = async (params?: Partial<ConfigQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: ConfigQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await queryConfig(queryParams);
			setConfigList(response.records || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load configs:", error);
			toast.error(t('oss.config.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (values: SearchFormData) => {
		const searchParams = {
			...values,
			storage: values.storage === "all" ? undefined : Number(values.storage),
		};
		setCurrentPage(1);
		loadConfigs(searchParams);
	};

	const handleReset = () => {
		searchForm.reset({
			name: "",
			storage: "all",
		});
		setCurrentPage(1);
		loadConfigs({});
	};

	const handleAdd = () => {
		setConfigModalProps({
			title: t('oss.config.addConfig'),
			show: true,
			isEdit: false,
			isDetail: false,
			config: null,
			onOk: () => {
				handleRefresh();
				setConfigModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setConfigModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const handleEdit = (record: SystemFileConfig) => {
		setConfigModalProps({
			title: t('oss.config.editConfig'),
			show: true,
			isEdit: true,
			isDetail: false,
			config: record,
			onOk: () => {
				handleRefresh();
				setConfigModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setConfigModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const handleDetail = (record: SystemFileConfig) => {
		setConfigModalProps({
			title: t('oss.config.configDetail'),
			show: true,
			isEdit: false,
			isDetail: true,
			config: record,
			onOk: () => {
				handleRefresh();
			},
			onCancel: () => {
				setConfigModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const handleRefresh = () => {
		loadConfigs();
	};

	const handleDelete = async (record: SystemFileConfig) => {
		if (window.confirm(t('oss.config.deleteConfirmMsg'))) {
			try {
				await deleteConfig(record.id);
				toast.success(t('oss.config.deleteSuccess'));
				loadConfigs();
			} catch (error) {
				console.error("Failed to delete config:", error);
				toast.error(t('oss.config.deleteFailed'));
			}
		}
	};

	const handleSetMaster = async (record: SystemFileConfig) => {
		if (window.confirm(t('oss.config.setMasterConfirm'))) {
			try {
				await setMasterConfig(record.id);
				toast.success(t('oss.config.setMasterSuccess'));
				loadConfigs();
			} catch (error) {
				console.error("Failed to set master config:", error);
				toast.error(t('oss.config.setMasterFailed'));
			}
		}
	};

	const handleTest = async (record: SystemFileConfig) => {
		try {
			await testConfig(record.id);
			toast.success(t('oss.config.testSuccess'));
		} catch (error) {
			console.error("Failed to test config:", error);
			toast.error(t('oss.config.testFailed'));
		}
	};

	// 获取存储器显示文本
	const getStorageDisplay = (storage: number) => {
		switch (storage) {
			case 10:
				return t('oss.config.localDisk');
			case 11:
				return t('oss.config.ftpServer');
			case 12:
				return t('oss.config.sftpServer');
			case 20:
				return t('oss.config.s3Storage');
			case 30:
				return t('oss.config.hdfsStorage');
			default:
				return t('oss.config.unknown');
		}
	};

	// 获取存储器标签颜色
	const getStorageColor = (storage: number) => {
		switch (storage) {
			case 10:
				return "bg-blue-500";
			case 11:
				return "bg-green-500";
			case 12:
				return "bg-purple-500";
			case 20:
				return "bg-orange-500";
			case 30:
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	const columns: ColumnsType<SystemFileConfig> = [
		{
			title: t('oss.config.configId'),
			dataIndex: "id",
			width: 100,
		},
		{
			title: t('oss.config.name'),
			dataIndex: "name",
			width: 180,
		},
		{
			title: t('oss.config.storageLabel'),
			dataIndex: "storage",
			width: 150,
			render: (storage: number) => (
				<Badge variant="secondary" className="flex items-center gap-1 w-fit">
					<div className={`w-2 h-2 rounded-full ${getStorageColor(storage)}`} />
					{getStorageDisplay(storage)}
				</Badge>
			),
		},
		{
			title: t('oss.config.domain'),
			dataIndex: "config",
			width: 350,
			ellipsis: true,
			render: (config: any) => config?.domain || "-",
		},
		{
			title: t('oss.config.isMaster'),
			dataIndex: "master",
			width: 120,
			render: (master: boolean) => (
				<Badge
					variant={master ? "default" : "secondary"}
					className="flex items-center gap-1 w-fit dark:bg-white dark:text-black"
				>
					<div className={`w-2 h-2 rounded-full ${master ? "bg-green-500" : "bg-gray-500"}`} />
					{master ? t('oss.config.yes') : t('oss.config.no')}
				</Badge>
			),
		},
		{
			title: t('oss.config.remark'),
			dataIndex: "remark",
			width: 200,
			ellipsis: true,
		},
		{
			title: t('oss.config.createdAt'),
			dataIndex: "createTime",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('oss.config.updatedAt'),
			dataIndex: "updateTime",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('oss.config.actions'),
			key: "operation",
			align: "center",
			width: 200,
			fixed: "right",
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleEdit(record)}
						title={t('oss.config.edit')}
					>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleDelete(record)}
						title={t('oss.config.delete')}
						className="text-red-500 hover:text-red-700"
					>
						<Icon icon="solar:trash-bin-trash-bold-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleTest(record)}
						title={t('oss.config.test')}
					>
						<Icon icon="solar:check-circle-bold-duotone" size={18} />
					</Button>
					{!record.master && (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleSetMaster(record)}
							title={t('oss.config.setMaster')}
						>
							<Icon icon="solar:star-bold-duotone" size={18} />
						</Button>
					)}
				</div>
			),
		},
	];

	useEffect(() => {
		loadConfigs();
	}, [currentPage, pageSize]);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('oss.config.pageHeader')}</div>
						<Button onClick={handleAdd}>
							<Icon icon="solar:add-circle-bold-duotone" size={18} className="mr-2" />
							{t('oss.config.add')}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...searchForm}>
						<form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
							<div className="flex gap-4 items-end">
								<FormField
									control={searchForm.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('oss.config.name')}</FormLabel>
											<FormControl>
												<Input placeholder={t('oss.config.namePlaceholder')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="storage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('oss.config.storageLabel')}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t('oss.config.storagePlaceholder')} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="all">{t('oss.config.all')}</SelectItem>
													<SelectItem value="10">{t('oss.config.localDisk')}</SelectItem>
													<SelectItem value="11">{t('oss.config.ftpServer')}</SelectItem>
													<SelectItem value="12">{t('oss.config.sftpServer')}</SelectItem>
													<SelectItem value="20">{t('oss.config.s3Storage')}</SelectItem>
													<SelectItem value="30">{t('oss.config.hdfsStorage')}</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('oss.config.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('oss.config.reset')}
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
							showTotal: (total, range) => t('pagination', { start: range[0], end: range[1], total }),
							onChange: (page, size) => {
								setCurrentPage(page);
								setPageSize(size || 10);
							},
						}}
						loading={loading}
						columns={columns}
						dataSource={configList}
					/>
				</CardContent>
			</Card>

			{/* 配置编辑弹出框 */}
			<ConfigModal {...configModalProps} />
		</>
	);
}
