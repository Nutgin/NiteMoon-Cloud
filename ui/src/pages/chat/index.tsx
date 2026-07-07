import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { ScrollArea } from '@/ui/scroll-area';
import { Skeleton } from '@/ui/skeleton';
import { Badge } from '@/ui/badge';
import { toast } from 'sonner';
import { ChatMessageComponent } from '@/components/chat-message/index';
import type { ChatMessage, ChatChunk, FileContent } from '@/api/services/llmChatService';
import { uploadFile } from '@/api/services/systemFileService';
import {
    publicChatApi,
    getPublicAppInfoApi,
    getPublicPrologueApi,
} from '@/api/services/publicChatService';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function getFileTypeByMime(mimeType: string): "image" | "audio" | "video" | null {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    return null;
}

export default function PublicChatPage() {
    const { webPageKey } = useParams<{ webPageKey: string }>();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [appName, setAppName] = useState('');
    const [appLoading, setAppLoading] = useState(true);
    const [conversationId] = useState(() => generateUUID().replace(/-/g, ''));
    const [uploadedFiles, setUploadedFiles] = useState<FileContent[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<AbortController | null>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            const viewport = contentRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 50);
    }, []);

    // 加载应用信息
    useEffect(() => {
        if (!webPageKey) return;

        const loadAppInfo = async () => {
            try {
                setAppLoading(true);
                const appInfo = await getPublicAppInfoApi(webPageKey);
                setAppName(appInfo.name || 'AI助手');
            } catch (error) {
                console.error('Failed to load app info:', error);
                toast.error('应用不存在或未启用');
            } finally {
                setAppLoading(false);
            }
        };

        const loadPrologue = async () => {
            try {
                const prologue = await getPublicPrologueApi(webPageKey);
                if (prologue) {
                    setMessages([{
                        chatId: generateUUID(),
                        role: 'assistant',
                        message: prologue,
                        createTime: new Date().toISOString(),
                    }]);
                }
            } catch {
                // 忽略开场白加载失败
            }
        };

        loadAppInfo();
        loadPrologue();
    }, [webPageKey]);

    // 消息变化时滚动到底部
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // 文件上传处理
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const fileType = getFileTypeByMime(file.type);
                if (!fileType) {
                    toast.error(`不支持的文件类型: ${file.type}`);
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
            toast.error('文件上传失败');
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

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    const addMessage = (msg: string, role: 'user' | 'assistant', chatId: string, files?: FileContent[]) => {
        const newMessage: ChatMessage = { chatId, role, message: msg, files, createTime: new Date().toISOString() };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleSubmit = async () => {
        const msg = message.trim();
        if (loading || (!msg && uploadedFiles.length === 0)) {
            if (!msg && uploadedFiles.length === 0) toast.error('请输入消息');
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

    const onChat = async (msg: string, aiMsgId: string, files?: FileContent[]) => {
        try {
            await publicChatApi(
                {
                    chatId: aiMsgId,
                    conversationId,
                    webPageKey: webPageKey!,
                    message: msg.trim(),
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

                        if (eventType === 'branch' || eventType === 'parallel-status') {
                            return;
                        }

                        const { done, message: responseMessage, toolName, toolStatus } = parsed;

                        if (done) {
                            setLoading(false);
                            controllerRef.current = null;
                            return;
                        }

                        if (eventType === 'tool_call' && toolName) {
                            addToolCall(aiMsgId, toolName, 'calling', toolStatus);
                            return;
                        }
                        if (eventType === 'tool_result' && toolName) {
                            addToolCall(aiMsgId, toolName, 'done', responseMessage);
                            return;
                        }

                        if (responseMessage != null && responseMessage !== '') {
                            setMessages(prev =>
                                prev.map((item) =>
                                    item?.chatId === aiMsgId
                                        ? { ...item, message: (item.message || '') + responseMessage }
                                        : item
                                )
                            );
                            scrollToBottom();
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
            });
        } finally {
            setLoading(false);
        }
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
        scrollToBottom();
    };

    const updateMessage = (chatId: string, msg: string, isError?: boolean) => {
        setMessages(prev =>
            prev.map((item) =>
                item?.chatId === chatId ? { ...item, message: msg, isError: isError || false } : item
            )
        );
        scrollToBottom();
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

    if (appLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <Skeleton className="w-48 h-8 mb-4" />
                    <Skeleton className="w-32 h-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* 顶部标题栏 */}
            <div className="border-b px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon icon="mdi:robot" size={16} className="text-primary" />
                </div>
                <h1 className="text-lg font-semibold">{appName}</h1>
            </div>

            {/* 聊天消息区域 */}
            <div ref={contentRef} className="flex-1 overflow-hidden">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                                <Icon icon="mdi:robot-outline" size={32} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">开始对话</h3>
                            <p className="text-muted-foreground mb-4">输入消息开始与AI助手交流</p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-4 max-w-3xl mx-auto">
                            {messages.map((item, index) => (
                                <div key={`${item.chatId}-${item.role}-${index}`}>
                                    {loading && item.role === 'assistant' && index === messages.length - 1 && !item.message && (
                                        <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-blue-700">
                                                <Icon icon="mdi:robot" size={14} className="text-blue-600" />
                                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300">AI助手</Badge>
                                                <Icon icon="mdi:loading" className="h-3 w-3 animate-spin text-blue-600" />
                                                <span className="text-xs font-medium">正在思考中...</span>
                                            </div>
                                        </div>
                                    )}
                                    <ChatMessageComponent
                                        message={item}
                                    />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* 输入区域 */}
            <div className="border-t p-4">
                <div className="max-w-3xl mx-auto">
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
                            disabled={uploading || loading}
                            title="上传文件"
                        >
                            <Icon icon={uploading ? "mdi:loading" : "mdi:paperclip"} size={18} className={uploading ? "animate-spin" : ""} />
                        </Button>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入消息..."
                            className="flex-1 min-h-[40px] max-h-32 resize-none"
                            disabled={loading}
                        />
                        <div className="flex items-center gap-1">
                            {!loading ? (
                                <Button onClick={handleSubmit} disabled={!message.trim() && uploadedFiles.length === 0} size="icon">
                                    <Icon icon="mdi:send" size={18} />
                                </Button>
                            ) : (
                                <Button onClick={handleStop} variant="outline" size="icon">
                                    <Icon icon="ri:stop-circle-line" size={18} />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                        按 Enter 发送，Shift + Enter 换行
                    </div>
                </div>
            </div>
        </div>
    );
}
