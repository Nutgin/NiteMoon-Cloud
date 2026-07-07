import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import Table, { type ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	getOnlineUserList,
	forceLogout,
	type OnlineUser,
	type OnlineUserQueryParams
} from "@/api/services/systemOnlineService";
import { OnlineModal, type OnlineModalProps } from "./online-modal";

export default function OnlinePage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [onlineUserList, setOnlineUserList] = useState<OnlineUser[]>([]);
	const [total, setTotal] = useState(0);

	const [onlineModalProps, setOnlineModalProps] = useState<OnlineModalProps>({
		formValue: {
			tokenId: "",
			userName: "",
			ipAddr: "",
			location: "",
			browser: "",
			os: "",
			loginTime: "",
			tokenTimeout: 0,
			tenantId: "",
		},
		title: t('monitor.online.title'),
		show: false,
		onOk: () => {
			setOnlineModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setOnlineModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const loadOnlineUsers = async () => {
		setLoading(true);
		try {
			const response = await getOnlineUserList();
			setOnlineUserList(response || []);
			setTotal(response?.length || 0);
		} catch (error) {
			console.error("Failed to load online users:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleKickOut = async (tokenId: string, userName: string) => {
		try {
			await forceLogout(tokenId);
			toast.success(t('monitor.online.userKicked', { userName }));
			loadOnlineUsers();
		} catch (error) {
			console.error("Failed to kick out user:", error);
		}
	};

	const getBrowserIcon = (browser: string) => {
		const lowerBrowser = browser.toLowerCase();
		if (lowerBrowser.includes('chrome') && !lowerBrowser.includes('edge')) {
			return "mdi:google-chrome";
		}
		if (lowerBrowser.includes('firefox')) {
			return "mdi:firefox";
		}
		if (lowerBrowser.includes('safari') && !lowerBrowser.includes('chrome')) {
			return "mdi:apple-safari";
		}
		if (lowerBrowser.includes('edge')) {
			return "mdi:microsoft-edge";
		}
		return "mdi:web";
	};

	const getOSBadge = (os: string) => {
		const lowerOS = os.toLowerCase();
		if (lowerOS.includes('windows')) {
			return { variant: "destructive" as const, icon: "mdi:microsoft-windows", text: "Windows" };
		}
		if (lowerOS.includes('mac') || lowerOS.includes('darwin')) {
			return { variant: "default" as const, icon: "mdi:apple", text: "macOS" };
		}
		if (lowerOS.includes('linux')) {
			return { variant: "secondary" as const, icon: "mdi:linux", text: "Linux" };
		}
		return { variant: "outline" as const, icon: "mdi:desktop-classic", text: os };
	};

	const columns: ColumnsType<OnlineUser> = [
		{
			title: "Token ID",
			dataIndex: "tokenId",
			width: 200,
			ellipsis: true,
		},
		{
			title: t('monitor.online.account'),
			dataIndex: "userName",
			width: 120,
			ellipsis: true,
		},
		{
			title: t('monitor.online.loginIp'),
			dataIndex: "ipAddr",
			width: 140,
			render: (ipAddr: string) => (
				<div className="flex items-center gap-2">
					<Icon icon="mdi:desktop-mac" size={16} className="text-gray-500" />
					<span>{ipAddr}</span>
				</div>
			),
		},
		{
			title: t('monitor.online.loginLocation'),
			dataIndex: "location",
			width: 180,
			ellipsis: true,
			render: (location: string) => (
				<div className="flex items-center gap-2">
					<Icon icon="mdi:map-marker" size={16} className="text-gray-500" />
					<span>{location}</span>
				</div>
			),
		},
		{
			title: t('monitor.online.browser'),
			dataIndex: "browser",
			width: 180,
			ellipsis: true,
			render: (browser: string) => (
				<div className="flex items-center gap-2">
					<Icon icon={getBrowserIcon(browser)} size={16} className="text-gray-500" />
					<span>{browser}</span>
				</div>
			),
		},
		{
			title: t('monitor.online.os'),
			dataIndex: "os",
			width: 120,
			render: (os: string) => {
				const osInfo = getOSBadge(os);
				return (
					<Badge
						variant={osInfo.variant}
						className="flex items-center gap-1 w-fit dark:bg-white dark:text-black"
					>
						<Icon icon={osInfo.icon} size={14} />
						{osInfo.text}
					</Badge>
				);
			},
		},
		{
			title: t('monitor.online.loginTime'),
			dataIndex: "loginTime",
			width: 180,
			ellipsis: true,
		},
		{
			title: t('monitor.online.actions'),
			key: "operation",
			align: "center",
			width: 120,
			render: (_, record) => (
				<div className="flex w-full justify-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onView(record)}
						title={t('monitor.online.viewDetail')}
					>
						<Icon icon="solar:eye-bold-duotone" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleKickOut(record.tokenId, record.userName)}
						title={t('monitor.online.kick')}
						className="text-red-500 hover:text-red-700"
					>
						<Icon icon="mdi:logout" size={18} />
					</Button>
				</div>
			),
		},
	];

	const onView = (record: OnlineUser) => {
		setOnlineModalProps({
			formValue: record,
			title: t('monitor.online.title'),
			show: true,
			onOk: () => {
				setOnlineModalProps((prev) => ({ ...prev, show: false }));
			},
			onCancel: () => {
				setOnlineModalProps((prev) => ({ ...prev, show: false }));
			},
		});
	};

	useEffect(() => {
		loadOnlineUsers();
	}, []);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t('monitor.online.title')}</div>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Icon icon="mdi:account-group" size={18} />
							<span>{t('monitor.online.onlineCount', { total })}</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table
						rowKey="tokenId"
						size="small"
						scroll={{ x: "max-content" }}
						pagination={false}
						loading={loading}
						columns={columns}
						dataSource={onlineUserList}
					/>
				</CardContent>
			</Card>

			<OnlineModal {...onlineModalProps} />
		</>
	);
}
