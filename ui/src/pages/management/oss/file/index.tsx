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
import { processImageUrl } from "@/components/app-image";
import { 
	queryFile, 
	deleteFile, 
	type SystemFile, 
	type FileQueryParams 
} from "@/api/services/systemFileService";
import { FileModal } from "./file-modal";

interface SearchFormData {
	name: string;
	type: "all" | string;
}

export default function FilePage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [fileList, setFileList] = useState<SystemFile[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [fileModalProps, setFileModalProps] = useState({
		title: t('oss.file.upload'),
		show: false,
		onOk: () => {},
		onCancel: () => {},
	});

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			name: "",
			type: "all",
		},
	});

	const loadFiles = async (params?: Partial<FileQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: FileQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await queryFile(queryParams);
			setFileList(response.records || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load files:", error);
			toast.error(t('oss.file.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (values: SearchFormData) => {
		const searchParams = {
			...values,
			type: values.type === "all" ? "" : values.type,
		};
		setCurrentPage(1);
		loadFiles(searchParams);
	};

	const handleReset = () => {
		searchForm.reset({
			name: "",
			type: "all",
		});
		setCurrentPage(1);
		loadFiles({});
	};

	// 处理分页变化
	const handlePaginationChange = (page: number, size?: number) => {
		setCurrentPage(page);
		if (size && size !== pageSize) {
			setPageSize(size);
			setCurrentPage(1); // 改变页面大小时重置到第一页
		}
	};

	const handleAdd = () => {
		setFileModalProps({
			title: t('oss.file.upload'),
			show: true,
			onOk: () => {
				handleRefresh();
				setFileModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setFileModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const handleRefresh = () => {
		loadFiles();
	};

	const handleDelete = async (id: string) => {
		if (window.confirm(t('oss.file.deleteConfirm'))) {
			try {
				await deleteFile(id);
				toast.success(t('oss.file.deleteSuccess'));
				loadFiles();
			} catch (error) {
				console.error("Failed to delete file:", error);
				toast.error(t('oss.file.deleteFailed'));
			}
		}
	};

	const handleDownload = (record: SystemFile) => {
		const link = document.createElement('a');
		link.href = getFileUrl(record);
		link.download = record.name || 'download';
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// 处理文件URL，使用通用URL处理函数
	const getFileUrl = (record: SystemFile) => {
		return processImageUrl(record.url);
	};

	// 判断是否为图片文件
	const isImage = (url: string) => {
		if (!url) return false;
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
		const lowerUrl = url.toLowerCase();
		return imageExtensions.some(ext => lowerUrl.includes(ext));
	};

	// 判断是否为视频文件
	const isVideo = (url: string) => {
		if (!url) return false;
		const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
		const lowerUrl = url.toLowerCase();
		return videoExtensions.some(ext => lowerUrl.includes(ext));
	};

	// 获取文件类型显示文本
	const getFileTypeDisplay = (mimeType: string) => {
		if (mimeType.startsWith('image/')) {
			return t('oss.file.fileType');
		}
		if (mimeType.startsWith('audio/')) {
			return t('oss.file.audioType');
		}
		if (mimeType.startsWith('video/')) {
			return t('oss.file.videoType');
		}
		if (mimeType.startsWith('text/')) {
			return t('oss.file.textType');
		}
		if (mimeType === 'application/pdf') {
			return 'PDF';
		}
		if (mimeType.startsWith('application/msword') ||
			mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
			return t('oss.file.wordType');
		}
		if (mimeType.startsWith('application/vnd.ms-excel') ||
			mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
			return t('oss.file.excelType');
		}
		if (mimeType.startsWith('application/vnd.ms-powerpoint') ||
			mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
			return t('oss.file.pptType');
		}
		return t('oss.file.otherType');
	};

	// 根据文件类型获取标签颜色
	const getFileTypeColor = (mimeType: string) => {
		if (mimeType.startsWith('image/')) {
			return 'bg-blue-500';
		}
		if (mimeType.startsWith('audio/')) {
			return 'bg-purple-500';
		}
		if (mimeType.startsWith('video/')) {
			return 'bg-orange-500';
		}
		if (mimeType.startsWith('text/')) {
			return 'bg-green-500';
		}
		if (mimeType === 'application/pdf') {
			return 'bg-red-500';
		}
		if (mimeType.startsWith('application/msword') ||
			mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
			return 'bg-cyan-500';
		}
		if (mimeType.startsWith('application/vnd.ms-excel') ||
			mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
			return 'bg-pink-500';
		}
		if (mimeType.startsWith('application/vnd.ms-powerpoint') ||
			mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
			return 'bg-yellow-500';
		}
		return 'bg-gray-500';
	};

	// 格式化文件大小
	const formatFileSize = (size: number) => {
		const unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		let index = 0;
		let convertedSize = size;

		while (convertedSize >= 1024 && index < unitArr.length - 1) {
			convertedSize /= 1024;
			index += 1;
		}

		return `${convertedSize.toFixed(2)} ${unitArr[index]}`;
	};

	const columns: ColumnsType<SystemFile> = [
		{
			title: t('oss.file.preview'),
			dataIndex: "url",
			width: 120,
			render: (url: string, record: SystemFile) => {
				const fileUrl = getFileUrl(record);
				if (isImage(url)) {
					return (
						<div className="flex items-center justify-center w-20 h-20 overflow-hidden rounded">
							<img
								src={fileUrl}
								alt={record.name}
								className="object-cover w-full h-full"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.style.display = 'none';
									const parent = target.parentElement;
									if (parent) {
										parent.innerHTML = `
											<div class="flex items-center justify-center w-20 h-20 bg-gray-100 rounded border border-gray-300">
												<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
												</svg>
											</div>
										`;
									}
								}}
							/>
						</div>
					);
				}
				if (isVideo(url)) {
					return (
						<div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded">
							<Icon icon="solar:video-bold-duotone" size={24} />
						</div>
					);
				}
				return (
					<a
						href={fileUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-500 hover:underline"
					>
						{t("oss.file.preview")}
					</a>
				);
			},
		},
		{
			title: t('oss.file.name'),
			dataIndex: "name",
			width: 200,
			ellipsis: true,
		},
		{
			title: t('oss.file.type'),
			dataIndex: "type",
			width: 120,
			render: (type: string) => (
				<Badge variant="secondary" className="flex items-center gap-1 w-fit">
					<div className={`w-2 h-2 rounded-full ${getFileTypeColor(type)}`} />
					{getFileTypeDisplay(type)}
				</Badge>
			),
		},
		{
			title: t('oss.file.size'),
			dataIndex: "size",
			width: 120,
			render: (size: number) => formatFileSize(size),
		},
		{
			title: t('oss.file.configId'),
			dataIndex: "configId",
			width: 100,
		},
		{
			title: t('oss.file.creator'),
			dataIndex: "creator",
			width: 120,
			render: (creator: string | null) => creator || "-",
		},
		{
			title: t('oss.file.createdAt'),
			dataIndex: "createTime",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('oss.file.updatedAt'),
			dataIndex: "updateTime",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('oss.file.actions'),
			key: "operation",
			align: "center",
			width: 150,
			fixed: "right",
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleDownload(record)}
						title={t('oss.file.download')}
					>
						<Icon icon="solar:download-bold-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleDelete(record.id)}
						title={t('oss.file.delete')}
						className="text-red-500 hover:text-red-700"
					>
						<Icon icon="solar:trash-bin-trash-bold-duotone" size={18} />
					</Button>
				</div>
			),
		},
	];

	useEffect(() => {
		loadFiles();
	}, [currentPage, pageSize]);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('oss.file.title')}</div>
						<Button onClick={handleAdd}>
							<Icon icon="solar:add-circle-bold-duotone" size={18} className="mr-2" />
							{t('oss.file.uploadFile')}
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
											<FormLabel>{t('oss.file.name')}</FormLabel>
											<FormControl>
												<Input placeholder={t('oss.file.namePlaceholder')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<FormField
									control={searchForm.control}
									name="type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('oss.file.type')}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t('oss.file.typePlaceholder')} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="all">{t('oss.file.all')}</SelectItem>
													<SelectItem value="image">{t('oss.file.fileType')}</SelectItem>
													<SelectItem value="video">{t('oss.file.videoType')}</SelectItem>
													<SelectItem value="audio">{t('oss.file.audioType')}</SelectItem>
													<SelectItem value="document">{t('oss.file.document')}</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('oss.file.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('oss.file.reset')}
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
							onChange: handlePaginationChange,
							onShowSizeChange: (current, size) => {
								handlePaginationChange(1, size);
							},
						}}
						loading={loading}
						columns={columns}
						dataSource={fileList}
					/>
				</CardContent>
			</Card>

			{/* 文件上传弹出框 */}
			<FileModal {...fileModalProps} />
		</>
	);
}
