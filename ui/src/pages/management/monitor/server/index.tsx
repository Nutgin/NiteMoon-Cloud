import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Progress } from "@/ui/progress";
import Table, { type ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	getServerInfo,
	type ServerInfo,
	type SysFile
} from "@/api/services/systemServerService";
import { ServerModal, type ServerModalProps } from "./server-modal";

export default function ServerPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const [serverModalProps, setServerModalProps] = useState<ServerModalProps>({
		formValue: {
			dirName: "",
			typeName: "",
			total: 0,
			free: 0,
			used: 0,
			usage: 0,
		},
		title: t('monitor.server.diskInfo'),
		show: false,
		onOk: () => {
			setServerModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setServerModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const loadServerInfo = async (showLoading = false) => {
		if (showLoading) {
			setLoading(true);
		}
		try {
			const response = await getServerInfo();
			setServerInfo(response);
		} catch (error) {
			console.error("Failed to load server info:", error);
			if (showLoading) {
				toast.error(t('monitor.server.loadFailed'));
			}
		} finally {
			if (showLoading) {
				setLoading(false);
			}
		}
	};

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
	};

	const formatPercentage = (value: number): string => {
		return Math.round(value * 100) / 100;
	};

	const formatPercentage2 = (value: number): string => {
		const formatted = Math.round(value * 100) / 100;
		return formatted.toFixed(2);
	};

	const getProgressColor = (usage: number) => {
		if (usage < 30) return 'bg-green-500';
		if (usage < 70) return 'bg-yellow-500';
		return 'bg-red-500';
	};

	const columns: ColumnsType<SysFile> = [
		{
			title: t('monitor.server.diskPath'),
			dataIndex: "dirName",
			width: 120,
		},
		{
			title: t('monitor.server.fileSystem'),
			dataIndex: "typeName",
			width: 150,
		},
		{
			title: t('monitor.server.totalSize'),
			dataIndex: "total",
			width: 120,
			render: (total: string | number) => typeof total === 'string' ? total : formatBytes(total),
		},
		{
			title: t('monitor.server.availableSize'),
			dataIndex: "free",
			width: 120,
			render: (free: string | number) => typeof free === 'string' ? free : formatBytes(free),
		},
		{
			title: t('monitor.server.usedSize'),
			dataIndex: "used",
			width: 120,
			render: (used: string | number) => typeof used === 'string' ? used : formatBytes(used),
		},
		{
			title: t('monitor.server.diskUsage'),
			dataIndex: "usage",
			width: 150,
			render: (usage: number) => (
				<Progress
					value={usage}
					className="w-full"
					style={{
						'& .ant-progress-bg': getProgressColor(usage)
					}}
				/>
			),
		},
		{
			title: t('monitor.server.actions'),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onView(record)}
						title={t('monitor.server.viewDetail')}
					>
						<Icon icon="solar:eye-bold-duotone" size={18} />
					</Button>
				</div>
			),
		},
	];

	const onView = (record: SysFile) => {
		setServerModalProps({
			formValue: record,
			title: t('monitor.server.diskInfo'),
			show: true,
			onOk: () => {
				setServerModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setServerModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	const handleRefresh = () => {
		loadServerInfo(true);
		toast.success(t('monitor.server.refreshed'));
	};

	useEffect(() => {
		loadServerInfo(true);

		intervalRef.current = setInterval(() => {
			loadServerInfo(false);
		}, 10000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, []);

	return (
		<>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>{t('monitor.server.cpuUsage')}</div>
							<Button size="sm" onClick={handleRefresh}>
								<Icon icon="mdi:refresh" size={16} className="mr-1" />
								{t('monitor.server.refresh')}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-center mb-6">
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
										strokeDashoffset={`${2 * Math.PI * 56 * (1 - (formatPercentage(serverInfo?.cpu?.used || 0) / 100))}`}
										className="text-blue-500 transition-all duration-300"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-2xl font-bold">{formatPercentage2(serverInfo?.cpu?.used || 0)}%</div>
										<div className="text-xs text-gray-500">{t('monitor.server.cpuUsage')}</div>
									</div>
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.cores')}</span>
								<span className="font-medium">{serverInfo?.cpu?.cpuNum || '-'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.userUsage')}</span>
								<span className="font-medium">{formatPercentage2(serverInfo?.cpu?.used || 0)}%</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.systemUsage')}</span>
								<span className="font-medium">{formatPercentage2(serverInfo?.cpu?.sys || 0)}%</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.idleRate')}</span>
								<span className="font-medium">{formatPercentage2(serverInfo?.cpu?.free || 0)}%</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div>{t('monitor.server.memoryUsage')}</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-center mb-6">
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
										strokeDashoffset={`${2 * Math.PI * 56 * (1 - (serverInfo?.mem?.usage || 0) / 100)}`}
										className="text-green-500 transition-all duration-300"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-2xl font-bold">{(serverInfo?.mem?.usage || 0).toFixed(1)}%</div>
										<div className="text-xs text-gray-500">{t('monitor.server.memoryUsage')}</div>
									</div>
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.totalMemory')}</span>
								<span className="font-medium">{serverInfo?.mem?.total ? formatBytes(serverInfo.mem.total) : '-'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.usedMemory')}</span>
								<span className="font-medium">{serverInfo?.mem?.used ? formatBytes(serverInfo.mem.used) : '-'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.freeMemory')}</span>
								<span className="font-medium">{serverInfo?.mem?.free ? formatBytes(serverInfo.mem.free) : '-'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">{t('monitor.server.usageRate')}</span>
								<span className="font-medium">{(serverInfo?.mem?.usage || 0).toFixed(2)}%</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="mb-6">
				<CardHeader>
					<div>{t('monitor.server.serverInfo')}</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.serverName')}</span>
							<span className="font-medium">{serverInfo?.sys?.computerName || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.os')}</span>
							<span className="font-medium">{serverInfo?.sys?.osName || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.serverIp')}</span>
							<span className="font-medium">{serverInfo?.sys?.computerIp || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.architecture')}</span>
							<span className="font-medium">{serverInfo?.sys?.osArch || '-'}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="mb-6">
				<CardHeader>
					<div>{t('monitor.server.jvmInfo')}</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.jvmName')}</span>
							<span className="font-medium">{serverInfo?.jvm?.name || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.jvmVersion')}</span>
							<span className="font-medium">{serverInfo?.jvm?.version || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.startTime')}</span>
							<span className="font-medium">{serverInfo?.jvm?.startTime || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.runTime')}</span>
							<span className="font-medium">{serverInfo?.jvm?.runTime || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.installPath')}</span>
							<span className="font-medium text-xs">{serverInfo?.jvm?.home || '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">{t('monitor.server.projectPath')}</span>
							<span className="font-medium text-xs">{serverInfo?.sys?.userDir || '-'}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div>{t('monitor.server.diskInfo')}</div>
				</CardHeader>
				<CardContent>
					<Table
						rowKey="dirName"
						size="small"
						scroll={{ x: "max-content" }}
						pagination={false}
						loading={loading}
						columns={columns}
						dataSource={serverInfo?.sysFiles || []}
					/>
				</CardContent>
			</Card>

			<ServerModal {...serverModalProps} />
		</>
	);
}
