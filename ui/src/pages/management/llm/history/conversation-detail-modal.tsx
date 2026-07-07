import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { ScrollArea } from "@/ui/scroll-area";
import { Separator } from "@/ui/separator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
	llmConversationService,
	type LlmConversation
} from "@/api/services/llmConversationService";
import type { LlmMessage } from "@/api/services/llmMessageService";

interface ConversationDetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	conversation?: LlmConversation | null;
}

export function ConversationDetailModal({
	open,
	onOpenChange,
	conversation
}: ConversationDetailModalProps) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState<LlmMessage[]>([]);

	const loadMessages = async () => {
		if (!conversation?.id) return;

		setLoading(true);
		try {
			const response = await llmConversationService.getMessages(conversation.id);
			setMessages(response || []);
		} catch (error) {
			console.error("Failed to load messages:", error);
			toast.error(t('llm.historyDetail.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open && conversation?.id) {
			loadMessages();
		}
	}, [open, conversation?.id]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Icon icon="mdi:chat" size={20} />
						{t('llm.historyDetail.title')}
					</DialogTitle>
				</DialogHeader>
				
				<div className="space-y-4 overflow-hidden flex flex-col h-[calc(90vh-8rem)]">
					{/* 会话信息 */}
					{conversation && (
						<div className="space-y-2 p-4 bg-muted/50 rounded-lg">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="flex items-center gap-2">
									<span className="font-medium text-muted-foreground">{t('llm.historyDetail.username')}:</span>
									<span>{conversation.username}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium text-muted-foreground">{t('llm.historyDetail.windowTitle')}:</span>
									<span className="truncate">{conversation.title}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium text-muted-foreground">{t('llm.historyDetail.chatCount')}:</span>
									<span>{conversation.chatTotal}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium text-muted-foreground">{t('llm.historyDetail.tokenUsage')}:</span>
									<span>{conversation.tokenUsed}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium text-muted-foreground">{t('llm.historyDetail.createdAt')}:</span>
									<span>{conversation.createTime}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium text-muted-foreground">{t('llm.historyDetail.lastChatTime')}:</span>
									<span>{conversation.endTime}</span>
								</div>
							</div>
						</div>
					)}

					<Separator />

					{/* 消息列表 */}
					<ScrollArea className="flex-1">
						<div className="space-y-4 p-4">
							{loading ? (
								<div className="flex items-center justify-center py-8">
									<Icon icon="mdi:loading" className="animate-spin" size={24} />
									<span className="ml-2">{t('llm.historyDetail.loading')}</span>
								</div>
							) : messages.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									{t('llm.historyDetail.noMessages')}
								</div>
							) : (
								messages.map((message, index) => (
									<div
										key={message.id || index}
										className={`flex ${
											message.role === "user" ? "justify-end" : "justify-start"
										}`}
									>
										<div
											className={`max-w-[70%] rounded-lg p-3 ${
												message.role === "user"
													? "bg-primary text-primary-foreground"
													: "bg-muted"
											}`}
										>
											{/* 消息头部 */}
											<div className="flex items-center gap-2 mb-2">
												<Badge
													variant={message.role === "user" ? "default" : "secondary"}
													className="text-xs"
												>
													{message.role === "user" ? t('llm.historyDetail.user') : t('llm.historyDetail.assistant')}
												</Badge>
											</div>

											{/* 消息内容 */}
											<div className="text-sm whitespace-pre-wrap break-words">
												{message.message}
											</div>

											{/* 消息底部信息 */}
											<div className="flex items-center gap-4 mt-2 text-xs opacity-70">
												<span>{message.createTime}</span>
												{message.completionTokens && (
													<span>Token: {message.completionTokens}</span>
												)}
												{message.promptTokens && (
													<span>Prompt: {message.promptTokens}</span>
												)}
												{message.ip && (
													<span>IP: {message.ip}</span>
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</ScrollArea>

					{/* 底部操作 */}
					<div className="flex justify-end">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{t('llm.historyDetail.close')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
