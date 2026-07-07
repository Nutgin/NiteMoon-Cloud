import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import Table, { type ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { querySyslog, type SystemSyslog, type SyslogQueryParams } from "@/api/services/systemSyslogService";
import { SyslogModal, type SyslogModalProps } from "./syslog-modal";

interface SearchFormData {
	userName: string;
	title: string;
}

export default function SyslogPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [syslogList, setSyslogList] = useState<SystemSyslog[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [syslogModalProps, setSyslogModalProps] = useState<SyslogModalProps>({
		formValue: {
			id: "",
			ipAddr: "",
			title: "",
			requestMethod: "",
			requestUri: "",
			requestParams: null,
			requestTime: 0,
			location: "",
			method: "",
			userName: "",
			status: "",
			exMsg: null,
			createBy: null,
			createTime: "",
			delFlag: "",
			tenantId: "",
		},
		title: t('monitor.syslog.detailTitle'),
		show: false,
		onOk: () => {
			setSyslogModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setSyslogModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			userName: "",
			title: "",
		},
	});

	const loadSyslogs = async (params?: Partial<SyslogQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: SyslogQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await querySyslog(queryParams);
			setSyslogList(response.records || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load syslogs:", error);
			toast.error(t('monitor.syslog.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (values: SearchFormData) => {
		setCurrentPage(1);
		loadSyslogs(values);
	};

	const handleReset = () => {
		searchForm.reset();
		setCurrentPage(1);
		loadSyslogs({});
	};

	const columns: ColumnsType<SystemSyslog> = [
		{
			title: t('monitor.syslog.operator'),
			dataIndex: "userName",
			width: 100,
		},
		{
			title: t('monitor.syslog.operation'),
			dataIndex: "title",
			width: 200,
			ellipsis: true,
		},
		{
			title: t('monitor.syslog.duration'),
			dataIndex: "requestTime",
			width: 80,
			render: (time: number) => `${time}ms`,
		},
		{
			title: t('monitor.syslog.requestMethod'),
			dataIndex: "requestMethod",
			width: 200,
			ellipsis: true,
		},
		{
			title: t('monitor.syslog.requestUri'),
			dataIndex: "requestUri",
			width: 150,
			ellipsis: true,
		},
		{
			title: t('monitor.syslog.requestParams'),
			dataIndex: "requestParams",
			width: 250,
			ellipsis: true,
			render: (params: any) => {
				if (!params) return '-';
				if (typeof params === 'string') return params;
				return JSON.stringify(params);
			},
		},
		{
			title: t('monitor.syslog.httpMethod'),
			dataIndex: "method",
			width: 80,
			render: (method: string) => (
				<span className={`px-2 py-1 rounded text-xs font-medium ${
					method === 'GET' ? 'bg-green-100 text-green-800' :
					method === 'POST' ? 'bg-blue-100 text-blue-800' :
					method === 'PUT' ? 'bg-orange-100 text-orange-800' :
					method === 'DELETE' ? 'bg-red-100 text-red-800' :
					'bg-gray-100 text-gray-800'
				}`}>
					{method}
				</span>
			),
		},
		{
			title: t('monitor.syslog.ipAddress'),
			dataIndex: "ipAddr",
			width: 120,
		},
		{
			title: t('monitor.syslog.operationTime'),
			dataIndex: "createTime",
			width: 180,
		},
		{
			title: t('monitor.syslog.operationLocation'),
			dataIndex: "location",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('monitor.syslog.status'),
			dataIndex: "status",
			width: 80,
			render: (status: string) => (
				<span className={`px-2 py-1 rounded text-xs font-medium ${
					status === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
				}`}>
					{status === '1' ? t('monitor.syslog.success') : t('monitor.syslog.failed')}
				</span>
			),
		},
		{
			title: t('monitor.syslog.actions'),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onView(record)}
						title={t('monitor.syslog.viewDetail')}
					>
						<Icon icon="solar:eye-bold-duotone" size={18} />
					</Button>
				</div>
			),
		},
	];

	const onView = (record: SystemSyslog) => {
		setSyslogModalProps({
			formValue: record,
			title: t('monitor.syslog.detailTitle'),
			show: true,
			onOk: () => {
				setSyslogModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setSyslogModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	useEffect(() => {
		loadSyslogs();
	}, [currentPage, pageSize]);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('monitor.syslog.title')}</div>
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
											<FormLabel>{t('monitor.syslog.operator')}</FormLabel>
											<FormControl>
												<Input placeholder={t('monitor.syslog.operator')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="title"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('monitor.syslog.operation')}</FormLabel>
											<FormControl>
												<Input placeholder={t('monitor.syslog.operation')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('monitor.syslog.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('monitor.syslog.reset')}
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
						dataSource={syslogList}
					/>
				</CardContent>
			</Card>

			<SyslogModal {...syslogModalProps} />
		</>
	);
}
