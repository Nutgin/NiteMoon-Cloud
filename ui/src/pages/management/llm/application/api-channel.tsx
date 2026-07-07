import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
	createAppApiApi,
	deleteAppApiChannelApi,
	listAppApiApi,
	type AppApiChannel,
} from "@/api/services/llmApplicationService";

interface ApiChannelProps {
	applicationId: string;
}

// Reusable code block with copy button
function CodeBlock({ code, language }: { code: string; language?: string }) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			toast.success(t('llm.apiChannel.copiedToClipboard'));
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error(t('llm.apiChannel.copyFailed'));
		}
	};

	return (
		<div className="group relative">
			<div className="flex items-center justify-between bg-slate-800 text-slate-400 text-xs px-4 py-1.5 rounded-t-md">
				<span>{language || "json"}</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1 hover:text-white transition-colors"
				>
					<Icon icon={copied ? "mdi:check" : "mdi:content-copy"} size={14} />
					{copied ? t('llm.apiChannel.copiedStatus') : t('llm.apiChannel.copy')}
				</button>
			</div>
			<pre className="bg-slate-900 text-slate-200 text-sm p-4 rounded-b-md overflow-x-auto">
				<code>{code}</code>
			</pre>
		</div>
	);
}

// Single key card component
function ApiKeyCard({
	item,
	onCopyKey,
	onCopyAppId,
	onDelete,
}: {
	item: AppApiChannel;
	onCopyKey: (key: string) => void;
	onCopyAppId: (id: string) => void;
	onDelete: (item: AppApiChannel) => void;
}) {
	const { t } = useTranslation();
	const [showKey, setShowKey] = useState(false);

	const maskedKey = item.apiKey
		? item.apiKey.substring(0, 6) + "..." + item.apiKey.substring(item.apiKey.length - 4)
		: t('llm.apiChannel.notGenerated');

	return (
		<div className="border border-gray-200 rounded-lg p-4 space-y-3 hover:border-gray-300 transition-colors bg-white">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
						<Icon icon="mdi:key-variant" size={16} className="text-blue-600" />
					</div>
					<div>
						<div className="text-sm font-medium text-gray-900">{t('llm.apiChannel.apiKeys')}</div>
						<div className="text-xs text-gray-400">
							{t('llm.apiChannel.createdAt', { date: item.createTime ? new Date(item.createTime).toLocaleDateString() : "-" })}
						</div>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onDelete(item)}
					className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
				>
					<Icon icon="mingcute:delete-2-fill" size={16} />
				</Button>
			</div>

			<Separator />

			{/* App ID */}
			<div className="space-y-1.5">
				<div className="text-xs font-medium text-gray-500">App ID</div>
				<div className="flex items-center gap-2">
					<code className="flex-1 text-xs bg-gray-50 px-3 py-2 rounded-md border font-mono text-gray-700 truncate">
						{item.appId}
					</code>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onCopyAppId(item.appId)}
						className="h-8 shrink-0"
					>
						<Icon icon="mdi:content-copy" size={14} className="mr-1" />
						{t('llm.apiChannel.copy')}
					</Button>
				</div>
			</div>

			{/* API Key */}
			{item.apiKey && (
				<div className="space-y-1.5">
					<div className="text-xs font-medium text-gray-500">API Key</div>
					<div className="flex items-center gap-2">
						<code className="flex-1 text-xs bg-gray-50 px-3 py-2 rounded-md border font-mono text-gray-700 truncate">
							{showKey ? item.apiKey : maskedKey}
						</code>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowKey(!showKey)}
							className="h-8 shrink-0"
						>
							<Icon icon={showKey ? "mdi:eye-off" : "mdi:eye"} size={14} />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onCopyKey(item.apiKey!)}
							className="h-8 shrink-0"
						>
							<Icon icon="mdi:content-copy" size={14} className="mr-1" />
							{t('llm.apiChannel.copy')}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export function ApiChannel({ applicationId }: ApiChannelProps) {
	const { t } = useTranslation();
	const [apiKeys, setApiKeys] = useState<AppApiChannel[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);

	const fetchApiKeys = useCallback(async () => {
		try {
			setLoading(true);
			const data = await listAppApiApi({ appId: applicationId, channel: "API" });
			setApiKeys(data || []);
		} catch (error) {
			console.error("获取API密钥失败:", error);
			toast.error(t('llm.apiChannel.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [applicationId]);

	const handleCreateApiKey = async () => {
		try {
			setCreating(true);
			await createAppApiApi(applicationId, "API");
			toast.success(t('llm.apiChannel.createSuccess'));
			fetchApiKeys();
		} catch (error) {
			console.error("创建API密钥失败:", error);
			toast.error(t('llm.apiChannel.createFailed'));
		} finally {
			setCreating(false);
		}
	};

	const handleCopy = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(t('llm.apiChannel.copied', { label }));
		} catch {
			toast.error(t('llm.apiChannel.copyFailed'));
		}
	};

	const handleDeleteApiKey = async (item: AppApiChannel) => {
		if (!confirm(t('llm.apiChannel.confirmDelete'))) {
			return;
		}
		try {
			await deleteAppApiChannelApi(item.id);
			toast.success(t('llm.apiChannel.deleteSuccess'));
			setApiKeys((prev) => prev.filter((k) => k.id !== item.id));
		} catch (error) {
			console.error("删除API密钥失败:", error);
			toast.error(t('llm.apiChannel.deleteFailed'));
		}
	};

	useEffect(() => {
		if (applicationId) {
			fetchApiKeys();
		}
	}, [applicationId, fetchApiKeys]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-[600px]">
			{/* Left: API Key Management */}
			<div className="w-[380px] border-r border-gray-200 flex flex-col bg-gray-50/50 shrink-0">
				<div className="p-5 border-b border-gray-200 bg-white">
					<div className="flex items-center gap-2 mb-1">
						<Icon icon="mdi:key-chain" size={20} className="text-gray-700" />
						<h2 className="text-base font-semibold text-gray-900">{t('llm.apiChannel.apiKeys')}</h2>
					</div>
					<p className="text-xs text-gray-500 ml-7">
						{t('llm.apiChannel.apiKeysDesc')}
					</p>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{apiKeys.length === 0 ? (
						<div className="text-center py-12">
							<div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
								<Icon icon="mdi:key-outline" size={28} className="text-gray-300" />
							</div>
							<p className="text-sm text-gray-500 mb-1">{t('llm.apiChannel.noApiKeys')}</p>
							<p className="text-xs text-gray-400">{t('llm.apiChannel.createToStart')}</p>
						</div>
					) : (
						apiKeys.map((item) => (
							<ApiKeyCard
								key={item.id}
								item={item}
								onCopyKey={(key) => handleCopy(key, "API Key")}
								onCopyAppId={(id) => handleCopy(id, "App ID")}
								onDelete={handleDeleteApiKey}
							/>
						))
					)}
				</div>

				<div className="p-4 border-t border-gray-200 bg-white">
					<Button
						onClick={handleCreateApiKey}
						disabled={creating}
						className="w-full"
					>
						{creating ? (
							<>
								<Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
								{t('llm.apiChannel.creating')}
							</>
						) : (
							<>
								<Icon icon="mdi:plus" size={18} className="mr-2" />
								{t('llm.apiChannel.createNewKey')}
							</>
						)}
					</Button>
				</div>
			</div>

			{/* Right: API Documentation */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-6 max-w-4xl">
					{/* Header */}
					<div className="mb-6">
						<h1 className="text-xl font-bold text-gray-900 mb-1">{t('llm.apiChannel.apiDoc')}</h1>
						<p className="text-sm text-gray-500">
							{t('llm.apiChannel.apiDocDesc')}
						</p>
					</div>

					<Tabs defaultValue="quickstart">
						<TabsList className="mb-4">
							<TabsTrigger value="quickstart">{t('llm.apiChannel.quickstart')}</TabsTrigger>
							<TabsTrigger value="reference">{t('llm.apiChannel.reference')}</TabsTrigger>
							<TabsTrigger value="streaming">{t('llm.apiChannel.streaming')}</TabsTrigger>
						</TabsList>

						{/* Tab: Quick Start */}
						<TabsContent value="quickstart" className="space-y-5">
							{/* Step 1 */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">1</Badge>
									<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.step1Title')}</h3>
								</div>
								<p className="text-sm text-gray-600 ml-9">
									{t('llm.apiChannel.step1Desc')}
								</p>
							</div>

							{/* Step 2 */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">2</Badge>
									<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.step2Title')}</h3>
								</div>
								<p className="text-sm text-gray-600 ml-9 mb-3">
									{t('llm.apiChannel.step2Desc')}
								</p>
								<div className="ml-9">
									<CodeBlock
										language="bash"
										code={`curl -X POST https://your-domain.com/llm/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "messages": [
      { "role": "user", "content": "你好" }
    ],
    "stream": false
  }'`}
									/>
								</div>
							</div>

							{/* Step 3 */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">3</Badge>
									<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.step3Title')}</h3>
								</div>
								<p className="text-sm text-gray-600 ml-9 mb-3">
									{t('llm.apiChannel.step3Desc')}
								</p>
								<div className="ml-9">
									<Tabs defaultValue="python">
										<TabsList className="mb-2">
											<TabsTrigger value="python">Python</TabsTrigger>
											<TabsTrigger value="java">Java</TabsTrigger>
											<TabsTrigger value="csharp">C#</TabsTrigger>
											<TabsTrigger value="go">Go</TabsTrigger>
										</TabsList>
										<TabsContent value="python">
											<CodeBlock
												language="python"
												code={`from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://your-domain.com/llm/v1"
)

response = client.chat.completions.create(
    model="your-app",
    messages=[
        {"role": "user", "content": "你好"}
    ],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`}
											/>
										</TabsContent>
										<TabsContent value="java">
											<CodeBlock
												language="java"
												code={`import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatCompletion;
import com.openai.models.ChatCompletionChunk;
import com.openai.models.ChatCompletionCreateParams;
import com.openai.models.ChatCompletionMessage;
import com.openai.models.ChatCompletionRole;

public class Main {
    public static void main(String[] args) {
        OpenAIClient client = OpenAIOkHttpClient.builder()
                .apiKey("YOUR_API_KEY")
                .baseUrl("https://your-domain.com/llm/v1")
                .build();

        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
                .model("your-app")
                .addMessage(ChatCompletionMessage.builder()
                        .role(ChatCompletionRole.USER)
                        .content("你好")
                        .build())
                .stream(true)
                .build();

        client.chat().completions().createStreaming(params)
                .stream()
                .map(ChatCompletionChunk::choices)
                .flatMap(choices -> choices.stream())
                .map(choice -> choice.delta().content())
                .filter(Optional::isPresent)
                .map(Optional::get)
                .forEach(System.out::print);
    }
}`}
											/>
										</TabsContent>
										<TabsContent value="csharp">
											<CodeBlock
												language="csharp"
												code={`using OpenAI;
using OpenAI.Chat;

var client = new OpenAIClient(
    new OpenAIAuthentication("YOUR_API_KEY"),
    settings: new OpenAIClientSettings(
        baseUri: "https://your-domain.com/llm/v1"
    )
);

var chatClient = client.Chat;
var messages = new List<Message>
{
    new Message(Role.User, "你好")
};

var request = new ChatRequest(
    messages: messages,
    model: "your-app",
    stream: true
);

await foreach (var chunk in chatClient.StreamCompletionAsync(request))
{
    var content = chunk.FirstChoice?.Delta?.Content;
    if (!string.IsNullOrEmpty(content))
    {
        Console.Write(content);
    }
}`}
											/>
										</TabsContent>
										<TabsContent value="go">
											<CodeBlock
												language="go"
												code={`package main

import (
	"context"
	"fmt"
	"io"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	config := openai.DefaultConfig("YOUR_API_KEY")
	config.BaseURL = "https://your-domain.com/llm/v1"

	client := openai.NewClientWithConfig(config)
	ctx := context.Background()

	req := openai.ChatCompletionRequest{
		Model: "your-app",
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: "你好"},
		},
		Stream: true,
	}

	stream, err := client.CreateChatCompletionStream(ctx, req)
	if err != nil {
		fmt.Printf("请求失败: %v\\n", err)
		return
	}
	defer stream.Close()

	for {
		response, err := stream.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Printf("接收失败: %v\\n", err)
			return
		}
		content := response.Choices[0].Delta.Content
		fmt.Print(content)
	}
}`}
											/>
										</TabsContent>
									</Tabs>
								</div>
							</div>
						</TabsContent>

						{/* Tab: API Reference */}
						<TabsContent value="reference" className="space-y-5">
							{/* Endpoint */}
							<Card>
								<CardContent className="p-5 space-y-4">
									<div className="flex items-center gap-3">
										<Badge className="bg-green-100 text-green-700 hover:bg-green-100">POST</Badge>
										<code className="text-sm font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">
											/llm/v1/chat/completions
										</code>
									</div>
									<p className="text-sm text-gray-600">
										{t('llm.apiChannel.endpointDesc')}
									</p>
								</CardContent>
							</Card>

							{/* Request Headers */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.requestHeaders')}</h3>
								<div className="border rounded-lg overflow-hidden">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-gray-50 text-left">
												<th className="px-4 py-2.5 font-medium text-gray-600">{t('llm.apiColumn.parameter')}</th>
												<th className="px-4 py-2.5 font-medium text-gray-600">{t('llm.apiColumn.value')}</th>
												<th className="px-4 py-2.5 font-medium text-gray-600">{t('llm.apiColumn.description')}</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											<tr>
												<td className="px-4 py-2.5 font-mono text-xs text-gray-800">Content-Type</td>
												<td className="px-4 py-2.5 font-mono text-xs text-gray-600">application/json</td>
												<td className="px-4 py-2.5 text-gray-500">{t('llm.apiChannel.fixedValue')}</td>
											</tr>
											<tr>
												<td className="px-4 py-2.5 font-mono text-xs text-gray-800">Authorization</td>
												<td className="px-4 py-2.5 font-mono text-xs text-gray-600">Bearer {'<API_KEY>'}</td>
												<td className="px-4 py-2.5 text-gray-500">{t('llm.apiChannel.replaceWithApiKey')}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							{/* Request Body */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.requestBody')}</h3>
								<div className="border rounded-lg overflow-hidden">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-gray-50 text-left">
												<th className="px-4 py-2.5 font-medium text-gray-600">{t('llm.apiColumn.parameter')}</th>
												<th className="px-4 py-2.5 font-medium text-gray-600">{t('llm.apiColumn.type')}</th>
												<th className="px-4 py-2.5 font-medium text-gray-600">{t('llm.apiColumn.required')}</th>
												<th className="px-4 py-2.5 font-medium text-gray-600">{t('llm.apiColumn.description')}</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											<tr>
												<td className="px-4 py-2.5 font-mono text-xs text-gray-800">messages</td>
												<td className="px-4 py-2.5 text-gray-600">array</td>
												<td className="px-4 py-2.5">
													<Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">{t('llm.apiColumn.yes')}</Badge>
												</td>
												<td className="px-4 py-2.5 text-gray-500">{t('llm.apiColumn.messagesDesc')}</td>
											</tr>
											<tr>
												<td className="px-4 py-2.5 font-mono text-xs text-gray-800">stream</td>
												<td className="px-4 py-2.5 text-gray-600">boolean</td>
												<td className="px-4 py-2.5">
													<Badge variant="outline" className="text-xs text-gray-500">{t('llm.apiColumn.no')}</Badge>
												</td>
												<td className="px-4 py-2.5 text-gray-500">{t('llm.apiColumn.streamDesc')}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							{/* Request Example */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.requestExample')}</h3>
								<CodeBlock
									code={`{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "stream": true
}`}
								/>
							</div>

							{/* Response Example */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.responseExample')}</h3>
								<CodeBlock
									code={`{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好！有什么我可以帮你的吗？"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}`}
								/>
							</div>
						</TabsContent>

						{/* Tab: Streaming */}
						<TabsContent value="streaming" className="space-y-5">
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.enableStreaming')}</h3>
								<p className="text-sm text-gray-600">
									{t('llm.apiChannel.enableStreamingDesc')}
								</p>
							</div>

							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.streamingResponseExample')}</h3>
								<CodeBlock
									language="text"
									code={`data: {"choices":[{"index":0,"delta":{"content":"你好"},"finish_reason":null}]}

data: {"choices":[{"index":0,"delta":{"content":"！"},"finish_reason":null}]}

data: {"choices":[{"index":0,"delta":{"content":"有什么"},"finish_reason":null}]}

data: {"choices":[{"index":0,"delta":{"content":"可以帮你的吗？"},"finish_reason":null}]}

data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop","usage":{"prompt_tokens":9,"completion_tokens":12,"total_tokens":21}}]}

data: [DONE]`}
								/>
							</div>

							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">{t('llm.apiChannel.clientExample')}</h3>
								<Tabs defaultValue="python">
									<TabsList className="mb-2">
										<TabsTrigger value="python">Python</TabsTrigger>
										<TabsTrigger value="java">Java</TabsTrigger>
										<TabsTrigger value="csharp">C#</TabsTrigger>
										<TabsTrigger value="go">Go</TabsTrigger>
									</TabsList>
									<TabsContent value="python">
										<CodeBlock
											language="python"
											code={`import requests
import json

url = "https://your-domain.com/llm/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
payload = {
    "messages": [{"role": "user", "content": "你好"}],
    "stream": True
}

with requests.post(url, headers=headers, json=payload, stream=True) as r:
    for line in r.iter_lines():
        if line:
            line = line.decode("utf-8")
            if line.startswith("data: ") and line != "data: [DONE]":
                data = json.loads(line[6:])
                content = data["choices"][0]["delta"].get("content", "")
                if content:
                    print(content, end="", flush=True)`}
										/>
									</TabsContent>
									<TabsContent value="java">
										<CodeBlock
											language="java"
											code={`import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class StreamExample {
    public static void main(String[] args) throws Exception {
        String json = """
            {
                "messages": [{"role": "user", "content": "你好"}],
                "stream": true
            }""";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://your-domain.com/llm/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer YOUR_API_KEY")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        client.send(request, HttpResponse.BodyHandlers.ofLines())
                .body()
                .filter(line -> line.startsWith("data: "))
                .filter(line -> !line.equals("data: [DONE]"))
                .map(line -> line.substring(6))
                .forEach(data -> {
                    // 解析 JSON 获取 delta.content
                    // 推荐使用 Jackson 或 Gson
                    System.out.println(data);
                });
    }
}`}
										/>
									</TabsContent>
									<TabsContent value="csharp">
										<CodeBlock
											language="csharp"
											code={`using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

var url = "https://your-domain.com/llm/v1/chat/completions";
var payload = new
{
    messages = new[] { new { role = "user", content = "你好" } },
    stream = true
};

using var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");

var request = new HttpRequestMessage(HttpMethod.Post, url)
{
    Content = new StringContent(
        JsonSerializer.Serialize(payload),
        Encoding.UTF8,
        "application/json")
};

using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
using var stream = await response.Content.ReadAsStreamAsync();
using var reader = new StreamReader(stream);

while (await reader.ReadLineAsync() is { } line)
{
    if (line.StartsWith("data: ") && line != "data: [DONE]")
    {
        var json = JsonDocument.Parse(line[6..]);
        var content = json.RootElement
            .GetProperty("choices")[0]
            .GetProperty("delta")
            .TryGetProperty("content", out var c) ? c.GetString() : null;

        if (!string.IsNullOrEmpty(content))
            Console.Write(content);
    }
}`}
										/>
									</TabsContent>
									<TabsContent value="go">
										<CodeBlock
											language="go"
											code={`package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

func main() {
	body, _ := json.Marshal(map[string]any{
		"messages": []map[string]string{
			{"role": "user", "content": "你好"},
		},
		"stream": true,
	})

	req, _ := http.NewRequest("POST",
		"https://your-domain.com/llm/v1/chat/completions",
		bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("请求失败: %v\\n", err)
		return
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") || line == "data: [DONE]" {
			continue
		}
		var result struct {
			Choices []struct {
				Delta struct {
					Content string \`json:"content"\`
				} \`json:"delta"\`
			} \`json:"choices"\`
		}
		if err := json.Unmarshal([]byte(line[6:]), &result); err != nil {
			continue
		}
		if len(result.Choices) > 0 {
			fmt.Print(result.Choices[0].Delta.Content)
		}
	}
	if err := scanner.Err(); err != nil && err != io.EOF {
		fmt.Printf("读取失败: %v\\n", err)
	}
}`}
										/>
									</TabsContent>
								</Tabs>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
