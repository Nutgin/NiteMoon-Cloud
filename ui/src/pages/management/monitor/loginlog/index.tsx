import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import Table, { type ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	queryLoginLog,
	type LoginLog,
	type LoginLogQueryParams
} from "@/api/services/systemLoginlogService";
import { LoginlogModal, type LoginlogModalProps } from "./loginlog-modal";

interface SearchFormData {
	userName: string;
}

export default function LoginlogPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [loginlogList, setLoginlogList] = useState<LoginLog[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [loginlogModalProps, setLoginlogModalProps] = useState<LoginlogModalProps>({
		formValue: {
			id: "",
			ipAddr: "",
			location: "",
			userName: "",
			status: "",
			msg: "",
			browser: "",
			os: "",
			createBy: "",
			createTime: "",
			delFlag: "",
			tenantId: "",
		},
		title: t('monitor.loginlog.detailTitle'),
		show: false,
		onOk: () => {
			setLoginlogModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setLoginlogModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			userName: "",
		},
	});

	const loadLoginlogs = async (params?: Partial<LoginLogQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: LoginLogQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await queryLoginLog(queryParams);
			setLoginlogList(response.records || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load login logs:", error);
			toast.error(t('monitor.loginlog.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (values: SearchFormData) => {
		setCurrentPage(1);
		loadLoginlogs(values);
	};

	const handleReset = () => {
		searchForm.reset();
		setCurrentPage(1);
		loadLoginlogs({});
	};

	const getSystemBadge = (system: string) => {
		const lowerSystem = system.toLowerCase();
		if (lowerSystem.includes('mac os') || lowerSystem.includes('darwin')) {
			return { variant: "default" as const, icon: "mdi:apple", text: "macOS" };
		}
		if (lowerSystem.includes('windows')) {
			return { variant: "secondary" as const, icon: "mdi:microsoft-windows", text: "Windows" };
		}
		if (lowerSystem.includes('linux')) {
			return { variant: "outline" as const, icon: "mdi:linux", text: "Linux" };
		}
		return { variant: "outline" as const, icon: "mdi:desktop-classic", text: system };
	};

	const columns: ColumnsType<LoginLog> = [
		{
			title: t('monitor.loginlog.loginUser'),
			dataIndex: "userName",
			width: 120,
			ellipsis: true,
		},
		{
			title: t('monitor.loginlog.loginTime'),
			dataIndex: "createTime",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('monitor.loginlog.os'),
			dataIndex: "os",
			width: 150,
			render: (os: string) => {
				const systemInfo = getSystemBadge(os);
				return (
					<Badge
						variant={systemInfo.variant}
						className="flex items-center gap-1 w-fit dark:bg-white dark:text-black"
					>
						<Icon icon={systemInfo.icon} size={14} />
						{systemInfo.text}
					</Badge>
				);
			},
		},
		{
			title: t('monitor.loginlog.browser'),
			dataIndex: "browser",
			width: 120,
			ellipsis: true,
		},
		{
			title: t('monitor.loginlog.ipAddress'),
			dataIndex: "ipAddr",
			width: 140,
			ellipsis: true,
			render: (ipAddr: string) => (
				<div className="flex items-center gap-2">
					<Icon icon="mdi:ip-network" size={16} className="text-gray-500" />
					<span>{ipAddr}</span>
				</div>
			),
		},
		{
			title: t('monitor.loginlog.loginLocation'),
			dataIndex: "location",
			width: 200,
			ellipsis: true,
			render: (location: string) => (
				<div className="flex items-center gap-2">
					<Icon icon="mdi:map-marker" size={16} className="text-gray-500" />
					<span>{location}</span>
				</div>
			),
		},
		{
			title: t('monitor.loginlog.loginStatus'),
			dataIndex: "status",
			width: 100,
			render: (status: string) => (
				<Badge
					variant={status === "1" ? "default" : "destructive"}
					className="flex items-center gap-1 w-fit"
				>
					{status === "1" ? t('monitor.loginlog.success') : t('monitor.loginlog.failed')}
				</Badge>
			),
		},
		{
			title: t('monitor.loginlog.actions'),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onView(record)}
						title={t('monitor.loginlog.viewDetail')}
					>
						<Icon icon="solar:eye-bold-duotone" size={18} />
					</Button>
				</div>
			),
		},
	];

	const onView = (record: LoginLog) => {
		setLoginlogModalProps({
			formValue: record,
			title: t('monitor.loginlog.detailTitle'),
			show: true,
			onOk: () => {
				setLoginlogModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setLoginlogModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	useEffect(() => {
		loadLoginlogs();
	}, [currentPage, pageSize]);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('monitor.loginlog.title')}</div>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Icon icon="mdi:login" size={18} />
							<span>{t('monitor.loginlog.loginCount', { total })}</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...searchForm}>
						<form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
							<div className="flex gap-4 items-end">
								<FormField
									control={searchForm.control}
									name="userName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('monitor.loginlog.loginUser')}</FormLabel>
											<FormControl>
												<Input placeholder={t('monitor.loginlog.userPlaceholder')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('monitor.loginlog.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('monitor.loginlog.reset')}
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
							showTotal: (total, range) => t('monitor.pagination', { start: range[0], end: range[1], total }),
							onChange: (page, size) => {
								setCurrentPage(page);
								setPageSize(size || 10);
							},
						}}
						loading={loading}
						columns={columns}
						dataSource={loginlogList}
					/>
				</CardContent>
			</Card>

			<LoginlogModal {...loginlogModalProps} />
		</>
	);
}
