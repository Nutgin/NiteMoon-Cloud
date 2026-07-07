import { Card, CardContent } from "@/ui/card";
import { Text, Title } from "@/ui/typography";
import { useState, useEffect } from "react";
import Icon from "@/components/icon/icon";
import { useTranslation } from "react-i18next";

interface HistoryData {
	code: number;
	day: string;
	content: string[];
}

export default function HistoryTodayCard() {
	const { t } = useTranslation();
	const [historyData, setHistoryData] = useState<HistoryData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchHistoryData = async () => {
			try {
				setLoading(true);
				const response = await fetch('https://zj.v.api.aa1.cn/api/bk/?num=4&type=json');
				const data = await response.json();

				if (data.code === 200) {
					setHistoryData(data);
				} else {
					setError('获取历史数据失败');
				}
			} catch (err) {
				setError('网络请求失败');
				console.error('Error fetching history data:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchHistoryData();
	}, []);

	if (loading) {
		return (
			<Card className="w-full">
				<CardContent className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Icon icon="mdi:history" size={20} className="text-primary" />
						<Title as="h3" className="text-lg font-semibold">
							{t("dashboard.workbench.historyToday")}
						</Title>
					</div>
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="w-full">
				<CardContent className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Icon icon="mdi:history" size={20} className="text-primary" />
						<Title as="h3" className="text-lg font-semibold">
							{t("dashboard.workbench.historyToday")}
						</Title>
					</div>
					<div className="flex items-center gap-2 text-red-500 py-4">
						<Icon icon="mdi:alert-circle" size={16} />
						<Text variant="body2">{error}</Text>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full">
			<CardContent className="p-6">
				{/* 标题区域 */}
				<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
					<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
						<Icon icon="mdi:history" size={20} className="text-primary" />
					</div>
					<div>
						<Title as="h3" className="text-lg font-semibold text-foreground">
							{t("dashboard.workbench.historyToday")}
						</Title>
						<Text variant="body2" className="text-muted-foreground font-medium">
							{historyData?.day}
						</Text>
					</div>
				</div>

				{/* 历史事件列表 */}
				<div className="space-y-4">
					{historyData?.content.map((item, index) => (
						<div
							key={index}
							className="group flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-muted/50"
						>
							<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
								{index + 1}
							</div>
							<div className="flex-1 min-w-0">
								<Text variant="body2" className="text-foreground leading-relaxed">
									{item}
								</Text>
							</div>
						</div>
					))}
				</div>

				{/* 底部装饰 */}
				<div className="mt-6 pt-4 border-t border-border flex items-center justify-end">
					<div className="flex items-center gap-1 text-muted-foreground">
						<Icon icon="mdi:information-outline" size={14} />
						<Text variant="body2" className="text-xs">
							数据来源：历史API
						</Text>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
