import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
	pageDocumentsApi,
	deleteDocumentApi,
	reEmbedDocumentApi,
	updateDocumentApi,
	getDocumentApi,
	type Document,
	type DocumentQueryParams,
} from "@/api/services/llmDocsService";
import { embeddingDocsApi } from "@/api/services/llmEmbeddingService";

interface DocumentManageTabProps {
	knowledgeId: string;
}

interface SearchFormData {
	name: string;
}

export default function DocumentManageTab({ knowledgeId }: DocumentManageTabProps) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [documentList, setDocumentList] = useState<Document[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [editingDocument, setEditingDocument] = useState<Document | null>(null);
	const [showEditModal, setShowEditModal] = useState(false);

	// Upload state
	const [uploading, setUploading] = useState(false);

	const pollingRef = useRef<Set<string>>(new Set());
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const searchForm = useForm<SearchFormData>({
		defaultValues: { name: "" },
	});

	const editForm = useForm<Document>({
		defaultValues: { name: "", url: "", type: "UPLOAD" },
	});

	// ─── Polling ──────────────────────────────────────────────────────

	const pollStatus = useCallback(() => {
		if (pollingRef.current.size === 0) return;
		const ids = Array.from(pollingRef.current);
		ids.forEach((id) => {
			getDocumentApi(id)
				.then((doc) => {
					if (doc.sliceStatus === true) {
						pollingRef.current.delete(id);
						setDocumentList((prev) =>
							prev.map((d) =>
								d.id === id ? { ...d, sliceStatus: true, sliceNum: doc.sliceNum } : d
							)
						);
						if (pollingRef.current.size === 0 && timerRef.current) {
							clearInterval(timerRef.current);
							timerRef.current = null;
						}
					}
				})
				.catch(() => {});
		});
	}, []);

	const startPolling = (docId: string) => {
		pollingRef.current.add(docId);
		if (!timerRef.current) {
			timerRef.current = setInterval(pollStatus, 3000);
		}
	};

	const stopAllPolling = () => {
		pollingRef.current.clear();
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};

	// ─── Data Loading ─────────────────────────────────────────────────

	const loadDocuments = async (params?: Partial<DocumentQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: DocumentQueryParams = {
				knowledgeId,
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await pageDocumentsApi(queryParams);
			const rows = response.rows || [];
			setDocumentList(rows);
			setTotal(response.total || 0);

			rows.forEach((doc) => {
				if (doc.id && doc.sliceStatus !== true) {
					startPolling(doc.id);
				}
			});
		} catch (error) {
			console.error("Failed to load documents:", error);
			toast.error(t('llm.docManage.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	// ─── Upload ───────────────────────────────────────────────────────

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		const allowedTypes = [
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/pdf",
			"text/plain",
			"text/markdown",
		];

		if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|doc|docx|pdf)$/i)) {
			toast.error(t('llm.dataImport.unsupportedFormat'));
			return;
		}

		setUploading(true);
		try {
			const docId = await embeddingDocsApi(knowledgeId, file);
			toast.success(t('llm.dataImport.uploadSuccess'));
			// Add new doc to list top and start polling
			startPolling(docId);
			setCurrentPage(1);
			loadDocuments();
		} catch (error) {
			console.error("Upload failed:", error);
			toast.error(t('llm.dataImport.uploadFailed'));
		} finally {
			setUploading(false);
			event.target.value = "";
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const files = event.dataTransfer.files;
		if (files && files.length > 0) {
			const fakeEvent = { target: { files } } as any;
			handleFileUpload(fakeEvent);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	// ─── Search / CRUD ────────────────────────────────────────────────

	const handleSearch = (values: SearchFormData) => {
		stopAllPolling();
		setCurrentPage(1);
		loadDocuments(values);
	};

	const handleReset = () => {
		searchForm.reset();
		stopAllPolling();
		setCurrentPage(1);
		loadDocuments({});
	};

	const handleReEmbed = (record: Document) => {
		if (window.confirm(t('llm.docManage.reEmbedConfirm'))) {
			reEmbedDocumentApi(record.id!).then(() => {
				setDocumentList((prev) =>
					prev.map((d) =>
						d.id === record.id ? { ...d, sliceStatus: false, sliceNum: 0 } : d
					)
				);
				startPolling(record.id!);
				toast.success(t('llm.docManage.reEmbedProgress'));
			}).catch(() => {
				toast.error(t('llm.docManage.reEmbedFailed'));
			});
		}
	};

	const handleEdit = (record: Document) => {
		setEditingDocument(record);
		editForm.reset({ name: record.name, url: record.url, type: record.type });
		setShowEditModal(true);
	};

	const handleSaveEdit = async (values: Document) => {
		if (!editingDocument?.id) return;
		try {
			await updateDocumentApi({ ...values, id: editingDocument.id, knowledgeId });
			toast.success(t('llm.docManage.updateSuccess'));
			setShowEditModal(false);
			setEditingDocument(null);
			loadDocuments();
		} catch (error) {
			console.error("Failed to update document:", error);
			toast.error(t('llm.docManage.updateFailed'));
		}
	};

	const handleDelete = (record: Document) => {
		if (window.confirm(t('llm.docManage.deleteConfirm', { name: record.name }))) {
			deleteDocumentApi(record.id!).then(() => {
				pollingRef.current.delete(record.id!);
				toast.success(t('llm.docManage.deleteSuccess'));
				loadDocuments();
			}).catch(() => {
				toast.error(t('llm.docManage.deleteFailed'));
			});
		}
	};

	// ─── Helpers ──────────────────────────────────────────────────────

	const formatSize = (size?: number | string) => {
		if (!size) return "0 B";
		const sizeNum = typeof size === "string" ? parseInt(size) : size;
		if (sizeNum < 1024) return `${sizeNum} B`;
		if (sizeNum < 1024 * 1024) return `${(sizeNum / 1024).toFixed(2)} KB`;
		if (sizeNum < 1024 * 1024 * 1024) return `${(sizeNum / (1024 * 1024)).toFixed(2)} MB`;
		return `${(sizeNum / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	};

	const getTypeBadge = (type?: string) => {
		switch (type) {
			case "UPLOAD": return <Badge variant="default">{t('llm.docManage.upload')}</Badge>;
			case "URL": return <Badge variant="secondary">{t('llm.docManage.link')}</Badge>;
			case "TEXT": return <Badge variant="outline">{t('llm.docManage.text')}</Badge>;
			default: return <Badge variant="outline">{t('llm.docManage.unknown')}</Badge>;
		}
	};

	const getSliceStatusBadge = (status?: boolean, docId?: string) => {
		if (status === true) return <Badge variant="default">{t('llm.docManage.completed')}</Badge>;
		const isPolling = docId && pollingRef.current.has(docId);
		return (
			<Badge variant="outline" className={isPolling ? "animate-pulse" : ""}>
				{isPolling ? t('llm.docManage.parsing') : t('llm.docManage.unfinished')}
			</Badge>
		);
	};

	useEffect(() => {
		loadDocuments();
		return () => { stopAllPolling(); };
	}, [currentPage, pageSize]);

	// ─── Columns ──────────────────────────────────────────────────────

	const columns: ColumnsType<Document> = [
		{
			title: t('llm.docManage.docName'),
			dataIndex: "name",
			width: 200,
		},
		{
			title: t('llm.docManage.docLink'),
			dataIndex: "url",
			width: 200,
			render: (link: string) =>
				link ? (
					<a href={link} target="_blank" rel="noopener noreferrer"
						className="text-primary hover:underline flex items-center gap-1">
						<Icon icon="mdi:link" size={14} />
						<span className="truncate max-w-[150px]">{t('llm.docManage.viewDoc')}</span>
					</a>
				) : <span className="text-muted-foreground">-</span>,
		},
		{
			title: t('llm.docManage.docSource'),
			dataIndex: "type",
			width: 100,
			align: "center",
			render: (type: string) => getTypeBadge(type),
		},
		{
			title: t('llm.docManage.sliceCount'),
			dataIndex: "sliceNum",
			align: "center",
			width: 90,
			render: (count: number) => count || 0,
		},
		{
			title: t('llm.docManage.sliceStatus'),
			dataIndex: "sliceStatus",
			align: "center",
			width: 110,
			render: (status: boolean, record) => getSliceStatusBadge(status, record.id),
		},
		{
			title: t('llm.docManage.fileSize'),
			dataIndex: "size",
			align: "center",
			width: 90,
			render: (size: number | string) => formatSize(size),
		},
		{
			title: t('llm.docManage.actions'),
			key: "operation",
			align: "center",
			width: 140,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-0.5">
					<Button variant="ghost" size="icon" className="h-8 w-8"
						onClick={() => handleReEmbed(record)} title={t('llm.docManage.reEmbed')}>
						<Icon icon="mdi:refresh" size={16} />
					</Button>
					<Button variant="ghost" size="icon" className="h-8 w-8"
						onClick={() => handleEdit(record)} title={t('llm.docManage.edit')}>
						<Icon icon="mdi:pencil" size={16} />
					</Button>
					<Button variant="ghost" size="icon" className="h-8 w-8"
						onClick={() => handleDelete(record)} title={t('llm.docManage.delete')}>
						<Icon icon="mingcute:delete-2-fill" size={16} className="text-destructive" />
					</Button>
				</div>
			),
		},
	];

	// ─── Render ───────────────────────────────────────────────────────

	return (
		<div className="space-y-5">
			{/* Upload Zone — always visible */}
			<div className="rounded-lg border border-border/60 bg-card">
				<div className="px-5 py-3 border-b border-border/40">
					<h3 className="text-sm font-medium flex items-center gap-2">
						<Icon icon="mdi:cloud-upload" size={16} className="text-muted-foreground" />
						{t('llm.dataImport.title')}
					</h3>
				</div>
				<div className="p-5">
					<div
						className="border-2 border-dashed border-border rounded-lg py-8 px-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onClick={() => document.getElementById("doc-file-upload")?.click()}
					>
						<input
							id="doc-file-upload"
							type="file"
							className="hidden"
							accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.txt,.md"
							onChange={handleFileUpload}
							disabled={uploading}
						/>
						<div className="flex items-center justify-center gap-3">
							<Icon icon="mdi:cloud-upload" size={28} className="text-muted-foreground/40" />
							<div className="text-left">
								<p className="text-sm font-medium text-foreground">
									{uploading ? t('llm.dataImport.uploading') : t('llm.dataImport.uploadArea')}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{t('llm.dataImport.fileTypeHint')}
								</p>
							</div>
						</div>
						{uploading && (
							<div className="w-48 mx-auto bg-muted rounded-full h-1.5 mt-3">
								<div className="bg-primary h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Search + Table */}
			<div className="rounded-lg border border-border/60 bg-card">
				<div className="px-5 py-3 border-b border-border/40">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium flex items-center gap-2">
							<Icon icon="mdi:file-document-multiple" size={16} className="text-muted-foreground" />
							{t('llm.docManage.title')}
						</h3>
						<Form {...searchForm}>
							<form onSubmit={searchForm.handleSubmit(handleSearch)} className="flex gap-2 items-center">
								<FormField
									control={searchForm.control}
									name="name"
									render={({ field }) => (
										<FormControl>
											<Input placeholder={t('llm.docManage.namePlaceholder')} {...field} className="h-7 text-xs w-44" />
										</FormControl>
									)}
								/>
								<Button type="submit" size="sm" variant="ghost" className="h-7 px-2" disabled={loading}>
									<Icon icon="mdi:magnify" size={15} />
								</Button>
								<Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={handleReset}>
									<Icon icon="mdi:refresh" size={15} />
								</Button>
							</form>
						</Form>
					</div>
				</div>

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
						showTotal: (total, range) =>
							t('llm.pagination', { start: range[0], end: range[1], total }),
						onChange: (page, size) => {
							stopAllPolling();
							setCurrentPage(page);
							setPageSize(size || 10);
						},
					}}
					loading={loading}
					columns={columns}
					dataSource={documentList}
				/>

				{documentList.length === 0 && !loading && (
					<div className="text-center py-10 border-t border-border/40">
						<Icon icon="mdi:file-document-multiple" size={36} className="mx-auto mb-2 text-muted-foreground/30" />
						<p className="text-sm text-muted-foreground">{t('llm.docManage.noData')}</p>
					</div>
				)}
			</div>

			{/* Edit Modal */}
			{showEditModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
					onClick={() => { setShowEditModal(false); setEditingDocument(null); }}>
					<div className="bg-background rounded-lg border shadow-lg p-6 w-full max-w-lg"
						onClick={(e) => e.stopPropagation()}>
						<h3 className="text-base font-semibold mb-4">{t('llm.docManage.editTitle')}</h3>
						<Form {...editForm}>
							<form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
								<FormField control={editForm.control} name="name" render={({ field }) => (
									<FormItem>
										<FormLabel>{t('llm.docManage.docName')}</FormLabel>
										<FormControl><Input {...field} /></FormControl>
									</FormItem>
								)} />
								<FormField control={editForm.control} name="url" render={({ field }) => (
									<FormItem>
										<FormLabel>{t('llm.docManage.docLinkLabel')}</FormLabel>
										<FormControl><Input {...field} /></FormControl>
									</FormItem>
								)} />
								<div className="flex justify-end gap-2 pt-2">
									<Button type="button" variant="outline" size="sm"
										onClick={() => { setShowEditModal(false); setEditingDocument(null); }}>
										{t('llm.docManage.cancel')}
									</Button>
									<Button type="submit" size="sm">{t('llm.docManage.save')}</Button>
								</div>
							</form>
						</Form>
					</div>
				</div>
			)}
		</div>
	);
}
