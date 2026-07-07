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
	queryJobLog, 
	type JobLog, 
	type JobLogQueryParams 
} from "@/api/services/systemJoblogService";
import { JoblogModal, type JoblogModalProps } from "./joblog-modal";

interface SearchFormData {
	beanName: string;
	status: "all" | "0" | "1";
}

export default function JoblogPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [joblogList, setJoblogList] = useState<JobLog[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [joblogModalProps, setJoblogModalProps] = useState<JoblogModalProps>({
		formValue: {
			beanName: "",
			methodName: "",
			params: "",
			times: 0,
			status: "0",
			error: "",
			createTime: "",
		},
		title: t('scheduled.joblogModal.title'),
		show: false,
		onOk: () => {
			setJoblogModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setJoblogModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			beanName: "",
			status: "all",
		},
	});

	const loadJoblogs = async (params?: Partial<JobLogQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: JobLogQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await queryJobLog(queryParams);
			setJoblogList(response.rows || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load job logs:", error);
			toast.error(t('scheduled.joblog.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (values: SearchFormData) => {
		const searchParams = {
			...values,
			status: values.status === "all" ? "" : values.status,
		};
		setCurrentPage(1);
		loadJoblogs(searchParams);
	};

	const handleReset = () => {
		searchForm.reset({
			beanName: "",
			status: "all",
		});
		setCurrentPage(1);
		loadJoblogs({});
	};

	const getStatusBadge = (status: string) => {
		if (status === "0") {
			return { variant: "default" as const, text: t('scheduled.joblog.success'), color: "bg-green-500" };
		}
		return { variant: "destructive" as const, text: t('scheduled.joblog.failed'), color: "bg-red-500" };
	};

	const formatExecutionTime = (times: number) => {
		if (times < 1000) {
			return `${times}ms`;
		}
		return `${(times / 1000).toFixed(2)}s`;
	};

	const columns: ColumnsType<JobLog> = [
		{
			title: t('scheduled.joblog.beanName'),
			dataIndex: "beanName",
			width: 150,
			ellipsis: true,
		},
		{
			title: t('scheduled.joblog.methodName'),
			dataIndex: "methodName",
			width: 150,
			ellipsis: true,
		},
		{
			title: t('scheduled.joblog.params'),
			dataIndex: "params",
			width: 200,
			ellipsis: true,
		},
		{
			title: t('scheduled.joblog.executionTime'),
			dataIndex: "times",
			width: 100,
			render: (times: number) => (
				<div className="flex items-center gap-2">
					<Icon icon="mdi:timer" size={16} className="text-gray-500" />
					<span>{formatExecutionTime(times)}</span>
				</div>
			),
		},
		{
			title: t('scheduled.joblog.result'),
			dataIndex: "status",
			width: 100,
			render: (status: string) => {
				const statusInfo = getStatusBadge(status);
				return (
					<Badge 
						variant={statusInfo.variant} 
						className="flex items-center gap-1 w-fit dark:bg-white dark:text-black"
					>
						<div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
						{statusInfo.text}
					</Badge>
				);
			},
		},
		{
			title: t('scheduled.joblog.exceptionInfo'),
			dataIndex: "error",
			width: 200,
			ellipsis: true,
			render: (error: string) => (
				<div className="flex items-center gap-2">
					{error && (
						<Icon icon="mdi:alert-circle" size={16} className="text-red-500" />
					)}
					<span className={error ? "text-red-500" : ""}>
						{error || t('scheduled.joblog.noException')}
					</span>
				</div>
			),
		},
		{
			title: t('scheduled.joblog.createdAt'),
			dataIndex: "createTime",
			width: 180,
			ellipsis: true,
			render: (createTime: string) => (
				<div className="flex items-center gap-2">
					<Icon icon="mdi:clock" size={16} className="text-gray-500" />
					<span>{createTime}</span>
				</div>
			),
		},
		{
			title: t('scheduled.joblog.actions'),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onView(record)}
						title={t('scheduled.joblog.viewDetail')}
					>
						<Icon icon="solar:eye-bold-duotone" size={18} />
					</Button>
				</div>
			),
		},
	];

	const onView = (record: JobLog) => {
		setJoblogModalProps({
			formValue: record,
			title: t('scheduled.joblogModal.title'),
			show: true,
			onOk: () => {
				setJoblogModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setJoblogModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	useEffect(() => {
		loadJoblogs();
	}, [currentPage, pageSize]);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('scheduled.joblog.title')}</div>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Icon icon="mdi:history" size={18} />
							<span>{t('scheduled.joblog.logCount', { total })}</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...searchForm}>
						<form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
							<div className="flex gap-4 items-end">
								<FormField
									control={searchForm.control}
									name="beanName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('scheduled.joblog.beanName')}</FormLabel>
											<FormControl>
												<Input placeholder={t('scheduled.joblog.beanNamePlaceholder')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('scheduled.joblog.result')}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t('scheduled.joblog.resultPlaceholder')} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="all">{t('scheduled.joblog.all')}</SelectItem>
													<SelectItem value="0">{t('scheduled.joblog.success')}</SelectItem>
													<SelectItem value="1">{t('scheduled.joblog.failed')}</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('scheduled.joblog.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('scheduled.joblog.reset')}
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
						dataSource={joblogList}
					/>
				</CardContent>
			</Card>

			{/* 任务日志详情弹出框 */}
			<JoblogModal {...joblogModalProps} />
		</>
	);
}
