import { useState, useRef } from 'react';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { toast } from 'sonner';
import { ChatMessage, type ToolCallInfo } from '@/api/services/llmChatService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

function ToolCallCard({ toolCall }: { toolCall: ToolCallInfo }) {
	const [expanded, setExpanded] = useState(false);
	return (
		<div className="mb-1.5 border border-purple-200 rounded-md bg-purple-50 px-2.5 py-1.5 text-xs">
			<div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
				{toolCall.status === 'calling' ? (
					<Icon icon="mdi:loading" size={14} className="animate-spin text-purple-500" />
				) : (
					<Icon icon="mdi:check-circle" size={14} className="text-green-500" />
				)}
				<span className="font-medium text-purple-700">{toolCall.name}</span>
				<span className="text-gray-400">{toolCall.status === 'calling' ? '调用中...' : '已完成'}</span>
				{toolCall.result && (
					<Icon icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} size={14} className="text-gray-400 ml-auto" />
				)}
			</div>
			{expanded && toolCall.result && (
				<pre className="mt-1.5 p-2 bg-white rounded border border-purple-100 text-xs text-gray-600 whitespace-pre-wrap break-all max-h-32 overflow-y-auto m-0">
					{toolCall.result}
				</pre>
			)}
		</div>
	);
}

interface ChatMessageProps {
	message: ChatMessage;
	onDelete?: (message: ChatMessage) => void;
}

export function ChatMessageComponent({ message, onDelete }: ChatMessageProps) {
	const [isHover, setIsHover] = useState(false);
	const [asRawText, setAsRawText] = useState(message.role === 'user');
	const textRef = useRef<HTMLDivElement>(null);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(message.message || '');
			toast.success('复制成功');
		} catch {
			toast.error('复制失败');
		}
	};

	const handleSelect = (key: 'copyText' | 'delete') => {
		switch (key) {
			case 'copyText':
				handleCopy();
				break;
			case 'delete':
				if (onDelete) {
					onDelete(message);
				}
				break;
		}
	};

	const isInversion = message.role === 'user';

	return (
		<div
			className={`flex w-full overflow-hidden ${isInversion ? 'flex-row-reverse' : ''}`}
			onMouseEnter={() => setIsHover(true)}
			onMouseLeave={() => setIsHover(false)}
		>
			<div
				className={`flex items-center justify-center bg-gray-200 flex-shrink-0 h-7 w-7 overflow-hidden rounded-full ${
					isInversion ? 'ml-2' : 'mr-2'
				}`}
			>
				<Icon 
					icon={isInversion ? 'solar:user-broken' : 'mingcute:ai-line'} 
					size={14} 
				/>
			</div>
			
			<div className={`overflow-hidden text-sm flex-1 ${isInversion ? 'items-end' : 'items-start'}`}>
				<p className={`text-xs text-[#b4bbc4] ${isInversion ? 'text-right' : 'text-left'}`}>
					{message.createTime}
				</p>
				
				<div className={`flex flex-col ${isInversion ? 'items-end' : 'items-start'} mt-1 transition-all`}>
					<div className={`max-w-xl p-2 py-1 bg-white border rounded-lg shadow-sm ${message.isError ? 'border-red-200 bg-red-50' : ''}`}>
						{(() => {
							const files = typeof message.files === 'string' ? JSON.parse(message.files || '[]') : (message.files || []);
							return files.length > 0 ? (
							<div className="flex gap-1.5 flex-wrap mb-1.5">
								{files.map((file: any, fi: number) => (
									<div key={fi}>
										{file.type === "image" ? (
											<a href={file.url} target="_blank" rel="noopener noreferrer">
												<img src={file.url} alt={file.name} className="w-20 h-20 object-cover rounded border hover:opacity-80 transition-opacity" />
											</a>
										) : file.type === "audio" ? (
											<div className="w-20 h-20 flex flex-col items-center justify-center rounded border bg-muted gap-0.5">
												<Icon icon="mdi:music-note" size={18} className="text-muted-foreground" />
												<span className="text-[8px] text-muted-foreground truncate max-w-16 px-0.5">{file.name}</span>
											</div>
										) : (
											<div className="w-20 h-20 flex flex-col items-center justify-center rounded border bg-muted gap-0.5">
												<Icon icon="mdi:video" size={18} className="text-muted-foreground" />
												<span className="text-[8px] text-muted-foreground truncate max-w-16 px-0.5">{file.name}</span>
											</div>
										)}
									</div>
								))}
							</div>
							) : null;
						})()}
						{message.toolCalls && message.toolCalls.length > 0 && (
							<div className="mb-2">
								{message.toolCalls.map((tc, idx) => (
									<ToolCallCard key={`${tc.name}-${idx}`} toolCall={tc} />
								))}
							</div>
						)}
						{asRawText ? (
							<pre className="whitespace-pre-wrap text-sm font-mono m-0 leading-tight">
								{message.message}
							</pre>
						) : (
							<div 
								ref={textRef}
								className="prose prose-sm max-w-none m-0 leading-tight prose-headings:my-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-100 prose-pre:p-2"
							>
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeHighlight]}
									components={{
										// 自定义组件样式
										h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-2">{children}</h1>,
										h2: ({children}) => <h2 className="text-base font-semibold text-gray-800 mb-2">{children}</h2>,
										h3: ({children}) => <h3 className="text-sm font-semibold text-gray-800 mb-1">{children}</h3>,
										p: ({children}) => <p className="text-gray-700 mb-1 leading-relaxed">{children}</p>,
										ul: ({children}) => <ul className="list-disc list-inside text-gray-700 mb-1 space-y-0.5">{children}</ul>,
										ol: ({children}) => <ol className="list-decimal list-inside text-gray-700 mb-1 space-y-0.5">{children}</ol>,
										li: ({children}) => <li className="text-gray-700">{children}</li>,
										strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
										em: ({children}) => <em className="italic text-gray-700">{children}</em>,
										code: ({inline, children, ...props}) => {
											return inline ? (
												<code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
													{children}
												</code>
											) : (
												<code className="block bg-gray-100 p-2 rounded text-sm font-mono text-gray-800 overflow-x-auto" {...props}>
													{children}
												</code>
											);
										},
										blockquote: ({children}) => (
											<blockquote className="border-l-4 border-gray-300 pl-3 py-1 my-1 text-gray-600 italic">
												{children}
											</blockquote>
										),
									}}
								>
									{message.message}
								</ReactMarkdown>
							</div>
						)}
					</div>
					
					{/* 按钮区域 - 预留空间，hover时显示 */}
					<div className={`h-5 flex gap-1 mt-1 ${isInversion ? 'flex-row-reverse' : 'flex-row'} transition-opacity duration-200 ${isHover ? 'opacity-100' : 'opacity-0'}`}>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5"
									onClick={() => handleSelect('copyText')}
								>
									<Icon icon="ri:file-copy-2-line" size={12} />
								</Button>
							</PopoverTrigger>
							<PopoverContent side="top" className="w-auto p-1 text-xs">
								复制
							</PopoverContent>
						</Popover>
						
						{onDelete && (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-5 w-5"
										onClick={() => handleSelect('delete')}
									>
										<Icon icon="mingcute:delete-2-fill" size={12} className="text-red-500" />
									</Button>
								</PopoverTrigger>
								<PopoverContent side="top" className="w-auto p-1 text-xs">
									删除
								</PopoverContent>
							</Popover>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
