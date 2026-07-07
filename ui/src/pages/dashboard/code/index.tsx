import Editor, { type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/icon";
import { useTheme } from "@/theme/hooks/use-theme";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Text } from "@/ui/typography";

// 支持的语言配置
const LANGUAGES = [
	{ value: "javascript", label: "JavaScript", icon: "vscode-icons:file-type-js" },
	{ value: "jsx", label: "JSX", icon: "vscode-icons:file-type-reactjs" },
	{ value: "html", label: "HTML", icon: "vscode-icons:file-type-html" },
];

// 默认代码模板
const DEFAULT_CODE = {
	javascript: `// JavaScript 示例
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('斐波那契数列第10项:', fibonacci(10));

// ES6+ 特性
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet('World'));`,

	jsx: `// React JSX 示例
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <h1>计数器: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
      <button onClick={() => setCount(count - 1)}>
        减少
      </button>
    </div>
  );
}

export default Counter;`,

	html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>示例页面</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello World</h1>
    <p>这是一个示例页面</p>
  </div>
</body>
</html>`,
};

const Index = () => {
	const { t } = useTranslation();
	const { mode } = useTheme();
	const [language, setLanguage] = useState<keyof typeof DEFAULT_CODE>("javascript");
	const [code, setCode] = useState(DEFAULT_CODE.javascript);
	const [output, setOutput] = useState<string>("");
	const [isRunning, setIsRunning] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
	const editorContainerRef = useRef<HTMLDivElement | null>(null);

	// 编辑器挂载时的回调
	const handleEditorDidMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;

		// 配置 JavaScript/JSX 编译选项
		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ES2020,
			allowNonTsExtensions: true,
			moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.ESNext,
			noEmit: true,
			esModuleInterop: true,
			jsx: monaco.languages.typescript.JsxEmit.React,
			allowJs: true,
			checkJs: false,
		});

		// 配置诊断选项
		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: false,
			noSyntaxValidation: false,
		});

		// 注册保存快捷键 (Ctrl/Cmd + S)
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
			console.log("保存代码:", editor.getValue());
		});
	};

	// 切换语言
	const handleLanguageChange = (newLanguage: string) => {
		const lang = newLanguage as keyof typeof DEFAULT_CODE;
		setLanguage(lang);
		setCode(DEFAULT_CODE[lang]);
		setOutput("");
	};

	// 格式化代码
	const handleFormat = () => {
		editorRef.current?.getAction("editor.action.formatDocument")?.run();
	};

	// 复制代码
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			console.log(t('dashboard.code.copied'));
		} catch (err) {
			console.error(t('dashboard.code.copyFailed'), err);
		}
	};

	// 重置代码
	const handleReset = () => {
		setCode(DEFAULT_CODE[language]);
		setOutput("");
	};

	// 下载代码
	const handleDownload = () => {
		const extensions = { javascript: "js", jsx: "jsx", html: "html" };
		const blob = new Blob([code], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `code.${extensions[language]}`;
		a.click();
		URL.revokeObjectURL(url);
	};

	// 运行代码
	const runCode = () => {
		setIsRunning(true);
		setOutput("");
		setDrawerOpen(true); // 打开抽屉

		try {
			if (language === "html") {
				// HTML 直接在 iframe 中渲染
				setTimeout(() => {
					const iframe = document.getElementById("code-preview-iframe") as HTMLIFrameElement;
					if (iframe) {
						iframe.srcdoc = code;
						setOutput(`✓ ${t('dashboard.code.htmlRendered')}`);
					}
					setIsRunning(false);
				}, 100);
			} else if (language === "javascript" || language === "jsx") {
				// JavaScript 运行
				const logs: string[] = [];
				const errors: string[] = [];
				let hasAsyncCode = false;

				// 更新输出的辅助函数
				const updateOutput = () => {
					const finalOutput = [...logs, ...errors].join("\n") || "";
					setOutput(finalOutput);
				};

				// 创建沙箱环境
				const sandbox = {
					console: {
						log: (...args: any[]) => {
							logs.push(
								args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" "),
							);
							// 实时更新输出
							updateOutput();
						},
						error: (...args: any[]) => {
							errors.push("❌ ERROR: " + args.join(" "));
							updateOutput();
						},
						warn: (...args: any[]) => {
							logs.push("⚠️ WARN: " + args.join(" "));
							updateOutput();
						},
						info: (...args: any[]) => {
							logs.push("ℹ️ INFO: " + args.join(" "));
							updateOutput();
						},
					},
					// 提供常用的全局对象
					Math,
					Date,
					JSON,
					Array,
					Object,
					String,
					Number,
					Boolean,
					Promise,
					setTimeout: (fn: Function, delay: number) => {
						hasAsyncCode = true;
						return window.setTimeout(() => {
							try {
								fn();
								updateOutput();
							} catch (e: any) {
								errors.push(`❌ Timeout Error: ${e.message}`);
								updateOutput();
							}
						}, delay);
					},
					setInterval: (fn: Function, delay: number) => {
						hasAsyncCode = true;
						return window.setInterval(() => {
							try {
								fn();
								updateOutput();
							} catch (e: any) {
								errors.push(`❌ Interval Error: ${e.message}`);
								updateOutput();
							}
						}, delay);
					},
					clearTimeout: window.clearTimeout,
					clearInterval: window.clearInterval,
				};

				try {
					// 对于 JSX，提示需要转换
					if (language === "jsx") {
						logs.push("⚠️ 注意: JSX 代码需要转换为 JavaScript 才能运行");
						logs.push("💡 提示: 请切换到 JavaScript 语言或使用纯 JS 语法\n");
					}

					// 使用 Function 构造器执行（比 eval 更安全）
					const fn = new Function(...Object.keys(sandbox), code);
					const result = fn(...Object.values(sandbox));

					// 如果有返回值，也显示出来
					if (result !== undefined) {
						logs.push(`\n📤 返回值: ${typeof result === "object" ? JSON.stringify(result, null, 2) : result}`);
					}

					// 显示初始输出
					updateOutput();

					// 如果有异步代码，添加提示
					if (hasAsyncCode) {
						setTimeout(() => {
							if (logs.length === 0 && errors.length === 0) {
								updateOutput();
							}
						}, 50);
					}
				} catch (error: any) {
					setOutput(`❌ ${t('dashboard.code.runError')}\n${error.message}\n\n堆栈信息:\n${error.stack || "无"}`);
				}
			}
		} catch (error: any) {
			setOutput(`❌ ${t('dashboard.code.execFailed')}\n${error.message}`);
		} finally {
			setIsRunning(false);
		}
	};

	// 清空输出
	const clearOutput = () => {
		setOutput("");
		const iframe = document.getElementById("code-preview-iframe") as HTMLIFrameElement;
		if (iframe) {
			iframe.srcdoc = "";
		}
	};

	// 切换全屏
	const toggleFullscreen = () => {
		if (!editorContainerRef.current) return;

		if (!isFullscreen) {
			// 进入全屏
			if (editorContainerRef.current.requestFullscreen) {
				editorContainerRef.current.requestFullscreen();
			}
			setIsFullscreen(true);
		} else {
			// 退出全屏
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
			setIsFullscreen(false);
		}
	};

	// 监听全屏变化（用户按 ESC 退出全屏）
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
		};
	}, []);

	return (
		<div
			className="flex flex-col"
			style={{
				height: "calc(100vh - var(--layout-header-height) - 2rem)",
			}}
		>
			{/* 编辑器卡片 - 占满高度 */}
			<Card className="flex-1 flex flex-col overflow-hidden">
				<CardHeader className="border-b py-3 shrink-0">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<CardTitle className="flex items-center gap-2">
							<Icon icon="local:ic-code" size={24} className="text-primary" />
							{t('dashboard.code.title')}
						</CardTitle>

						<div className="flex flex-wrap items-center gap-2">
							{/* 语言选择 */}
							<div className="flex items-center gap-2">
								<Text className="text-sm text-muted-foreground">{t('dashboard.code.language')}</Text>
								<Select value={language} onValueChange={handleLanguageChange}>
									<SelectTrigger className="w-32 h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{LANGUAGES.map((lang) => (
											<SelectItem key={lang.value} value={lang.value}>
												<div className="flex items-center gap-2">
													<Icon icon={lang.icon} size={16} />
													{lang.label}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* 操作按钮 */}
							<div className="flex gap-2">
								<Button size="sm" onClick={runCode} disabled={isRunning} className="gap-1.5">
									{isRunning ? (
										<Icon icon="mdi:loading" size={16} className="animate-spin" />
									) : (
										<Icon icon="mdi:play" size={16} />
									)}
									{t('dashboard.code.run')}
								</Button>
								<Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-1.5">
									<Icon icon={isFullscreen ? "mdi:fullscreen-exit" : "mdi:fullscreen"} size={16} />
									{isFullscreen ? t('dashboard.code.exit') : t('dashboard.code.fullscreen')}
								</Button>
								<Button variant="outline" size="sm" onClick={handleFormat} className="gap-1.5">
									<Icon icon="mdi:format-align-left" size={16} />
									{t('dashboard.code.format')}
								</Button>
								<Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
									<Icon icon="mdi:content-copy" size={16} />
									{t('dashboard.code.copy')}
								</Button>
								<Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
									<Icon icon="mdi:download" size={16} />
									{t('dashboard.code.download')}
								</Button>
								<Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
									<Icon icon="mdi:refresh" size={16} />
									{t('dashboard.code.reset')}
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent ref={editorContainerRef} className="flex-1 p-0 overflow-hidden">
					<Editor
						height="100%"
						language={language}
						value={code}
						onChange={(value) => setCode(value || "")}
						theme={mode === "dark" ? "vs-dark" : "light"}
						onMount={handleEditorDidMount}
						options={{
							fontSize: 14,
							fontFamily: 'Consolas, "Courier New", monospace',
							lineNumbers: "on",
							minimap: { enabled: true },
							scrollBeyondLastLine: false,
							wordWrap: "on",
							automaticLayout: true,
							tabSize: 2,
							insertSpaces: true,
							formatOnPaste: true,
							formatOnType: true,
							quickSuggestions: true,
							suggestOnTriggerCharacters: true,
							scrollbar: {
								vertical: "auto",
								horizontal: "auto",
							},
							matchBrackets: "always",
							folding: true,
							smoothScrolling: true,
							cursorBlinking: "smooth",
							cursorSmoothCaretAnimation: "on",
						}}
						loading={
							<div className="flex items-center justify-center h-full bg-background">
								<div className="flex flex-col items-center gap-2">
									<Icon icon="mdi:loading" size={32} className="text-primary animate-spin" />
									<Text className="text-sm text-muted-foreground">{t('dashboard.code.loading')}</Text>
								</div>
							</div>
						}
					/>
				</CardContent>
			</Card>

			{/* 右侧抽屉 - 输出/预览 */}
			<Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
				<DrawerContent className="h-full w-full sm:w-[600px] md:w-[700px] lg:w-[800px]">
					<DrawerHeader className="border-b">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Icon icon="mdi:play-circle" size={24} className="text-success" />
								<DrawerTitle>{language === "html" ? t('dashboard.code.htmlPreview') : t('dashboard.code.codeOutput')}</DrawerTitle>
							</div>
							<div className="flex items-center gap-2">
								<Button variant="outline" size="sm" onClick={clearOutput} className="gap-1.5">
									<Icon icon="mdi:close" size={16} />
									{t('dashboard.code.clear')}
								</Button>
								<DrawerClose asChild>
									<Button variant="ghost" size="sm">
										<Icon icon="mdi:close" size={20} />
									</Button>
								</DrawerClose>
							</div>
						</div>
						<DrawerDescription className="text-xs text-muted-foreground mt-1">
							{language === "html" ? "HTML 代码在隔离的 iframe 环境中运行" : "JavaScript 代码在沙箱环境中安全执行"}
						</DrawerDescription>
					</DrawerHeader>

					<div className="flex-1 overflow-hidden">
						{language === "html" ? (
							<iframe
								id="code-preview-iframe"
								className="w-full h-full border-0 bg-background"
								sandbox="allow-scripts allow-same-origin"
								title="HTML Preview"
							/>
						) : (
							<div className="h-full overflow-auto p-4 bg-muted/30">
								{output ? (
									<pre className="text-sm font-mono whitespace-pre-wrap break-words">{output}</pre>
								) : (
									<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
										<Icon icon="mdi:console" size={48} className="mb-2 opacity-50" />
										<Text className="text-sm">{t('dashboard.code.waiting')}</Text>
										<Text className="text-xs mt-1">{t('dashboard.code.outputPlaceholder')}</Text>
									</div>
								)}
							</div>
						)}
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
};

export default Index;
