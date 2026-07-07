import { GLOBAL_CONFIG } from "@/global-config";
import type { ChatChunk, FileContent } from "./llmChatService";

export interface PublicChatRequestParams {
    chatId: string;
    conversationId: string;
    webPageKey: string;
    message: string;
    files?: FileContent[];
}

/**
 * 公开聊天接口（无需认证）
 */
export function publicChatApi(
    data: PublicChatRequestParams,
    controller: AbortController,
    onChunk?: (chunk: ChatChunk) => void
) {
    let url = `${GLOBAL_CONFIG.apiBaseUrl}/llm/aigc/chat/public/completions`;

    if (!GLOBAL_CONFIG.isCloud) {
        url = url.replace('/llm/', '/boot/');
    }

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
    }).then(async (response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let pendingEventType = 'message';
        let pendingData: string | null = null;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) {
                        if (pendingData != null) {
                            onChunk?.({ data: pendingData, eventType: pendingEventType });
                            pendingData = null;
                        }
                        pendingEventType = 'message';
                        continue;
                    }
                    if (trimmedLine.startsWith('event:')) {
                        pendingEventType = trimmedLine.substring(6).trim() || 'message';
                        continue;
                    }
                    if (trimmedLine.startsWith('data:')) {
                        pendingData = (pendingData != null ? pendingData : '') + trimmedLine.substring(5);
                    }
                }
            }

            if (pendingData != null) {
                onChunk?.({ data: pendingData, eventType: pendingEventType });
            } else if (buffer.trim()) {
                onChunk?.({ data: buffer.trim(), eventType: pendingEventType });
            }
        } finally {
            reader.releaseLock();
        }
    });
}

/**
 * 获取公开应用信息
 */
export function getPublicAppInfoApi(webPageKey: string): Promise<{ name: string; des?: string }> {
    let url = `${GLOBAL_CONFIG.apiBaseUrl}/llm/aigc/app/public/info`;

    if (!GLOBAL_CONFIG.isCloud) {
        url = url.replace('/llm/', '/boot/');
    }

    return fetch(`${url}?webPageKey=${webPageKey}`)
        .then(res => res.json())
        .then(data => {
            if (data.code === 0) {
                return data.data;
            }
            throw new Error(data.msg || '获取应用信息失败');
        });
}

/**
 * 获取公开应用开场白
 */
export function getPublicPrologueApi(webPageKey: string): Promise<string> {
    let url = `${GLOBAL_CONFIG.apiBaseUrl}/llm/aigc/chat/public/prologue`;

    if (!GLOBAL_CONFIG.isCloud) {
        url = url.replace('/llm/', '/boot/');
    }

    return fetch(`${url}?webPageKey=${webPageKey}`)
        .then(res => res.json())
        .then(data => {
            if (data.code === 0) {
                return data.data || '';
            }
            return '';
        });
}
