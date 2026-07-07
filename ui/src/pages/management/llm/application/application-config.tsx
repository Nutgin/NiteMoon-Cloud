import { useState, useRef } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ChatMessageComponent } from "@/components/chat-message";
import { chatApi, type FileContent, type ChatChunk } from "@/api/services/llmChatService";
import { uploadFile } from "@/api/services/systemFileService";

interface ApplicationConfigProps {
	applicationId: string;
}

// 根据MIME类型判断文件类型
function getFileTypeByMime(mimeType: string): "image" | "audio" | "video" | null {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("audio/")) return "audio";
	if (mimeType.startsWith("video/")) return "video";
	return null;
}

export function ApplicationConfig({ applicationId }: ApplicationConfigProps) {
	const { t } = useTranslation();
	// 对话体验相关状态
	const [testMessages, setTestMessages] = useState<any[]>([]);
	const [testInput, setTestInput] = useState("");
	const [testLoading, setTestLoading] = useState(false);
	const [testController, setTestController] = useState<AbortController | null>(null);
	const [testConversationId, setTestConversationId] = useState<string>('');
	const [uploadedFiles, setUploadedFiles] = useState<FileContent[]>([]);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 生成会话ID
	const generateConversationId = (): string => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		}).replace(/-/g, '');
	};

	// 文件上传处理
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);
		try {
			for (const file of Array.from(files)) {
				const fileType = getFileTypeByMime(file.type);
				if (!fileType) {
					toast.error(t('llm.applicationConfig.unsupportedFileType', { type: file.type }));
					continue;
				}

				const formData = new FormData();
				formData.append("file", file);
				const result = await uploadFile(formData);

				const fileContent: FileContent = {
					type: fileType,
					url: typeof result === 'string' ? result : result.url,
					name: typeof result === 'string' ? file.name : (result.name || file.name),
					mimeType: file.type,
				};
				setUploadedFiles(prev => [...prev, fileContent]);
			}
		} catch (error) {
			console.error("文件上传失败:", error);
			toast.error(t('llm.applicationConfig.fileUploadFailed'));
		} finally {
			setUploading(false);
			// 清空input以允许重复上传同一文件
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const removeFile = (index: number) => {
		setUploadedFiles(prev => prev.filter((_, i) => i !== index));
	};

	// 对话体验功能
	const handleTestSendMessage = async () => {
		if (!testInput.trim() && uploadedFiles.length === 0) {
			toast.error(t('llm.applicationConfig.inputRequired'));
			return;
		}

		// 如果没有会话ID，生成新的
		let currentConversationId = testConversationId;
		if (!currentConversationId) {
			currentConversationId = generateConversationId();
			setTestConversationId(currentConversationId);
		}

		const userMessage = {
			chatId: Date.now().toString(),
			role: "user" as const,
			message: testInput.trim(),
			files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
			createTime: new Date().toLocaleTimeString(),
		};

		const aiMessageId = (Date.now() + 1).toString();
		const aiMessage = {
			chatId: aiMessageId,
			role: "assistant" as const,
			message: "",
			createTime: new Date().toLocaleTimeString(),
		};

		const currentInput = testInput.trim();
		const currentFiles = uploadedFiles.length > 0 ? [...uploadedFiles] : undefined;
		setTestMessages(prev => [...prev, userMessage, aiMessage]);
		setTestInput("");
		setUploadedFiles([]);
		setTestLoading(true);

		const controller = new AbortController();
		setTestController(controller);

		try {
			await chatApi(
				{
					chatId: aiMessageId,
					conversationId: currentConversationId,
					appId: applicationId,
					message: currentInput,
					role: 'user',
					files: currentFiles,
				},
				controller,
				(chunk: ChatChunk) => {
					const { data, eventType } = chunk;
					if (data.startsWith('data:Error')) {
						setTestMessages(prev =>
							prev.map(msg =>
								msg.chatId === aiMessageId
									? { ...msg, message: data.substring(10), isError: true }
									: msg
							)
						);
						return;
					}

					try {
						const parsed = JSON.parse(data);

						// Skip parallel branch/status events
						if (eventType === 'branch' || eventType === 'parallel-status') {
							return;
						}

						const { done, message: responseMessage, toolName, toolStatus } = parsed;

						if (done) {
							setTestLoading(false);
							setTestController(null);
							return;
						}

						// Tool events
						if (eventType === 'tool_call' && toolName) {
							return;
						}
						if (eventType === 'tool_result' && toolName) {
							return;
						}

						// Regular message — append to display
						if (responseMessage != null && responseMessage !== '') {
							setTestMessages(prev =>
								prev.map(msg =>
									msg.chatId === aiMessageId
										? { ...msg, message: (msg.message || '') + responseMessage }
										: msg
								)
							);
						}
					} catch (e) {
						console.error('Parse JSON error:', e, 'Chunk:', data);
					}
				}
			);
		} catch (error) {
			console.error("发送消息失败:", error);
			setTestMessages(prev =>
				prev.map(msg =>
					msg.chatId === aiMessageId
						? { ...msg, message: t('llm.applicationConfig.sendFailed'), isError: true }
						: msg
				)
			);
			toast.error(t('llm.applicationConfig.sendMessageFailed'));
		} finally {
			setTestLoading(false);
		}
	};

	const handleTestKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleTestSendMessage();
		}
	};

	const handleDeleteTestMessage = (messageToDelete: any) => {
		setTestMessages(prev => prev.filter(msg => msg.chatId !== messageToDelete.chatId));
	};

	const handleStopTest = () => {
		if (testController) {
			testController.abort();
			setTestController(null);
			setTestLoading(false);
		}
	};

	// 清空测试对话
	const handleClearTestChat = () => {
		if (window.confirm(t('llm.applicationConfig.confirmClear'))) {
			setTestMessages([]);
			setTestConversationId('');
			setUploadedFiles([]);
		}
	};

	return (
		<div className="h-[68vh] flex flex-col p-2">
			{/* 对话体验 */}
			<div className="flex-1 bg-white rounded-lg p-4 flex flex-col">
				<div className="flex items-center justify-between mb-4">
					<CardTitle className="text-lg font-semibold">{t('llm.applicationConfig.chatTest')}</CardTitle>
				</div>

				{/* 消息列表 */}
				<div className="flex-1 overflow-y-auto p-3 space-y-3 border rounded-lg bg-gray-50">
					{testMessages.length === 0 ? (
						<div className="text-center text-gray-500 mt-8">
							<Icon icon="mdi:chat" size={48} className="mx-auto mb-4 text-gray-300" />
							<p>{t('llm.applicationConfig.startChat')}</p>
							<p className="text-sm">{t('llm.applicationConfig.chatHint')}</p>
						</div>
					) : (
						testMessages.map((message, index) => (
							<div key={message.chatId}>
								{testLoading && message.role === 'assistant' && index === testMessages.length - 1 && !message.message && (
									<div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
										<div className="flex items-center gap-2 text-blue-700">
											<Icon icon="mdi:robot" size={14} className="text-blue-600" />
											<Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300">{t('llm.applicationConfig.aiAssistant')}</Badge>
											<Icon icon="mdi:loading" className="h-3 w-3 animate-spin text-blue-600" />
											<span className="text-xs font-medium">{t('llm.applicationConfig.thinking')}</span>
										</div>
									</div>
								)}
								{/* 显示用户上传的文件 */}
								{message.role === 'user' && message.files && message.files.length > 0 && (
									<div className="flex justify-end mb-1">
										<div className="flex gap-1.5 flex-wrap max-w-xs">
											{message.files.map((file: FileContent, fi: number) => (
												<div key={fi} className="relative group">
													{file.type === 'image' ? (
														<img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded border" />
													) : file.type === 'audio' ? (
														<div className="w-16 h-16 flex items-center justify-center rounded border bg-muted">
															<Icon icon="mdi:music-note" size={20} className="text-muted-foreground" />
														</div>
													) : (
														<div className="w-16 h-16 flex items-center justify-center rounded border bg-muted">
															<Icon icon="mdi:video" size={20} className="text-muted-foreground" />
														</div>
													)}
													<span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-white truncate px-0.5 rounded-b">
														{file.name}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
								<ChatMessageComponent
									message={message}
									onDelete={handleDeleteTestMessage}
								/>
							</div>
						))
					)}
				</div>

				{/* 输入框 */}
				<div className="border-t p-3 mt-3 bg-gray-50 rounded-b-lg">
					{/* 文件预览区 */}
					{uploadedFiles.length > 0 && (
						<div className="flex gap-2 mb-2 flex-wrap">
							{uploadedFiles.map((file, index) => (
								<div key={index} className="relative group">
									{file.type === 'image' ? (
										<img src={file.url} alt={file.name} className="w-14 h-14 object-cover rounded border" />
									) : file.type === 'audio' ? (
										<div className="w-14 h-14 flex items-center justify-center rounded border bg-muted">
											<Icon icon="mdi:music-note" size={18} className="text-muted-foreground" />
										</div>
									) : (
										<div className="w-14 h-14 flex items-center justify-center rounded border bg-muted">
											<Icon icon="mdi:video" size={18} className="text-muted-foreground" />
										</div>
									)}
									<button
										type="button"
										className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={() => removeFile(index)}
									>
										<Icon icon="mdi:close" size={10} />
									</button>
									<span className="block text-[8px] text-muted-foreground text-center truncate max-w-14">
										{file.name}
									</span>
								</div>
							))}
						</div>
					)}

					<div className="flex gap-2">
						<input
							ref={fileInputRef}
							type="file"
							className="hidden"
							accept="image/*,audio/*,video/*"
							multiple
							onChange={handleFileUpload}
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading || testLoading}
							title={t('llm.applicationConfig.uploadFile')}
						>
							<Icon icon={uploading ? "mdi:loading" : "mdi:paperclip"} size={14} className={uploading ? "animate-spin" : ""} />
						</Button>
						<Input
							value={testInput}
							onChange={(e) => setTestInput(e.target.value)}
							onKeyPress={handleTestKeyPress}
							placeholder={t('llm.applicationConfig.inputPlaceholder')}
							disabled={testLoading}
							className="flex-1"
						/>
						{testMessages.length > 0 && !testLoading && (
							<Button
								onClick={handleClearTestChat}
								variant="outline"
								size="sm"
								title={t('llm.applicationConfig.clearChat')}
							>
								<Icon icon="mdi:delete-sweep" size={14} />
							</Button>
						)}
						{!testLoading ? (
							<Button
								onClick={handleTestSendMessage}
								disabled={!testInput.trim() && uploadedFiles.length === 0}
								size="sm"
							>
								<Icon icon="mdi:send" size={14} className="mr-1" />
								{t('llm.applicationConfig.send')}
							</Button>
						) : (
							<Button
								onClick={handleStopTest}
								variant="outline"
								size="sm"
							>
								<Icon icon="ri:stop-circle-line" size={14} className="mr-1" />
								{t('llm.applicationConfig.stop')}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
