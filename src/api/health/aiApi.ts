import { STORAGE_KEYS } from '@/utils/constants';

/**
 * 健康助手流式对话
 * @param data 对话参数
 * @returns Promise with Response object for streaming
 */
export const streamChatApi = async (data: StreamChatRequest): Promise<Response> => {
	const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

	const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health/chat/stream`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'text/event-stream',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return response;
};

/**
 * 流式聊天请求参数
 */
export interface StreamChatRequest {
	message: string;
	historyLimit?: number;
	systemPrompt?: string;
}

/**
 * SSE 事件数据块
 */
export interface SSEChunk {
	type: 'start' | 'delta' | 'complete' | 'error';
	content: string;
	done: boolean;
	timestamp: number;
}
