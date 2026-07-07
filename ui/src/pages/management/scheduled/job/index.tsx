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
	queryJob,
	addJob,
	updateJob,
	deleteJob,
	runOnce,
	pauseJob,
	resumeJob,
	type Job,
	type JobQueryParams
} from "@/api/services/systemJobService";
import { JobModal, type JobModalProps } from "./job-modal";

interface SearchFormData {
	beanName: string;
	status: "all" | "0" | "1";
}

export default function JobPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [jobList, setJobList] = useState<Job[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [jobModalProps, setJobModalProps] = useState<JobModalProps>({
		formValue: {
			jobId: "",
			beanName: "",
			methodName: "",
			params: "",
			cronExpression: "",
			status: "1",
			remark: "",
		},
		title: t('scheduled.jobModal.addTitle'),
		show: false,
		onOk: (values) => {
			handleSave(values);
		},
		onCancel: () => {
			setJobModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			beanName: "",
			status: "all",
		},
	});

	const loadJobs = async (params?: Partial<JobQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: JobQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await queryJob(queryParams);
			setJobList(response.rows || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load jobs:", error);
			toast.error(t('scheduled.job.loadFailed'));
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
		loadJobs(searchParams);
	};

	const handleReset = () => {
		searchForm.reset({
			beanName: "",
			status: "all",
		});
		setCurrentPage(1);
		loadJobs({});
	};

	const handleAdd = () => {
		setJobModalProps({
			formValue: {
				jobId: "",
				beanName: "",
				methodName: "",
				params: "",
				cronExpression: "",
				status: "1",
				remark: "",
			},
			title: t('scheduled.jobModal.addTitle'),
			show: true,
			onOk: (values) => {
				handleAddSave(values);
			},
			onCancel: () => {
				setJobModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const handleEdit = (record: Job) => {
		if (!record.jobId || record.jobId.trim() === "") {
			console.error('No jobId found in record:', record);
			toast.error(t('scheduled.job.editIdMissing'));
			return;
		}

		setJobModalProps({
			formValue: record,
			title: t('scheduled.jobModal.editTitle'),
			show: true,
			onOk: (values) => {
				handleUpdateSave(values);
			},
			onCancel: () => {
				setJobModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const handleAddSave = async (values: Job) => {
		console.log('Adding new job:', values);
		try {
			await addJob(values);
			toast.success(t('scheduled.job.addSuccess'));
			setJobModalProps((prev) => ({ ...prev, show: false }));
			loadJobs();
		} catch (error) {
			console.error("Failed to add job:", error);
			toast.error(t('scheduled.job.addFailed'));
		}
	};

	const handleUpdateSave = async (values: Job) => {
		console.log('Updating job:', values);
		console.log('JobId:', values.jobId);

		if (!values.jobId || values.jobId.trim() === "") {
			console.error('JobId is missing for update operation');
			toast.error(t('scheduled.job.updateIdMissing'));
			return;
		}

		try {
			await updateJob(values);
			toast.success(t('scheduled.job.updateSuccess'));
			setJobModalProps((prev) => ({ ...prev, show: false }));
			loadJobs();
		} catch (error) {
			console.error("Failed to update job:", error);
			toast.error(t('scheduled.job.updateFailed'));
		}
	};

	const handleDelete = async (jobId: string) => {
		try {
			await deleteJob(jobId);
			toast.success(t('scheduled.job.deleteSuccess'));
			loadJobs();
		} catch (error) {
			console.error("Failed to delete job:", error);
			toast.error(t('scheduled.job.deleteFailed'));
		}
	};

	const handleRunOnce = async (jobId: string) => {
		try {
			await runOnce(jobId);
			toast.success(t('scheduled.job.runSuccess'));
		} catch (error) {
			console.error("Failed to run job:", error);
			toast.error(t('scheduled.job.runFailed'));
		}
	};

	const handlePause = async (jobId: string) => {
		try {
			await pauseJob(jobId);
			toast.success(t('scheduled.job.pauseSuccess'));
			loadJobs();
		} catch (error) {
			console.error("Failed to pause job:", error);
			toast.error(t('scheduled.job.pauseFailed'));
		}
	};

	const handleResume = async (jobId: string) => {
		try {
			await resumeJob(jobId);
			toast.success(t('scheduled.job.resumeSuccess'));
			loadJobs();
		} catch (error) {
			console.error("Failed to resume job:", error);
			toast.error(t('scheduled.job.resumeFailed'));
		}
	};

	const getStatusBadge = (status: string) => {
		if (status === "0") {
			return { variant: "default" as const, text: t('scheduled.job.running'), color: "bg-green-500" };
		}
		return { variant: "secondary" as const, text: t('scheduled.job.paused'), color: "bg-gray-500" };
	};

	const columns: ColumnsType<Job> = [
		{
			title: t('scheduled.job.jobId'),
			dataIndex: "jobId",
			width: 100,
			ellipsis: true,
		},
		{
			title: t('scheduled.job.beanName'),
			dataIndex: "beanName",
			width: 150,
			ellipsis: true,
		},
		{
			title: t('scheduled.job.methodName'),
			dataIndex: "methodName",
			width: 150,
			ellipsis: true,
		},
		{
			title: t('scheduled.job.params'),
			dataIndex: "params",
			width: 120,
			ellipsis: true,
		},
		{
			title: t('scheduled.job.cronExpression'),
			dataIndex: "cronExpression",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('scheduled.job.remark'),
			dataIndex: "remark",
			width: 150,
			ellipsis: true,
		},
		{
			title: t('scheduled.job.status'),
			dataIndex: "status",
			width: 100,
			render: (status: string) => {
				const statusInfo = getStatusBadge(status);
				return (
					<Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
						<div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
						{statusInfo.text}
					</Badge>
				);
			},
		},
		{
			title: t('scheduled.job.createdAt'),
			dataIndex: "createTime",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('scheduled.job.actions'),
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
						title={t('scheduled.job.edit')}
					>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleDelete(record.jobId!)}
						title={t('scheduled.job.delete')}
						className="text-red-500 hover:text-red-700"
					>
						<Icon icon="solar:trash-bin-trash-bold-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleRunOnce(record.jobId!)}
						title={t('scheduled.job.run')}
					>
						<Icon icon="solar:play-bold-duotone" size={18} />
					</Button>
					{record.status === "0" ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handlePause(record.jobId!)}
							title={t('scheduled.job.pause')}
						>
							<Icon icon="solar:pause-bold-duotone" size={18} />
						</Button>
					) : (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleResume(record.jobId!)}
							title={t('scheduled.job.resume')}
						>
							<Icon icon="solar:refresh-circle-bold-duotone" size={18} />
						</Button>
					)}
				</div>
			),
		},
	];

	useEffect(() => {
		loadJobs();
	}, [currentPage, pageSize]);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('scheduled.job.title')}</div>
						<Button onClick={handleAdd}>
							<Icon icon="solar:add-circle-bold-duotone" size={18} className="mr-2" />
							{t('scheduled.job.add')}
						</Button>
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
											<FormLabel>{t('scheduled.job.beanName')}</FormLabel>
											<FormControl>
												<Input placeholder={t('scheduled.job.beanNamePlaceholder')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('scheduled.job.status')}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t('scheduled.job.statusPlaceholder')} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="all">{t('scheduled.job.all')}</SelectItem>
													<SelectItem value="0">{t('scheduled.job.running')}</SelectItem>
													<SelectItem value="1">{t('scheduled.job.paused')}</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('scheduled.job.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('scheduled.job.reset')}
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
						rowKey="jobId"
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
						dataSource={jobList}
					/>
				</CardContent>
			</Card>

			{/* 任务编辑弹出框 */}
			<JobModal {...jobModalProps} />
		</>
	);
}
