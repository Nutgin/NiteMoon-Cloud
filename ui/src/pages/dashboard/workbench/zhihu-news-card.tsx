import { Card, CardContent } from "@/ui/card";
import { Text, Title } from "@/ui/typography";
import { useState, useEffect } from "react";
import Icon from "@/components/icon/icon";
import { useTranslation } from "react-i18next";

interface NewsItem {
	image_hue: string;
	title: string;
	url: string;
	image: string;
	hint: string;
	share_url: string;
	thumbnail: string;
	ga_prefix: string;
	id: number;
}

interface ZhihuNewsData {
	date: string;
	news: NewsItem[];
	is_today: boolean;
	top_stories: NewsItem[];
	display_date: string;
}

export default function ZhihuNewsCard() {
	const { t } = useTranslation();
	const [newsData, setNewsData] = useState<ZhihuNewsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchNewsData = async () => {
			try {
				setLoading(true);
				const response = await fetch('https://v.api.aa1.cn/api/zhihu-news/index.php?aa1=xiarou');
				const data = await response.json();

				if (data && data.news) {
					setNewsData(data);
				} else {
					setError('获取新闻数据失败');
				}
			} catch (err) {
				setError('网络请求失败');
				console.error('Error fetching news data:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchNewsData();
	}, []);

	const openNews = (url: string) => {
		window.open(url, '_blank');
	};

	if (loading) {
		return (
			<Card className="w-full">
				<CardContent className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Icon icon="mdi:newspaper" size={20} className="text-primary" />
						<Title as="h3" className="text-lg font-semibold">
							{t("dashboard.workbench.zhihuNews")}
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
						<Icon icon="mdi:newspaper" size={20} className="text-primary" />
						<Title as="h3" className="text-lg font-semibold">
							{t("dashboard.workbench.zhihuNews")}
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
						<Icon icon="mdi:newspaper" size={20} className="text-primary" />
					</div>
					<div>
						<Title as="h3" className="text-lg font-semibold text-foreground">
							{t("dashboard.workbench.zhihuNews")}
						</Title>
						<Text variant="body2" className="text-muted-foreground font-medium">
							{newsData?.display_date}
						</Text>
					</div>
				</div>

				{/* 新闻列表 */}
				<div className="space-y-3 max-h-96 overflow-y-auto">
					{newsData?.news.slice(0, 5).map((item, index) => (
						<div
							key={item.id}
							className="group flex items-start gap-5 p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer"
							onClick={() => openNews(item.url)}
						>
							<div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
								{index + 1}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-start gap-3">
									<div className="flex-1 min-w-0">
										<Text variant="body2" className="text-foreground font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
											{item.title}
										</Text>
										<Text variant="body2" className="text-muted-foreground text-xs mt-1">
											{item.hint}
										</Text>
									</div>
									{item.thumbnail && (
										<img
											src={item.thumbnail}
											alt={item.title}
											className="w-14 h-14 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
											onError={(e) => {
												e.currentTarget.style.display = 'none';
											}}
										/>
									)}
								</div>
							</div>
						</div>
					))}
				</div>

				{/* 底部装饰 */}
				<div className="mt-6 pt-4 border-t border-border flex items-center justify-end">
					<div className="flex items-center gap-1 text-muted-foreground">
						<Icon icon="mdi:information-outline" size={14} />
						<Text variant="body2" className="text-xs">
							数据来源：知乎日报
						</Text>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
