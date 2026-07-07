import { Icon } from "@/components/icon";
import { useUserInfo } from "@/store/userStore";
import { themeVars } from "@/theme/theme.css";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Text } from "@/ui/typography";
import { Timeline } from "antd";
import { useEffect, useState } from "react";
import { getUserById } from "@/api/auth/login";
import type { UserInfo } from "#/entity";
import { toast } from "sonner";
import { useDeptList, useRoleList } from "@/store/userStore";
import { useTranslation } from "react-i18next";
import { queryLoginLog, type LoginLog } from "@/api/services/systemLoginlogService";

export default function ProfileTab() {
	const { username, id } = useUserInfo();
	const deptList = useDeptList();
	const roleList = useRoleList();
	const { t } = useTranslation();
	const [userDetails, setUserDetails] = useState<Partial<UserInfo>>({});
	const [loading, setLoading] = useState(false);
	const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
	const [loginLogsLoading, setLoginLogsLoading] = useState(false);
	const [hotNews, setHotNews] = useState<Array<{ rank: number; title: string; hot: number; tag: string; desc: string; url: string }>>([]);
	const [hotNewsLoading, setHotNewsLoading] = useState(false);

	// Fetch user details when component mounts
	useEffect(() => {
		const fetchUserDetails = async () => {
			if (!id) {
				console.log('No user ID available');
				return;
			}

			setLoading(true);
			try {
				const response = await getUserById(id);
				console.log('User details response:', response);
				// API client already extracts the data field from { code: 0, data: {...} }
				if (response) {
					setUserDetails(response);
				}
			} catch (error) {
				console.error('Failed to fetch user details:', error);
				toast.error('Failed to fetch user details');
			} finally {
				setLoading(false);
			}
		};

		fetchUserDetails();
	}, [id]);

	// Fetch login logs when component mounts
	useEffect(() => {
		const fetchLoginLogs = async () => {
			if (!username) {
				console.log('No username available');
				return;
			}

			setLoginLogsLoading(true);
			try {
				const response = await queryLoginLog({
					pageNum: 1,
					pageSize: 3,
					userName: username
				});
				console.log('Login logs response:', response);
				if (response && response.records) {
					setLoginLogs(response.records);
				}
			} catch (error) {
				console.error('Failed to fetch login logs:', error);
				toast.error('Failed to fetch login logs');
			} finally {
				setLoginLogsLoading(false);
			}
		};

		fetchLoginLogs();
	}, [username]);

	// Fetch hot news when component mounts
	useEffect(() => {
		const fetchHotNews = async () => {
			setHotNewsLoading(true);
			try {
				const response = await fetch('https://api.mxin.moe/api/v1/hot?limit=5');
				const data = await response.json();
				console.log('Hot news response:', data);
				if (data && data.code === 0 && data.data && data.data.list) {
					setHotNews(data.data.list);
				}
			} catch (error) {
				console.error('Failed to fetch hot news:', error);
				toast.error('Failed to fetch hot news');
			} finally {
				setHotNewsLoading(false);
			}
		};

		fetchHotNews();
	}, []);
	// Helper function to get name by id from list
	const getNameById = (id: string | undefined, list: Array<{ id: string; name: string }>) => {
		if (!id) return "N/A";
		const item = list.find(item => item.id === id);
		return item?.name || id;
	};

	const AboutItems = [
		{
			icon: <Icon icon="fa-solid:user" size={18} />,
			label: t("common.nickName"),
			val: userDetails.nikeName || username,
		},
		{
			icon: <Icon icon="eos-icons:role-binding" size={18} />,
			label: t("common.role"),
			val: userDetails.roles?.map(roleId => getNameById(roleId, roleList)).join(', ') || "Developer",
		},
		{
			icon: <Icon icon="tabler:location-filled" size={18} />,
			label: t("common.dept"),
			val: getNameById(userDetails.deptId, deptList),
		},
		{
			icon: <Icon icon="ph:phone-fill" size={18} />,
			label: t("common.contact"),
			val: userDetails.phone || "N/A",
		},
		{
			icon: <Icon icon="ic:baseline-email" size={18} />,
			label: t("common.email"),
			val: userDetails.email || username,
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>{t("common.about")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-4">
							{AboutItems.map((item) => (
								<div className="flex" key={item.label}>
									<div className="mr-2">{item.icon}</div>
									<div className="mr-2">{item.label}:</div>
									<div className="opacity-50">{item.val}</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-1 md:col-span-2">
					<CardHeader>
						<CardTitle>{t("common.activityTimeline")}</CardTitle>
					</CardHeader>
					<CardContent>
						{loginLogsLoading ? (
							<div className="flex justify-center py-4">
								<Text>Loading login history...</Text>
							</div>
						) : loginLogs.length > 0 ? (
							<Timeline
								className="mt-4! w-full"
								items={loginLogs.map((log) => ({
									color: log.status === "1" ? themeVars.colors.palette.success.default : themeVars.colors.palette.error.default,
									children: (
										<div className="flex flex-col">
											<div className="flex items-center justify-between">
												<Text>{log.status === "1" ? t("common.loginSuccess") : t("common.loginFailed")}</Text>
												<div className="opacity-50">{log.createTime}</div>
											</div>
											<Text variant="caption" color="secondary">
												{log.msg}
											</Text>
											<div className="mt-2 flex items-center gap-4 text-xs opacity-60">
												<span>IP: {log.ipAddr}</span>
												<span>位置: {log.location}</span>
												<span>浏览器: {log.browser}</span>
												<span>系统: {log.os}</span>
											</div>
										</div>
									),
								}))}
							/>
						) : (
							<div className="flex justify-center py-4">
								<Text variant="caption" color="secondary">
									No login history available
								</Text>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
			<div className="flex flex-col md:flex-row gap-4">
				<div className="flex-1">
					<Card>
						<CardHeader>
							<CardTitle className="w-full flex items-center justify-between">
								<span>{t("common.hotNews")}</span>
								<Button variant="ghost" size="icon">
									<Icon icon="fontisto:more-v-a" />
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent>
							{hotNewsLoading ? (
								<div className="flex justify-center py-4">
									<Text>Loading hot news...</Text>
								</div>
							) : hotNews.length > 0 ? (
								<div className="flex w-full flex-col gap-3">
									{hotNews.map((news) => (
										<div
											className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
											key={news.rank}
											onClick={() => window.open(news.url, '_blank')}
										>
											<div
												className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-medium"
												style={{
													backgroundColor: news.rank <= 3 ? themeVars.colors.palette.primary.default : "transparent",
													color: news.rank <= 3 ? "#fff" : themeVars.colors.palette.primary.default,
													border: news.rank > 3 ? `1px solid ${themeVars.colors.palette.primary.default}` : ""
												}}
											>
												{news.rank}
											</div>
											<div className="flex-1 min-w-0">
												<span className="text-sm font-medium line-clamp-1">{news.title}</span>
											</div>
											<div className="flex-none flex items-center gap-1">
												<Icon
													icon="mdi:fire"
													size={news.rank === 1 ? 25 : news.rank <= 3 ? 20 : news.rank <= 5 ? 14 : 12}
													color={news.rank === 1 ? "#dc2626" : news.rank <= 3 ? "#ef4444" : news.rank <= 5 ? "#f97316" : "#eab308"}
												/>
												<span className="text-xs opacity-60">
													{news.hot >= 10000 ? `${(news.hot / 10000).toFixed(1)}w` : news.hot.toString()}
												</span>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="flex justify-center py-4">
									<Text variant="caption" color="secondary">
										No hot news available
									</Text>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
