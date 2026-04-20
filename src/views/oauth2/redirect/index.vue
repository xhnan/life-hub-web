<template>
	<div class="oauth-redirect">
		<div class="redirect-card">
			<template v-if="status === 'processing'">
				<el-icon :size="40" class="spin-icon"><Loading /></el-icon>
				<h2>正在完成 GitHub 授权登录...</h2>
			</template>

			<template v-else-if="status === 'success'">
				<el-icon :size="48" color="#22c55e"><CircleCheckFilled /></el-icon>
				<h2>登录成功</h2>
				<p>正在跳转，请稍候...</p>
			</template>

			<template v-else>
				<el-icon :size="48" color="#ef4444"><CircleCloseFilled /></el-icon>
				<h2>授权失败</h2>
				<p class="error-msg">{{ errorMessage }}</p>
				<el-button type="primary" round @click="goLogin">
					<el-icon><ArrowLeft /></el-icon>
					返回登录
				</el-button>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, CircleCheckFilled, CircleCloseFilled, ArrowLeft } from '@element-plus/icons-vue';
import { STORAGE_KEYS } from '@/utils/constants';

const router = useRouter();

const status = ref<'processing' | 'success' | 'error'>('processing');
const errorMessage = ref('');

const goLogin = () => {
	router.push('/login');
};

onMounted(() => {
	// 后端 GithubLoginSuccessHandler 会 302 重定向到此页面，参数通过 query 传递
	// 格式: /oauth2/redirect?token=eyJhbG...&username=xxx&avatar=xxx&expiresIn=86400000
	const query = router.currentRoute.value.query;
	const token = query.token as string;
	const error = query.error as string;

	// 授权被拒绝
	if (error) {
		status.value = 'error';
		errorMessage.value = (query.error_description as string) || 'GitHub 授权被拒绝';
		return;
	}

	if (!token) {
		status.value = 'error';
		errorMessage.value = '未收到登录凭证，请重新登录';
		return;
	}

	// 存储 Token
	localStorage.setItem(STORAGE_KEYS.TOKEN, token);

	// 过期时间（后端传的是毫秒）
	const expiresIn = Number(query.expiresIn) || 86400000;
	localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, (Date.now() + expiresIn).toString());

	// 存储用户信息
	const username = query.username as string;
	const avatar = query.avatar as string;
	if (username) {
		localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify({ username, avatar }));
	}

	status.value = 'success';
	ElMessage.success('GitHub 登录成功，欢迎回来！');

	setTimeout(() => {
		router.push('/');
	}, 600);
});
</script>

<style scoped lang="scss">
.oauth-redirect {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background: #0f172a;
	font-family: 'Inter', system-ui, sans-serif;
}

.redirect-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 48px 56px;
	background: rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 20px;
	color: white;
	text-align: center;

	h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
	}

	p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 14px;
		margin: 0;
	}

	.error-msg {
		color: #f87171;
		max-width: 360px;
		word-break: break-all;
	}
}

.spin-icon {
	color: #818cf8;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
