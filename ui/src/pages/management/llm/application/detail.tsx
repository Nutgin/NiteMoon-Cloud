import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useRouter } from "@/routes/hooks/use-router";
import { Icon } from "@/components/icon";
import { AppImage } from "@/components/app-image";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getAppInfoApi, type LlmApplication } from "@/api/services/llmApplicationService";
import { ApplicationConfig } from "./application-config";
import { ApiChannel } from "./api-channel";
import { ApplicationWorkflow } from "./application-workflow";
import { ExecutionRecord } from "./execution-record";

export default function ApplicationDetailPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const id = searchParams.get("id");
	const router = useRouter();

	const [application, setApplication] = useState<LlmApplication | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "chat");

	const fetchApplicationInfo = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getAppInfoApi({
				appId: id || "",
				conversationId: null,
				_t: Date.now().toString(),
			});
			setApplication(data);
		} catch (error) {
			console.error("获取应用信息失败:", error);
			toast.error(t('llm.applicationDetail.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		if (id) {
			fetchApplicationInfo();
		}
	}, [id, fetchApplicationInfo]);

	const handleBack = () => {
		router.push("/aigc/application");
	};

	const formatTime = (timeStr?: string) => {
		if (!timeStr) return "";
		return new Date(timeStr).toLocaleString();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		);
	}

	if (!application) {
		return (
			<div className="text-center py-12">
				<Icon icon="mdi:application" size={48} className="mx-auto mb-4 text-gray-400" />
				<p className="text-gray-500">{t('llm.applicationDetail.notFound')}</p>
				<Button onClick={handleBack} className="mt-4">
					<Icon icon="mdi:arrow-left" size={18} className="mr-2" />
					{t('llm.applicationDetail.backToList')}
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full h-full space-y-4">
			{/* 头部信息 */}
			<Card>
				<CardContent className="p-4">
					<div className="flex justify-between items-center">
						<div className="flex gap-5 items-center min-w-20">
							<Button variant="ghost" size="sm" onClick={handleBack}>
								<Icon icon="icon-park-outline:back" size={20} />
							</Button>
							<div className="flex gap-2 items-center pr-4">
								<div className="mr-3">
									{application.cover ? (
										<div className="relative w-16 h-16 rounded-lg overflow-hidden">
											<AppImage
												src={application.cover}
												alt={application.name}
												className="w-full h-full object-cover"
												showLoading={false}
											/>
										</div>
									) : (
										<div className="relative bg-orange-100 p-4 rounded-lg">
											<Icon icon="prime:microchip-ai" size={24} className="text-orange-600" />
											<div
												className="absolute bottom-[-6px] p-1 right-[-5px] shadow bg-white mx-auto rounded-lg"
											>
												<Icon icon="lucide:bot" size={14} className="text-orange-500" />
											</div>
										</div>
									)}
								</div>

								<div className="flex flex-col justify-between gap-2">
									<div className="font-bold text-lg">{application.name}</div>
									<span className="text-gray-400 text-xs">{t('llm.applicationDetail.createdAt', { time: formatTime(application.createTime) })}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{[
								{ key: 'chat', icon: 'mdi:chat-processing', label: t('llm.applicationDetail.chatTab') },
								{ key: 'api', icon: 'hugeicons:api', label: t('llm.applicationDetail.apiTab') },
								{ key: 'workflow', icon: 'mdi:workflow', label: t('llm.applicationDetail.workflowTab') },
								{ key: 'execution', icon: 'mdi:history', label: t('llm.executionRecord.tab') },
							].map((item) => (
								<Button
									key={item.key}
									variant={activeTab === item.key ? 'default' : 'outline'}
									className="!px-5 !rounded-2xl"
									onClick={() => setActiveTab(item.key)}
								>
									<Icon icon={item.icon} size={16} className="mr-2" />
									{item.label}
								</Button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 标签页内容 */}
			{application.name !== undefined && (
				<Card className="flex-1">
					<CardContent className="p-0">
						{activeTab === 'chat' && (
							<ApplicationConfig applicationId={application.id || ""} />
						)}

						{activeTab === 'api' && (
							<ApiChannel applicationId={application.id || ""} />
						)}

						{activeTab === 'workflow' && (
							<ApplicationWorkflow applicationId={application.id || ""} />
						)}

						{activeTab === 'execution' && (
							<ExecutionRecord applicationId={application.id || ""} />
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
