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
import {
	getCacheInfo,
	getCacheMemory,
	getCacheKeys,
	type CacheInfo,
	type MemoryInfo,
	type CacheKey,
	type CacheKeyQueryParams
} from "@/api/services/systemCacheService";
import { CacheModal, type CacheModalProps } from "./cache-modal";

interface SearchFormData {
	key: string;
}

export default function CachePage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
	const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
	const [keyList, setKeyList] = useState<CacheKey[]>([]);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [cacheModalProps, setCacheModalProps] = useState<CacheModalProps>({
		formValue: {
			key: "",
			type: "",
			size: 0,
			ttl: 0,
		},
		title: t('monitor.cache.title'),
		show: false,
		onOk: () => {
			setCacheModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setCacheModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const searchForm = useForm<SearchFormData>({
		defaultValues: {
			key: "",
		},
	});

	const loadCacheInfo = async () => {
		try {
			const response = await getCacheInfo();
			setCacheInfo(response);
		} catch (error) {
			console.error("Failed to load cache info:", error);
		}
	};

	const loadMemoryInfo = async () => {
		try {
			const response = await getCacheMemory();
			setMemoryInfo(response);
		} catch (error) {
			console.error("Failed to load memory info:", error);
		}
	};

	const loadCacheKeys = async (params?: Partial<CacheKeyQueryParams>) => {
		setLoading(true);
		try {
			const queryParams: CacheKeyQueryParams = {
				pageNum: currentPage,
				pageSize: pageSize,
				...params,
			};
			const response = await getCacheKeys(queryParams);
			setKeyList(response.records || []);
			setTotal(response.total || 0);
		} catch (error) {
			console.error("Failed to load cache keys:", error);
			toast.error(t('monitor.cache.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (values: SearchFormData) => {
		setCurrentPage(1);
		loadCacheKeys(values);
	};

	const handleReset = () => {
		searchForm.reset();
		setCurrentPage(1);
		loadCacheKeys({});
	};

	const handleRefreshMemory = () => {
		loadMemoryInfo();
		toast.success(t('monitor.cache.memoryRefreshed'));
	};

	const columns: ColumnsType<CacheKey> = [
		{
			title: t('monitor.cache.keyName'),
			dataIndex: "key",
			width: 400,
			ellipsis: true,
		},
		{
			title: t('monitor.cache.type'),
			dataIndex: "type",
			width: 100,
		},
		{
			title: t('monitor.cache.size'),
			dataIndex: "size",
			width: 120,
			render: (size: number) => formatSize(size),
		},
		{
			title: t('monitor.cache.expireTime'),
			dataIndex: "ttl",
			width: 120,
			render: (ttl: number) => formatTTL(ttl),
		},
		{
			title: t('monitor.cache.actions'),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onView(record)}
						title={t('monitor.cache.viewDetail')}
					>
						<Icon icon="solar:eye-bold-duotone" size={18} />
					</Button>
				</div>
			),
		},
	];

	const onView = (record: CacheKey) => {
		setCacheModalProps({
			formValue: record,
			title: t('monitor.cache.title'),
			show: true,
			onOk: () => {
				setCacheModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setCacheModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	};

	const formatTTL = (ttl: number) => {
		if (ttl === -1) return t('monitor.cache.neverExpire');
		if (ttl === -2) return t('monitor.cache.expired');
		return t('monitor.cache.ttlSeconds', { ttl });
	};

	const getMemoryUsage = () => {
		if (!memoryInfo) return 0;
		return (memoryInfo.used / memoryInfo.total) * 100;
	};

	useEffect(() => {
		loadCacheInfo();
		loadMemoryInfo();
	}, []);

	useEffect(() => {
		loadCacheKeys();
	}, [currentPage, pageSize]);

	return (
		<>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<Card>
					<CardHeader>
						<div>{t('monitor.cache.basicInfo')}</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.redisVersion')}</span>
									<span className="font-medium">{cacheInfo?.version || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.runMode')}</span>
									<span className="font-medium">{cacheInfo?.mode || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.port')}</span>
									<span className="font-medium">{cacheInfo?.port || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.uptime')}</span>
									<span className="font-medium">{cacheInfo?.uptime || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.connectedClients')}</span>
									<span className="font-medium">{cacheInfo?.clients || '-'}</span>
								</div>
							</div>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.memoryConfig')}</span>
									<span className="font-medium">{cacheInfo?.maxmemory || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.aofEnabled')}</span>
									<span className="font-medium">{cacheInfo?.aofEnabled === "1" ? t('monitor.cache.aofYes') : cacheInfo?.aofEnabled === "0" ? t('monitor.cache.aofNo') : '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.rdbSuccess')}</span>
									<span className="font-medium">{cacheInfo?.rdbLastSaveStatus === "1" ? t('monitor.cache.rdbOk') : cacheInfo?.rdbLastSaveStatus === "0" ? t('monitor.cache.rdbFail') : '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.keyCount')}</span>
									<span className="font-medium">{cacheInfo?.keys || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">{t('monitor.cache.network')}</span>
									<span className="font-medium">
										{cacheInfo?.instantaneousInputKbps || '-'}/{cacheInfo?.instantaneousOutputKbps || '-'}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>{t('monitor.cache.memoryInfo')}</div>
							<Button size="sm" onClick={handleRefreshMemory}>
								<Icon icon="mdi:refresh" size={16} className="mr-1" />
								{t('monitor.cache.refresh')}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-center">
							<div className="relative w-32 h-32">
								<svg className="w-32 h-32 transform -rotate-90">
									<circle
										cx="64"
										cy="64"
										r="56"
										stroke="currentColor"
										strokeWidth="8"
										fill="none"
										className="text-gray-200"
									/>
									<circle
										cx="64"
										cy="64"
										r="56"
										stroke="currentColor"
										strokeWidth="8"
										fill="none"
										strokeDasharray={`${2 * Math.PI * 56}`}
										strokeDashoffset={`${2 * Math.PI * 56 * (1 - getMemoryUsage() / 100)}`}
										className="text-blue-500 transition-all duration-300"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-2xl font-bold">{getMemoryUsage().toFixed(1)}%</div>
										<div className="text-xs text-gray-500">{t('monitor.cache.memoryUsage')}</div>
									</div>
								</div>
							</div>
							<div className="ml-8 space-y-2">
								<div className="text-sm">
									<span className="text-gray-600">{t('monitor.cache.usedMemory')} </span>
									<span className="font-medium">{memoryInfo ? formatSize(memoryInfo.used) : '-'}</span>
								</div>
								<div className="text-sm">
									<span className="text-gray-600">{t('monitor.cache.totalMemory')} </span>
									<span className="font-medium">{memoryInfo ? formatSize(memoryInfo.total) : '-'}</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('monitor.cache.cacheList')}</div>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...searchForm}>
						<form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
							<div className="flex gap-4 items-end">
								<FormField
									control={searchForm.control}
									name="key"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('monitor.cache.keyName')}</FormLabel>
											<FormControl>
												<Input placeholder={t('monitor.cache.keyName')} {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="flex gap-2">
									<Button type="submit" disabled={loading}>
										<Icon icon="mdi:magnify" size={18} className="mr-2" />
										{t('monitor.cache.search')}
									</Button>
									<Button type="button" variant="outline" onClick={handleReset}>
										<Icon icon="mdi:refresh" size={18} className="mr-2" />
										{t('monitor.cache.reset')}
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
						rowKey="key"
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
						dataSource={keyList}
					/>
				</CardContent>
			</Card>

			<CacheModal {...cacheModalProps} />
		</>
	);
}
