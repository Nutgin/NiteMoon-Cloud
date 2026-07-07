import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	pageSlicesApi,
	deleteSliceApi,
	type Slice,
	type SliceQueryParams
} from "@/api/services/llmSliceService";
import {
	listDocumentsApi,
	type Document
} from "@/api/services/llmDocsService";

interface SliceManageTabProps {
	knowledgeId: string;
}

interface SearchFormData {
	content: string;
	docsId?: string;
}

export default function SliceManageTab({ knowledgeId }: SliceManageTabProps) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [sliceList, setSliceList] = useState<Slice[]>([]);
	const [documentList, setDocumentList] = useState<Document[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			content: "",
			docsId: "all",
		},
	});

	const loadSlices = async (params?: Partial<SliceQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: SliceQueryParams = {
				knowledgeId,
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await pageSlicesApi(queryParams);
			setSliceList(response.rows || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load slices:", error);
			toast.error(t('llm.sliceManage.loadSliceFailed'));
		} finally {
			setLoading(false);
		}
	};

	const loadDocuments = async () => {
		try {
			const docs = await listDocumentsApi({ knowledgeId });
			setDocumentList(docs || []);
		} catch (error) {
			console.error("Failed to load documents:", error);
			toast.error(t('llm.sliceManage.loadDocFailed'));
		}
	};

	const handleSearch = (values: SearchFormData) => {
		setCurrentPage(1);
		const searchParams: Partial<SliceQueryParams> = {};
		if (values.content) {
			searchParams.content = values.content;
		}
		if (values.docsId && values.docsId !== 'all') {
			searchParams.docsId = values.docsId;
		}
		loadSlices(searchParams);
	};

	const handleReset = () => {
		searchForm.reset();
		setCurrentPage(1);
		loadSlices({});
	};

	const handleDelete = (record: Slice) => {
		if (window.confirm(t('llm.sliceManage.deleteConfirm', { name: record.name }))) {
			deleteSliceApi(record.id!).then(() => {
				toast.success(t('llm.sliceManage.deleteSuccess'));
				loadSlices();
			}).catch(() => {
				toast.error(t('llm.sliceManage.deleteFailed'));
			});
		}
	};

	const formatTime = (timeStr?: string) => {
		if (!timeStr) return "";
		return new Date(timeStr).toLocaleString();
	};

	const getStatusBadge = (status?: boolean) => {
		if (status === true) return <Badge variant="default">{t('llm.sliceManage.trained')}</Badge>;
		return <Badge variant="outline">{t('llm.sliceManage.untrained')}</Badge>;
	};

	useEffect(() => {
		loadSlices();
		loadDocuments();
	}, [currentPage, pageSize]);

	const columns: ColumnsType<Slice> = [
		{
			title: t('llm.sliceManage.docName'),
			dataIndex: "name",
			width: 200,
			ellipsis: true,
		},
		{
			title: t('llm.sliceManage.sliceContent'),
			dataIndex: "content",
			width: 300,
			ellipsis: true,
			render: (content: string) => (
				<div className="max-w-[300px] truncate" title={content}>
					{content}
				</div>
			),
		},
		{
			title: t('llm.sliceManage.charCount'),
			dataIndex: "wordNum",
			align: "center",
			width: 80,
			render: (count: number) => count || 0,
		},
		{
			title: t('llm.sliceManage.sliceStatus'),
			dataIndex: "status",
			align: "center",
			width: 100,
			render: (status: boolean) => getStatusBadge(status),
		},
		{
			title: t('llm.sliceManage.createdAt'),
			dataIndex: "createTime",
			width: 150,
			render: (time: string) => formatTime(time),
		},
		{
			title: t('llm.sliceManage.actions'),
			key: "operation",
			align: "center",
			width: 80,
			render: (_, record) => (
				<div className="flex w-full justify-center">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => handleDelete(record)}
						title={t('llm.sliceManage.delete')}
					>
						<Icon icon="mingcute:delete-2-fill" size={16} className="text-destructive" />
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-5">
			{/* Search Form */}
			<div className="rounded-lg border border-border/60 bg-card">
				<div className="px-5 py-3 border-b border-border/40">
					<h3 className="text-sm font-medium flex items-center gap-2">
						<Icon icon="mdi:view-array" size={16} className="text-muted-foreground" />
						{t('llm.sliceManage.title')}
					</h3>
				</div>
				<div className="px-5 py-4">
					<Form {...searchForm}>
						<form onSubmit={searchForm.handleSubmit(handleSearch)}>
							<div className="flex gap-3 items-end flex-wrap">
								<FormField
									control={searchForm.control}
									name="docsId"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">{t('llm.sliceManage.docLabel')}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<SelectTrigger className="h-8 text-sm w-48">
													<SelectValue placeholder={t('llm.sliceManage.selectDocPlaceholder')} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">{t('llm.sliceManage.allDocs')}</SelectItem>
													{documentList.map((doc) => (
														<SelectItem key={doc.id} value={doc.id}>
															{doc.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="content"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">{t('llm.sliceManage.sliceContent')}</FormLabel>
											<FormControl>
												<Input placeholder={t('llm.sliceManage.contentPlaceholder')} {...field} className="h-8 text-sm w-56" />
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" size="sm" disabled={loading}>
										<Icon icon="mdi:magnify" size={15} className="mr-1" />
										{t('llm.sliceManage.search')}
									</Button>
									<Button type="button" variant="outline" size="sm" onClick={handleReset}>
										{t('llm.sliceManage.reset')}
									</Button>
								</div>
							</div>
						</form>
					</Form>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-lg border border-border/60 bg-card overflow-hidden">
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
						showTotal: (total, range) => t('llm.pagination', { start: range[0], end: range[1], total }),
						onChange: (page, size) => {
							setCurrentPage(page);
							setPageSize(size || 10);
						},
					}}
					loading={loading}
					columns={columns}
					dataSource={sliceList}
				/>

				{sliceList.length === 0 && !loading && (
					<div className="text-center py-12">
						<Icon icon="mdi:view-array" size={40} className="mx-auto mb-3 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">{t('llm.sliceManage.noData')}</p>
					</div>
				)}
			</div>
		</div>
	);
}
