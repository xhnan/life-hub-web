<template>
	<div class="health-ai-container">
		<div class="ai-content">
			<div class="chat-section">
				<div class="chat-messages" ref="messagesContainer">
					<TransitionGroup name="message">
						<div
							v-for="(message, index) in messages"
							:key="index"
							:class="['message', message.role === 'user' ? 'user-message' : 'ai-message']"
						>
							<div class="message-avatar">
								<el-icon v-if="message.role === 'user'" :size="18"><User /></el-icon>
								<el-icon v-else :size="18"><ChatDotRound /></el-icon>
							</div>
							<div class="message-content">
								<div class="message-text" v-html="formatMessage(message.content)"></div>
								<div class="message-meta">
									<span class="message-time">{{ message.time }}</span>
									<el-icon
										v-if="message.role === 'assistant'"
										class="copy-icon"
										:size="14"
										@click="copyMessage(message.content)"
									>
										<CopyDocument />
									</el-icon>
								</div>
							</div>
						</div>
					</TransitionGroup>

					<Transition name="fade">
						<div v-if="isAiThinking" class="message ai-message">
							<div class="message-avatar">
								<el-icon :size="18"><ChatDotRound /></el-icon>
							</div>
							<div class="message-content">
								<div class="thinking-dots">
									<span class="dot"></span>
									<span class="dot"></span>
									<span class="dot"></span>
								</div>
							</div>
						</div>
					</Transition>
				</div>

				<div class="chat-input">
					<div class="input-wrapper">
						<el-input
							v-model="userInput"
							type="textarea"
							:rows="2"
							placeholder="输入你的健康问题，Enter 发送，Shift + Enter 换行"
							@keydown.enter.prevent="handleEnterKey"
							:disabled="isAiThinking"
							class="message-input"
						/>
						<el-button
							type="primary"
							:loading="isAiThinking"
							@click="sendMessage"
							:disabled="!userInput.trim()"
							class="send-button"
							circle
							size="large"
						>
							<el-icon v-if="!isAiThinking"><Promotion /></el-icon>
						</el-button>
					</div>
				</div>
			</div>

			<div class="sidebar">
				<div class="sidebar-card">
					<div class="card-header">
						<el-icon><Lightning /></el-icon>
						<span>快捷提问</span>
					</div>
					<div class="quick-actions-grid">
						<div
							v-for="action in quickActions"
							:key="action.key"
							class="quick-action-item"
							@click="handleQuickAction(action.key)"
						>
							<div class="action-icon" :style="{ background: action.color }">
								<el-icon :size="20">
									<component :is="action.icon" />
								</el-icon>
							</div>
							<span>{{ action.label }}</span>
						</div>
					</div>
				</div>

				<div class="sidebar-card">
					<div class="card-header">
						<el-icon><DataAnalysis /></el-icon>
						<span>健康摘要</span>
					</div>
					<div class="health-stats">
						<div class="stat-item">
							<div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
								<el-icon :size="20"><TrendCharts /></el-icon>
							</div>
							<div class="stat-content">
								<div class="stat-label">本周步数</div>
								<div class="stat-value">8,432</div>
								<div class="stat-change positive">
									<el-icon :size="12"><CaretTop /></el-icon>
									+12%
								</div>
							</div>
						</div>
						<div class="stat-item">
							<div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
								<el-icon :size="20"><Odometer /></el-icon>
							</div>
							<div class="stat-content">
								<div class="stat-label">运动时长</div>
								<div class="stat-value">356 分钟</div>
								<div class="stat-change positive">
									<el-icon :size="12"><CaretTop /></el-icon>
									+8%
								</div>
							</div>
						</div>
						<div class="stat-item">
							<div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
								<el-icon :size="20"><Moon /></el-icon>
							</div>
							<div class="stat-content">
								<div class="stat-label">平均睡眠</div>
								<div class="stat-value">7.5 小时</div>
								<div class="stat-change neutral">
									<el-icon :size="12"><Minus /></el-icon>
									持平
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="sidebar-card tips-card">
					<div class="card-header">
						<el-icon><Memo /></el-icon>
						<span>健康提醒</span>
					</div>
					<ul class="tips-list">
						<li>聊天窗口支持流式回复，后端推送内容会逐段显示。</li>
						<li>如果接口异常，页面会自动切换到本地兜底回答。</li>
						<li>复制按钮可以快速保存 AI 的建议内容。</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
	User,
	ChatDotRound,
	TrendCharts,
	Odometer,
	Moon,
	Lightning,
	DataAnalysis,
	CopyDocument,
	Promotion,
	Memo,
	CaretTop,
	Minus
} from '@element-plus/icons-vue';
import { streamChatApi, type SSEChunk } from '@/api/health/aiApi';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	time: string;
}

