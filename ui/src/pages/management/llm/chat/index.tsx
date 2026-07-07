import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { ScrollArea } from '@/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Card, CardContent, CardHeader } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { toast } from 'sonner';
import { ChatMessageComponent } from '@/components/chat-message/index';
import {
	getMessagesApi,
	chatApi,
	cleanChatApi,
	getAppPrologueApi,
	type ChatMessage,
	type ChatChunk,
	type ToolCallInfo,
	type FileContent,
} from '@/api/services/llmChatService';
import { uploadFile } from '@/api/services/systemFileService';
import {
	getApplicationListApi,
	type LlmApplication
} from '@/api/services/llmApplicationService';
import {
	llmConversationService,
	type LlmConversation,
} from '@/api/services/llmConversationService';

const generateUUID = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

const generateConversationId = (): string => {
	return generateUUID().replace(/-/g, '');
};

function getFileTypeByMime(mimeType: string): "image" | "audio" | "video" | null {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("audio/")) return "audio";
	if (mimeType.startsWith("video/")) return "video";
	return null;
}

export default function ChatPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [selectedApp, setSelectedApp] = useState<string>('');
	const [applications, setApplications] = useState<LlmApplication[]>([]);
	const [conversationId, setConversationId] = useState<string>('');
	const [conversationList, setConversationList] = useState<LlmConversation[]>([]);
	const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
	const [uploadedFiles, setUploadedFiles] = useState<FileContent[]>([]);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const controllerRef = useRef<AbortController | null>(null);

	const scrollToBottom = () => {
		const containers = [
			contentRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
			contentRef.current,
			scrollRef.current
		];
		for (const c of containers) {
			if (c) { c.scrollTop = c.scrollHeight; break; }
		}
	};

	const forceScrollToBottom = () => {
		setTimeout(() => {
			const containers = [
				contentRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
				contentRef.current,
				scrollRef.current
			];
			for (const c of containers) {
				if (c) { c.scrollTop = c.scrollHeight; break; }
			}
		}, 50);
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
					toast.error(`${t('llm.chat.unsupportedFileType')} ${file.type}`);
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
			toast.error(t('llm.chat.fileUploadFailed'));
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const removeFile = (index: number) => {
		setUploadedFiles(prev => prev.filter((_, i) => i !== index));
	};

	// 加载会话列表
	const loadConversationList = useCallback(async (appId: string) => {
		try {
			const list = await llmConversationService.queryList({ appId });
			setConversationList(list || []);
		} catch (error) {
			console.error('Failed to load conversations:', error);
		}
	}, []);

	// 加载应用列表
	const loadApplications = async () => {
		try {
			const response = await getApplicationListApi();
			setApplications(response || []);
			if (response && response.length > 0) {
				setSelectedApp(response[0].id!);
			}
		} catch (error) {
			console.error('Failed to load applications:', error);
			toast.error(t('llm.chat.loadAppFailed'));
		}
	};

	// 加载聊天记录
	const fetchMessages = async (convId: string, appId: string) => {
		if (!appId || !convId) {
			setMessages([]);
			return;
		}
		try {
			const msgs = await getMessagesApi(convId, appId);
			setMessages(msgs || []);
		} catch (error) {
			console.error('Failed to load messages:', error);
			toast.error(t('llm.chat.loadHistoryFailed'));
		}
	};

	// 加载开场白并显示
	const loadPrologue = async (appId: string) => {
		try {
			const prologue = await getAppPrologueApi(appId);
			if (prologue) {
				const prologueMsg: ChatMessage = {
					chatId: generateUUID(),
					role: 'assistant',
					message: prologue,
					createTime: new Date().toISOString(),
				};
				setMessages([prologueMsg]);
			} else {
				setMessages([]);
			}
		} catch {
			setMessages([]);
		}
	};

	// 点击"新会话"
	const handleNewConversation = () => {
		setActiveConversationId(null);
		const newId = generateConversationId();
		setConversationId(newId);
		setUploadedFiles([]);
		if (selectedApp) {
			loadPrologue(selectedApp);
		} else {
			setMessages([]);
		}
	};

	// 点击历史会话
	const handleSelectConversation = async (conv: LlmConversation) => {
		if (loading) return;
		setActiveConversationId(conv.id!);
		setConversationId(conv.id!);
		await fetchMessages(conv.id!, selectedApp);
	};

	// 处理键盘事件
	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	};

	const addMessage = (msg: string, role: 'user' | 'assistant' | 'system', chatId: string, files?: FileContent[]) => {
		const newMessage: ChatMessage = { chatId, role, message: msg, files, createTime: new Date().toISOString() };
		setMessages(prev => [...prev, newMessage]);
		forceScrollToBottom();
	};

	const handleSubmit = async () => {
		const msg = message.trim();
		if (loading || (!msg && uploadedFiles.length === 0)) {
			if (!msg && uploadedFiles.length === 0) toast.error(t('llm.chat.inputRequired'));
			return;
		}
		if (!selectedApp) {
			toast.error(t('llm.chat.selectAppRequired'));
			return;
		}

		if (controllerRef.current) controllerRef.current.abort();
		controllerRef.current = new AbortController();

		const userChatId = generateUUID();
		const currentFiles = uploadedFiles.length > 0 ? [...uploadedFiles] : undefined;
		addMessage(msg, 'user', userChatId, currentFiles);
		setLoading(true);
		setMessage('');
		setUploadedFiles([]);
		scrollToBottom();

		const aiMsgId = generateUUID();
		addMessage('', 'assistant', aiMsgId);

		await onChat(msg, aiMsgId, currentFiles);
	};

	const addToolCall = (aiMsgId: string, toolName: string, status: 'calling' | 'done', result?: string) => {
		setMessages(prev =>
			prev.map((item) => {
				if (item?.chatId !== aiMsgId) return item;
				const toolCalls = [...(item.toolCalls || [])];
				const existing = toolCalls.findIndex((t) => t.name === toolName);
				if (existing > -1) {
					toolCalls[existing] = { name: toolName, status, result: result || toolCalls[existing].result };
				} else {
					toolCalls.push({ name: toolName, status, result });
				}
				return { ...item, toolCalls };
			})
		);
		forceScrollToBottom();
	};

	const onChat = async (msg: string, aiMsgId: string, files?: FileContent[]) => {
		try {
			await chatApi(
				{
					chatId: aiMsgId,
					conversationId,
					appId: selectedApp,
					message: msg.trim(),
					role: 'user',
					files,
				},
				controllerRef.current!,
				(chunk: ChatChunk) => {
					const { data, eventType } = chunk;
					if (data.startsWith('data:Error')) {
						updateMessage(aiMsgId, data.substring(10), true);
						return;
					}
					try {
						const parsed = JSON.parse(data);

						// Skip parallel branch/status events (final merged result comes as regular message)
						if (eventType === 'branch' || eventType === 'parallel-status') {
							return;
						}

						const { done, message: responseMessage, toolName, toolStatus } = parsed;

						// Done / end-of-stream
						if (done) {
							setLoading(false);
							controllerRef.current = null;
							if (!activeConversationId) {
								setActiveConversationId(conversationId);
								loadConversationList(selectedApp);
							}
							return;
						}

						// Tool events
						if (eventType === 'tool_call' && toolName) {
							addToolCall(aiMsgId, toolName, 'calling', toolStatus);
							return;
						}
						if (eventType === 'tool_result' && toolName) {
							addToolCall(aiMsgId, toolName, 'done', responseMessage);
							return;
						}

						// Regular message — append to display
						if (responseMessage != null && responseMessage !== '') {
							setMessages(prev =>
								prev.map((item) =>
									item?.chatId === aiMsgId
										? { ...item, message: (item.message || '') + responseMessage }
										: item
								)
							);
							forceScrollToBottom();
						}
					} catch (e) {
						console.error('Parse JSON error:', e, 'Chunk:', data);
					}
				}
			).catch((e: any) => {
				setLoading(false);
				if (e.message !== undefined) {
					updateMessage(aiMsgId, e.message || 'Chat error', true);
					return;
				}
				if (e.startsWith('data:Error')) {
					updateMessage(aiMsgId, e.substring(5, e.length), true);
				}
			});
		} finally {
			setLoading(false);
		}
	};

	const updateMessage = (chatId: string, msg: string, isError?: boolean) => {
		setMessages(prev =>
			prev.map((item) =>
				item?.chatId === chatId ? { ...item, message: msg, isError: isError || false } : item
			)
		);
		forceScrollToBottom();
	};

	const handleStop = () => {
		if (loading) {
			if (controllerRef.current) {
				controllerRef.current.abort();
				controllerRef.current = null;
			}
			setLoading(false);
		}
	};

	const handleDelete = (item: ChatMessage) => {
		if (loading) return;
		if (window.confirm(t('llm.chat.confirmDelete'))) {
			setMessages(prev => prev.filter((i) => i.chatId !== item.chatId));
			toast.success(t('llm.chat.deleteSuccess'));
		}
	};

	const handleClearChat = async () => {
		if (!conversationId) return;
		if (window.confirm(t('llm.chat.confirmClear'))) {
			try {
				await cleanChatApi(conversationId);
				setMessages([]);
				toast.success(t('llm.chat.clearSuccess'));
			} catch (error) {
				toast.error(t('llm.chat.clearFailed'));
			}
		}
	};

	const handleAppChange = async (appId: string) => {
		setSelectedApp(appId);
		setActiveConversationId(null);
		setUploadedFiles([]);
		const newId = generateConversationId();
		setConversationId(newId);
		await loadConversationList(appId);
		await loadPrologue(appId);
	};

	// 初始化
	useEffect(() => {
		loadApplications();
	}, []);

	// 应用切换后加载会话列表 + 开场白
	useEffect(() => {
		if (selectedApp) {
			loadConversationList(selectedApp);
			const newId = generateConversationId();
			setConversationId(newId);
			setActiveConversationId(null);
			loadPrologue(selectedApp);
		}
	}, [selectedApp, loadConversationList]);

	// 消息变化时滚动到底部
	useEffect(() => {
		const timer = setTimeout(() => scrollToBottom(), 100);
		return () => clearTimeout(timer);
	}, [messages]);

	// 格式化时间
	const formatTime = (timeStr?: string) => {
		if (!timeStr) return '';
		return new Date(timeStr).toLocaleString();
	};

	return (
		<>
			{/* 顶部应用选择 */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div>{t('llm.chat.title')}</div>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={handleClearChat} disabled={!selectedApp || messages.length === 0}>
								<Icon icon="mingcute:delete-2-fill" size={16} className="mr-2" />
								{t('llm.chat.clearChat')}
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">{t('llm.chat.selectApp')}</span>
						<Select value={selectedApp} onValueChange={handleAppChange}>
							<SelectTrigger className="w-64">
								<SelectValue placeholder={t('llm.chat.selectAppLabel')} />
							</SelectTrigger>
							<SelectContent>
								{applications.map((app) => (
									<SelectItem key={app.id} value={app.id!}>
										{app.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* 主体区域：左侧会话列表 + 右侧对话 */}
			<div className="mt-4 flex gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
				{/* 左侧会话列表 */}
				<Card className="w-[30%] min-w-[240px] flex flex-col">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">{t('llm.chat.sessionList')}</span>
							<Button variant="outline" size="sm" onClick={handleNewConversation}>
								<Icon icon="mdi:plus" size={14} className="mr-1" />
								{t('llm.chat.newSession')}
							</Button>
						</div>
					</CardHeader>
					<CardContent className="flex-1 overflow-hidden p-0">
						<ScrollArea className="h-full">
							<div className="px-4 pb-4 space-y-2">
								{/* 新会话选项 */}
								<div
									className={`p-3 rounded-lg cursor-pointer transition-colors border ${
										activeConversationId === null
											? 'bg-primary/10 border-primary'
											: 'bg-gray-50 border-transparent hover:bg-gray-100'
									}`}
									onClick={handleNewConversation}
								>
									<div className="flex items-center gap-2">
										<Icon icon="mdi:plus-circle-outline" size={16} className="text-primary" />
										<span className="text-sm font-medium">{t('llm.chat.newSession')}</span>
									</div>
								</div>

								{/* 历史会话列表 */}
								{conversationList.map((conv) => (
									<div
										key={conv.id}
										className={`p-3 rounded-lg cursor-pointer transition-colors border ${
											activeConversationId === conv.id
												? 'bg-primary/10 border-primary'
												: 'bg-gray-50 border-transparent hover:bg-gray-100'
										}`}
										onClick={() => handleSelectConversation(conv)}
									>
										<div className="text-sm font-medium truncate">{conv.title || t('llm.chat.unnamedSession')}</div>
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs text-gray-400">{formatTime(conv.createTime)}</span>
											{conv.chatTotal != null && (
												<Badge variant="secondary" className="text-xs px-1.5 py-0">
													{t('llm.chat.chatCount', { count: conv.chatTotal })}
												</Badge>
											)}
										</div>
									</div>
								))}

								{conversationList.length === 0 && (
									<div className="text-center text-gray-400 text-sm py-8">
										{t('llm.chat.noHistory')}
									</div>
								)}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				{/* 右侧对话窗口 */}
				<Card className="flex-1 flex flex-col">
					<CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
						{messages.length === 0 ? (
							<div className="flex-1 flex items-center justify-center">
								<div className="text-center">
									<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
										<Icon icon="mdi:robot-outline" size={32} className="text-gray-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										{selectedApp ? t('llm.chat.startChat') : t('llm.chat.selectAppToChat')}
									</h3>
									<p className="text-gray-500 mb-4">
										{selectedApp ? t('llm.chat.inputHint') : t('llm.chat.selectAppHint')}
									</p>
									{selectedApp && (
										<div className="flex flex-wrap gap-2 justify-center">
											{[t('llm.chat.suggestion1'), t('llm.chat.suggestion2'), t('llm.chat.suggestion3'), t('llm.chat.suggestion4')].map((s) => (
												<Button key={s} variant="outline" size="sm" onClick={() => setMessage(s)}>
													{s}
												</Button>
											))}
										</div>
									)}
								</div>
							</div>
						) : (
							<ScrollArea ref={contentRef} className="flex-1">
								<div ref={scrollRef} className="p-4 space-y-4">
									{messages.map((item, index) => (
										<div key={item.id || `${item.chatId}-${item.role}-${index}`}>
											{loading && item.role === 'assistant' && index === messages.length - 1 && !item.message && (
												<div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
													<div className="flex items-center gap-2 text-blue-700">
														<Icon icon="mdi:robot" size={14} className="text-blue-600" />
														<Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300">{t('llm.applicationConfig.aiAssistant')}</Badge>
														<Icon icon="mdi:loading" className="h-3 w-3 animate-spin text-blue-600" />
														<span className="text-xs font-medium">{t('llm.applicationConfig.thinking')}</span>
													</div>
												</div>
											)}
											<ChatMessageComponent
												message={item}
												onDelete={handleDelete}
											/>
										</div>
									))}
								</div>
							</ScrollArea>
						)}

						{/* 输入区域 */}
						<div className="border-t p-4">
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
									size="icon"
									onClick={() => fileInputRef.current?.click()}
									disabled={uploading || loading || !selectedApp}
									title={t('llm.chat.uploadFile')}
								>
									<Icon icon={uploading ? "mdi:loading" : "mdi:paperclip"} size={18} className={uploading ? "animate-spin" : ""} />
								</Button>
								<Textarea
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder={selectedApp ? t('llm.chat.inputPlaceholder') : t('llm.chat.selectAppPlaceholder')}
									className="flex-1 min-h-[40px] max-h-32 resize-none"
									disabled={loading || !selectedApp}
								/>
								<div className="flex items-center gap-1">
									{!loading ? (
										<Button onClick={handleSubmit} disabled={(!message.trim() && uploadedFiles.length === 0) || !selectedApp} size="icon">
											<Icon icon="mdi:send" size={18} />
										</Button>
									) : (
										<Button onClick={handleStop} variant="outline" size="icon">
											<Icon icon="ri:stop-circle-line" size={18} />
										</Button>
									)}
								</div>
							</div>
							{selectedApp && (
								<div className="mt-2 text-xs text-gray-500">
									{t('llm.chat.sendHint')}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