const messages = ref<Message[]>([
	{
		role: 'assistant',
		content: '你好，我是健康 AI 助手。你可以直接输入问题，或者点击右侧快捷建议开始对话。',
		time: getCurrentTime()
	}
]);

const userInput = ref('');
const isAiThinking = ref(false);
const messagesContainer = ref<HTMLElement>();

const quickActions = [
	{ key: 'analysis', label: '健康分析', icon: TrendCharts, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
	{ key: 'exercise', label: '运动建议', icon: Odometer, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
	{ key: 'sleep', label: '睡眠改善', icon: Moon, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
	{ key: 'diet', label: '饮食建议', icon: Lightning, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
];

function getCurrentTime(): string {
	const now = new Date();
	return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function formatMessage(content: string): string {
	return content
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\n/g, '<br>')
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function updateAiMessage(index: number, content: string) {
	if (messages.value[index]) {
		messages.value[index].content = content;
	}
}

function normalizeSSEChunk(payload: unknown): SSEChunk | null {
	if (payload == null) {
		return null;
	}

	if (typeof payload === 'string') {
		return {
			type: 'delta',
			content: payload,
			done: false,
			timestamp: Date.now()
		};
	}

	if (typeof payload !== 'object') {
		return null;
	}

	const data = payload as Record<string, any>;

	if (typeof data.type === 'string' && typeof data.content === 'string') {
		return {
			type: data.type,
			content: data.content,
			done: Boolean(data.done),
			timestamp: data.timestamp ?? Date.now()
		};
	}

	if (typeof data.content === 'string') {
		return {
			type: data.done ? 'complete' : 'delta',
			content: data.content,
			done: Boolean(data.done),
			timestamp: data.timestamp ?? Date.now()
		};
	}

	const choice = data.choices?.[0];
	const deltaContent = choice?.delta?.content ?? choice?.message?.content ?? data.delta?.content;
	if (typeof deltaContent === 'string' && deltaContent.length > 0) {
		return {
			type: 'delta',
			content: deltaContent,
			done: false,
			timestamp: Date.now()
		};
	}

	if (choice?.finish_reason || data.done === true) {
		return {
			type: 'complete',
			content: '',
			done: true,
			timestamp: Date.now()
		};
	}

	if (data.error || data.message) {
		return {
			type: 'error',
			content: data.error?.message ?? data.message ?? 'AI 响应失败',
			done: true,
			timestamp: Date.now()
		};
	}

	return null;
}

function extractSSEChunks(block: string): SSEChunk[] {
	const lines = block.split(/\r?\n/);
	const dataLines: string[] = [];

	for (const line of lines) {
		if (line.startsWith('data:')) {
			dataLines.push(line.slice(5).trimStart());
		}
	}

	if (dataLines.length === 0) {
		return [];
	}

	const payload = dataLines.join('\n').trim();
	if (!payload) {
		return [];
	}

	if (payload === '[DONE]') {
		return [{
			type: 'complete',
			content: '',
			done: true,
			timestamp: Date.now()
		}];
	}

	try {
		const parsed = JSON.parse(payload);
		const chunk = normalizeSSEChunk(parsed);
		return chunk ? [chunk] : [];
	} catch {
		return [{
			type: 'delta',
			content: payload,
			done: false,
			timestamp: Date.now()
		}];
	}
}

async function scrollToBottom() {
	await nextTick();
	if (messagesContainer.value) {
		messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
	}
}

async function consumeSSEStream(response: Response, aiMessageIndex: number) {
	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error('Response body is not readable');
	}

	const decoder = new TextDecoder();
	let buffer = '';
	let fullContent = '';

	const applyChunk = async (chunk: SSEChunk) => {
		if (chunk.type === 'start') {
			fullContent = '';
			updateAiMessage(aiMessageIndex, fullContent);
			return;
		}

		if (chunk.type === 'delta') {
			fullContent += chunk.content;
			updateAiMessage(aiMessageIndex, fullContent);
			await scrollToBottom();
			return;
		}

		if (chunk.type === 'complete') {
			if (chunk.content) {
				fullContent += chunk.content;
			}
			updateAiMessage(aiMessageIndex, fullContent);
			await scrollToBottom();
			return;
		}

		if (chunk.type === 'error') {
			throw new Error(chunk.content || 'AI 响应失败');
		}
	};

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const blocks = buffer.split(/\r?\n\r?\n/);
		buffer = blocks.pop() || '';

		for (const block of blocks) {
			const chunks = extractSSEChunks(block);
			for (const chunk of chunks) {
				await applyChunk(chunk);
			}
		}
	}

	buffer += decoder.decode();
	if (buffer.trim()) {
		for (const chunk of extractSSEChunks(buffer)) {
			await applyChunk(chunk);
		}
	}
}

function handleEnterKey(event: KeyboardEvent) {
	if (!event.shiftKey) {
		sendMessage();
	}
}

async function sendMessage() {
	const message = userInput.value.trim();
	if (!message || isAiThinking.value) return;

	messages.value.push({
		role: 'user',
		content: message,
		time: getCurrentTime()
	});

	userInput.value = '';
	isAiThinking.value = true;

	const aiMessageIndex = messages.value.length;
	messages.value.push({
		role: 'assistant',
		content: '',
		time: getCurrentTime()
	});

	await scrollToBottom();

	try {
		const response = await streamChatApi({
			message,
			historyLimit: 10
		});

		await consumeSSEStream(response, aiMessageIndex);
	} catch (error) {
		console.error('AI stream failed:', error);

		messages.value.splice(aiMessageIndex, 1);

		const fallbackResponse = await generateAiResponse(message);
		messages.value.push({
			role: 'assistant',
			content: `${fallbackResponse}\n\n*当前为本地兜底回答，说明流式响应解析失败或接口异常。*`,
			time: getCurrentTime()
		});

		ElMessage.warning('AI 流式响应失败，已切换为本地兜底回答');
	} finally {
		isAiThinking.value = false;
		await scrollToBottom();
	}
}

async function generateAiResponse(question: string): Promise<string> {
	const responses: Record<string, string> = {
		健康分析: '从基础习惯开始排查：睡眠、饮食、运动频率，以及最近是否有明显压力变化。',
		运动建议: '建议先从每周 3 到 4 次中等强度运动开始，每次 30 到 45 分钟。',
		睡眠改善: '固定入睡和起床时间，睡前 1 小时减少电子屏幕刺激，通常会更有效。',
		饮食建议: '优先保证蛋白质、蔬菜和饮水量，再控制高糖和高油零食。'
	};

	for (const [key, value] of Object.entries(responses)) {
		if (question.includes(key)) {
			return value;
		}
	}

	return `我已经收到你的问题：“${question}”。如果你愿意，我可以继续按“症状分析、生活方式建议、需要就医的信号”三个部分给你拆解。`;
}

function handleQuickAction(actionKey: string) {
	const actionLabels: Record<string, string> = {
		analysis: '请帮我做一个健康状态分析',
		exercise: '请给我一些运动建议',
		sleep: '请给我一些改善睡眠的建议',
		diet: '请给我一些饮食建议'
	};

	const message = actionLabels[actionKey];
	if (message) {
		userInput.value = message;
		sendMessage();
	}
}

function copyMessage(content: string) {
	navigator.clipboard.writeText(content);
	ElMessage.success('消息已复制');
}

onMounted(() => {
	scrollToBottom();
});
</script>

<style scoped lang="scss">
.health-ai-container {
	padding: 20px;
	height: calc(100vh - 90px);
	display: flex;
	flex-direction: column;
	background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
	overflow: hidden;
}

.ai-content {
	display: flex;
	gap: 24px;
	flex: 1;
	min-height: 0;
}

.chat-section {
	flex: 1;
	background: white;
	border-radius: 16px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.chat-messages {
	flex: 1;
	padding: 20px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 16px;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: #f3f4f6;
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;

		&:hover {
			background: #9ca3af;
		}
	}
}

.message {
	display: flex;
	gap: 12px;
	max-width: 70%;
	animation: slideIn 0.3s ease-out;

	&.user-message {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	&.ai-message {
		align-self: flex-start;
	}
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.message-enter-active,
.message-leave-active {
	transition: all 0.3s ease;
}

.message-enter-from {
	opacity: 0;
	transform: translateY(10px);
}

.message-avatar {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.user-message .message-avatar {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.ai-message .message-avatar {
	background: #f3f4f6;
	color: #6b7280;
}

.message-content {
	display: flex;
	flex-direction: column;
	gap: 4px;
	max-width: 100%;
}

.message-text {
	padding: 14px 16px;
	border-radius: 12px;
	line-height: 1.6;
	word-wrap: break-word;
	font-size: 14px;
}

.user-message .message-text {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-bottom-right-radius: 4px;
}

.ai-message .message-text {
	background: #f9fafb;
	color: #1f2937;
	border: 1px solid #e5e7eb;
	border-bottom-left-radius: 4px;
}

.message-meta {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 0 4px;
}

.message-time {
	font-size: 11px;
	color: #9ca3af;
}

.copy-icon {
	cursor: pointer;
	color: #9ca3af;
	transition: color 0.2s;

	&:hover {
		color: #6b7280;
	}
}

.thinking-dots {
	display: flex;
	gap: 6px;
	padding: 14px 18px;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	width: fit-content;

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #9ca3af;
		animation: bounce 1.4s infinite ease-in-out;

		&:nth-child(1) {
			animation-delay: 0s;
		}

		&:nth-child(2) {
			animation-delay: 0.2s;
		}

		&:nth-child(3) {
			animation-delay: 0.4s;
		}
	}
}

@keyframes bounce {
	0%,
	60%,
	100% {
		transform: translateY(0);
		opacity: 0.7;
	}

	30% {
		transform: translateY(-8px);
		opacity: 1;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.chat-input {
	padding: 20px;
	border-top: 1px solid #e5e7eb;
	background: #fafafa;
}

.input-wrapper {
	display: flex;
	gap: 12px;
	align-items: flex-end;
}

.message-input {
	flex: 1;

	:deep(.el-textarea__inner) {
		border-radius: 12px;
		border: 2px solid #e5e7eb;
		padding: 12px 16px;
		transition: all 0.2s;
		font-size: 14px;
		line-height: 1.5;

		&:focus {
			border-color: #667eea;
			box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		}
	}
}

.send-button {
	flex-shrink: 0;
	width: 44px;
	height: 44px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border: none;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
	}

	&:active {
		transform: translateY(0);
	}
}

.sidebar {
	width: 320px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	overflow-y: auto;
	padding-right: 4px;

	&::-webkit-scrollbar {
		width: 4px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 2px;

		&:hover {
			background: #9ca3af;
		}
	}
}

.sidebar-card {
	background: white;
	border-radius: 16px;
	padding: 18px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.card-header {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 14px;
	font-size: 15px;
}

.quick-actions-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}

.quick-action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 18px 12px 14px 12px;
	background: #f9fafb;
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.2s;
	border: 2px solid transparent;

	&:hover {
		background: white;
		border-color: #667eea;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
	}

	span {
		font-size: 13px;
		color: #4b5563;
		font-weight: 500;
		text-align: center;
		line-height: 1.2;
	}
}

.action-icon {
	width: 42px;
	height: 42px;
	border-radius: 11px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;
}

.health-stats {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.stat-item {
	display: flex;
	gap: 12px;
	padding: 14px 12px;
	background: #f9fafb;
	border-radius: 12px;
	transition: all 0.2s;
	min-height: 70px;

	&:hover {
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
}

.stat-icon {
	width: 44px;
	height: 44px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;
}

.stat-content {
	display: flex;
	flex-direction: column;
	justify-content: center;
	flex: 1;
	min-width: 0;
}

.stat-label {
	font-size: 12px;
	color: #6b7280;
	margin-bottom: 2px;
}

.stat-value {
	font-size: 17px;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 4px;
}

.stat-change {
	font-size: 12px;
	display: flex;
	align-items: center;
	gap: 2px;

	&.positive {
		color: #10b981;
	}

	&.neutral {
		color: #6b7280;
	}
}

.tips-card {
	background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
	border: 1px solid #667eea30;
}

.tips-list {
	margin: 0;
	padding-left: 18px;

	li {
		font-size: 12px;
		color: #4b5563;
		line-height: 1.7;
		margin-bottom: 8px;

		&:last-child {
			margin-bottom: 0;
		}
	}
}

@media (max-width: 1024px) {
	.ai-content {
		flex-direction: column;
		overflow-y: auto;
		min-height: 0;
	}

	.sidebar {
		width: 100%;
		flex-shrink: 0;
	}

	.chat-section {
		min-height: 500px;
	}

	.quick-actions-grid {
		grid-template-columns: repeat(4, 1fr);
	}
}

@media (max-width: 768px) {
	.health-ai-container {
		padding: 16px;
		height: calc(100vh - 80px);
	}

	.quick-actions-grid {
		grid-template-columns: 1fr 1fr;
	}

	.message {
		max-width: 85%;
	}

	.sidebar-card {
		padding: 16px;
	}

	.chat-messages {
		padding: 16px;
	}

	.chat-input {
		padding: 16px;
	}
}
</style>
