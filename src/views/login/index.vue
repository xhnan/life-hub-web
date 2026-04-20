<template>
	<div class="login-container">
		<!-- 背景 -->
		<div class="background-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>

		<div class="login-box slide-in">
			<!-- 左侧品牌 -->
			<div class="login-left">
				<div class="left-content">
					<div class="logo-circle">
						<el-icon :size="36" color="#fff"><s-promotion /></el-icon>
					</div>
					<h1 class="brand-title">LifeHub</h1>
					<p class="brand-desc">你的生活管理中心</p>
					<div class="brand-features">
						<div class="feature-item">
							<el-icon :size="16"><Check /></el-icon>
							<span>智能记账</span>
						</div>
						<div class="feature-item">
							<el-icon :size="16"><Check /></el-icon>
							<span>健康追踪</span>
						</div>
						<div class="feature-item">
							<el-icon :size="16"><Check /></el-icon>
							<span>生活管理</span>
						</div>
					</div>
				</div>
				<div class="glass-decoration"></div>
				<div class="glass-decoration decoration-2"></div>
			</div>

			<!-- 右侧表单 -->
			<div class="login-right">
				<!-- Tab 切换 -->
				<div class="login-tabs" role="tablist">
					<div
						role="tab"
						class="tab-item"
						:class="{ active: loginType === 'account' }"
						:aria-selected="loginType === 'account'"
						tabindex="0"
						@click="switchLoginType('account')"
						@keydown.enter="switchLoginType('account')"
					>
						<el-icon :size="15"><User /></el-icon>
						<span>账号登录</span>
					</div>
					<div
						role="tab"
						class="tab-item"
						:class="{ active: loginType === 'qrcode' }"
						:aria-selected="loginType === 'qrcode'"
						tabindex="0"
						@click="switchLoginType('qrcode')"
						@keydown.enter="switchLoginType('qrcode')"
					>
						<el-icon :size="15"><Connection /></el-icon>
						<span>扫码登录</span>
					</div>
					<div class="tab-indicator" :class="{ 'slide-right': loginType === 'qrcode' }"></div>
				</div>

				<!-- 内容区 -->
				<div class="login-content">
					<Transition name="mode-fade" mode="out-in">
						<!-- 账号密码登录 -->
						<div v-if="loginType === 'account'" key="account">
							<div class="form-header">
								<h2>欢迎回来</h2>
								<p>请登录您的账号以继续</p>
							</div>

							<el-form
								ref="loginFormRef"
								:model="loginForm"
								:rules="loginRules"
								class="login-form"
								size="large"
							>
								<el-form-item prop="username">
									<el-input
										v-model="loginForm.username"
										placeholder="用户名 / 邮箱"
										:prefix-icon="User"
										class="custom-input"
										@keyup.enter="handleUsernameEnter"
									/>
								</el-form-item>

								<el-form-item prop="password">
									<el-input
										ref="passwordInputRef"
										v-model="loginForm.password"
										type="password"
										placeholder="密码"
										show-password
										:prefix-icon="Lock"
										class="custom-input"
										@keyup.enter="handleLogin"
									/>
								</el-form-item>

								<div class="form-options">
									<el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
									<el-link type="primary" underline="never" class="forgot-pwd">忘记密码？</el-link>
								</div>

								<el-alert
									v-if="errorMessage"
									:title="errorMessage"
									type="error"
									show-icon
									:closable="false"
									class="login-error"
								/>

								<el-form-item>
									<el-button
										type="primary"
										class="submit-btn"
										:loading="loading"
										@click="handleLogin"
										round
									>
										{{ loading ? '登录中...' : '立即登录' }}
									</el-button>
								</el-form-item>
							</el-form>
						</div>

						<!-- 扫码登录 -->
						<div v-else key="qrcode" class="qrcode-panel">
							<div class="form-header">
								<h2>扫码登录</h2>
								<p>请使用 APP 扫描二维码登录</p>
							</div>

							<div class="qrcode-wrapper">
								<div class="qrcode-box" :class="{ 'is-scanned': qrcodeScanned, 'is-expired': qrcodeExpired }">
									<img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="扫码登录二维码" class="qrcode-img" />
									<!-- 已扫码 -->
									<div v-if="qrcodeScanned && !qrcodeExpired" class="qrcode-overlay">
										<el-icon :size="32" color="#4f46e5"><CircleCheckFilled /></el-icon>
										<p class="overlay-title">扫描成功</p>
										<p class="overlay-sub">请在手机上确认登录</p>
									</div>
									<!-- 已过期 -->
									<div v-if="qrcodeExpired" class="qrcode-overlay">
										<el-icon :size="28" color="#64748b"><RefreshRight /></el-icon>
										<p class="overlay-title">二维码已过期</p>
										<el-button type="primary" size="small" round @click="initQrcode">点击刷新</el-button>
									</div>
								</div>
								<p class="qrcode-tip">
									打开 <strong>APP</strong>，扫描二维码登录
								</p>
							</div>

							<div class="qrcode-steps">
								<div class="step-item">
									<span class="step-num">1</span>
									<span>打开 APP 扫一扫</span>
								</div>
								<div class="step-item">
									<span class="step-num">2</span>
									<span>扫描二维码</span>
								</div>
								<div class="step-item">
									<span class="step-num">3</span>
									<span>确认后登录</span>
								</div>
							</div>
						</div>
					</Transition>
				</div>

				<!-- 底部 -->
				<div class="form-footer">
					<div class="social-login">
						<div class="divider"><span>其他登录方式</span></div>
						<div class="social-buttons">
							<button class="social-btn github-btn" @click="handleGithubLogin" aria-label="GitHub 登录">
								<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
									<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
								</svg>
								<span>GitHub</span>
							</button>
						</div>
					</div>
					<p class="register-link">还没有账号？ <el-link type="primary" underline="never">立即注册</el-link></p>
				</div>
			</div>
		</div>

		<!-- ICP -->
		<div class="icp-info">
			<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">赣ICP备2026003009号-1</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, Promotion as SPromotion, Connection, RefreshRight, CircleCheckFilled, Check } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import { loginApi, generateQrcodeApi, getQrcodeStatusApi, type LoginForm } from '@/api/authApi';
import { STORAGE_KEYS } from '@/utils/constants';

const router = useRouter();

// ========== 通用 ==========
const loginType = ref<'account' | 'qrcode'>('account');
const loginFormRef = ref<FormInstance>();
const passwordInputRef = ref();
const loading = ref(false);
const errorMessage = ref('');

const loginForm = reactive<LoginForm>({
	username: '',
	password: '',
	rememberMe: false
});

const loginRules: FormRules = {
	username: [
		{ required: true, message: '请输入用户名', trigger: 'blur' },
		{ min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
	],
	password: [
		{ required: true, message: '请输入密码', trigger: 'blur' },
		{ min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
	]
};

// ========== 扫码 ==========
const qrcodeDataUrl = ref('');
const qrcodeExpired = ref(false);
const qrcodeScanned = ref(false);
const qrcodeId = ref('');
let pollTimer: ReturnType<typeof setInterval> | null = null;

const switchLoginType = (type: 'account' | 'qrcode') => {
	loginType.value = type;
	if (type === 'qrcode') {
		setTimeout(() => initQrcode(), 350);
	} else {
		stopPolling();
	}
};

const initQrcode = async () => {
	stopPolling();
	qrcodeExpired.value = false;
	qrcodeScanned.value = false;
	qrcodeDataUrl.value = '';

	try {
		const res = await generateQrcodeApi();
		if (res.code === 200 && res.data) {
			qrcodeId.value = res.data.qrCodeId;
			const content = `lifehub://qrcode/login?qrCodeId=${res.data.qrCodeId}`;
			qrcodeDataUrl.value = await QRCode.toDataURL(content, {
				width: 168,
				margin: 2,
				color: { dark: '#1e293b', light: '#ffffff' }
			});
			startPolling();
		}
	} catch (err) {
		console.error('生成二维码失败:', err);
		ElMessage.error('获取二维码失败，请稍后重试');
	}
};

const startPolling = () => {
	pollTimer = setInterval(async () => {
		if (!qrcodeId.value) return;
		try {
			const res = await getQrcodeStatusApi(qrcodeId.value);
			if (res.code !== 200 || !res.data) return;

			const { status } = res.data;

			if (status === 'SCANNED') {
				qrcodeScanned.value = true;
			} else if (status === 'CONFIRMED') {
				stopPolling();
				if (res.data.token) {
					localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
					const expiresAt = Date.now() + (res.data.expiresIn || 86400000);
					localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
					if (res.data.username) {
						localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify({ username: res.data.username, avatar: res.data.avatar }));
					}
					ElMessage.success('登录成功，欢迎回来！');
					router.push('/');
				}
			} else if (status === 'EXPIRED') {
				stopPolling();
				qrcodeExpired.value = true;
			} else if (status === 'CANCELLED') {
				stopPolling();
				ElMessage.warning('用户已取消登录');
				qrcodeExpired.value = true;
			}
		} catch { /* silent */ }
	}, 2000);
};

const stopPolling = () => {
	if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
};

onUnmounted(stopPolling);

// ========== 账号登录 ==========
const handleUsernameEnter = () => { passwordInputRef.value?.focus(); };

const handleLogin = async () => {
	if (!loginFormRef.value) return;
	await loginFormRef.value.validate(async (valid) => {
		if (!valid) return;
		loading.value = true;
		errorMessage.value = '';
		try {
			const res = await loginApi(loginForm);
			if (res.code === 200 && res.data) {
				localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
				localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, (Date.now() + res.data.expiresIn * 1000).toString());
				localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify({ username: res.data.username, avatar: res.data.avatar }));
				ElMessage.success('登录成功，欢迎回来！');
				router.push('/');
			} else {
				errorMessage.value = res.message || '登录失败，请检查账号密码';
			}
		} catch (error: any) {
			errorMessage.value = error.message || '登录发生错误，请稍后重试';
		} finally {
			loading.value = false;
		}
	});
};

// ========== GitHub OAuth 登录 ==========
const handleGithubLogin = () => {
	// Spring Security 内置 OAuth2 客户端路径，直接页面跳转，不是 axios 请求
	// 后端会 302 → GitHub 授权页 → 用户同意 → 302 回后端 → 签发 JWT → 302 回前端 /oauth2/redirect?token=xxx
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
	window.location.href = `${apiBaseUrl}/oauth2/authorization/github`;
};
</script>

<style scoped lang="scss">

/* ===== 容器 ===== */
.login-container {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	padding: 24px 24px 56px;
	box-sizing: border-box;
	background: #0f172a;
	font-family: 'Inter', 'Fira Sans', system-ui, sans-serif;
	overflow: hidden;
}

/* ===== 背景光晕 ===== */
.background-shapes {
	position: absolute;
	inset: 0;
	overflow: hidden;
	z-index: 0;

	.shape {
		position: absolute;
		border-radius: 50%;
		filter: blur(72px);
		opacity: 0.38;
		animation: float 28s infinite ease-in-out;
		will-change: transform;
	}

	.shape-1 {
		width: 500px;
		height: 500px;
		background: #4f46e5;
		top: -120px;
		left: -80px;
	}

	.shape-2 {
		width: 420px;
		height: 420px;
		background: #ec4899;
		bottom: -80px;
		right: -60px;
		animation-delay: -7s;
	}

	.shape-3 {
		width: 280px;
		height: 280px;
		background: #06b6d4;
		top: 45%;
		left: 55%;
		animation-delay: -13s;
	}
}

@keyframes float {
	0%, 100% { transform: translate(0, 0) scale(1); }
	33% { transform: translate(20px, -30px) scale(1.02); }
	66% { transform: translate(-10px, 20px) scale(0.98); }
}

/* ===== 登录卡片 ===== */
.login-box {
	position: relative;
	display: flex;
	width: 920px;
	height: 560px;
	max-width: 100%;
	max-height: calc(100vh - 96px);
	background: rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(16px) saturate(1.08);
	-webkit-backdrop-filter: blur(16px) saturate(1.08);
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 24px;
	box-shadow:
		0 25px 50px -12px rgba(0, 0, 0, 0.5),
		0 0 0 1px rgba(255, 255, 255, 0.05) inset;
	overflow: hidden;
	z-index: 1;
}

.slide-in {
	animation: slideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
	from { opacity: 0; transform: translateY(24px) scale(0.98); }
	to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ===== 左侧品牌 ===== */
.login-left {
	width: 400px;
	flex-shrink: 0;
	background: linear-gradient(160deg, rgba(79, 70, 229, 0.85) 0%, rgba(124, 58, 237, 0.85) 60%, rgba(139, 92, 246, 0.75) 100%);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 48px 40px;
	color: white;
	position: relative;
	overflow: hidden;

	.left-content {
		text-align: center;
		z-index: 2;
		position: relative;
	}

	.logo-circle {
		width: 68px;
		height: 68px;
		background: rgba(255, 255, 255, 0.18);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		backdrop-filter: blur(8px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.brand-title {
		font-size: 26px;
		font-weight: 700;
		letter-spacing: 0.5px;
		margin: 0 0 6px;
	}

	.brand-desc {
		font-size: 14px;
		opacity: 0.75;
		margin: 0 0 32px;
	}

	.brand-features {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		opacity: 0.8;

		:deep(.el-icon) {
			background: rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			padding: 2px;
		}
	}

	.glass-decoration {
		position: absolute;
		width: 180%;
		height: 40px;
		background: rgba(255, 255, 255, 0.06);
		transform: rotate(-35deg);
		top: 15%;
		left: -40%;
		pointer-events: none;
	}

	.decoration-2 {
		top: auto;
		bottom: 20%;
		left: -20%;
		transform: rotate(-25deg);
		opacity: 0.6;
	}
}

/* ===== 右侧表单 ===== */
.login-right {
	flex: 1;
	display: flex;
	flex-direction: column;
	background: rgba(255, 255, 255, 0.75);
	backdrop-filter: blur(6px);
	padding: 32px 44px 24px;
	min-width: 0;
	overflow: hidden;
}

/* ===== Tab 切换 ===== */
.login-tabs {
	position: relative;
	display: flex;
	background: #f1f5f9;
	border-radius: 10px;
	padding: 3px;
	flex-shrink: 0;

	.tab-item {
		position: relative;
		z-index: 1;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 9px 0;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		transition: color 0.25s ease;
		user-select: none;

		&:hover { color: #4f46e5; }

		&.active {
			color: #4f46e5;
		}
	}

	.tab-indicator {
		position: absolute;
		top: 3px;
		left: 3px;
		width: calc(50% - 3px);
		height: calc(100% - 6px);
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;

		&.slide-right {
			transform: translateX(100%);
		}
	}
}

/* ===== 内容区 ===== */
.login-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-height: 0;
	overflow: hidden;
}

/* 模式切换过渡 */
.mode-fade-enter-active {
	transition: opacity 0.2s ease, transform 0.25s ease;
}
.mode-fade-leave-active {
	transition: opacity 0.15s ease, transform 0.2s ease;
}
.mode-fade-enter-from {
	opacity: 0;
	transform: translateY(8px);
}
.mode-fade-leave-to {
	opacity: 0;
	transform: translateY(-6px);
}

/* ===== 表单头部 ===== */
.form-header {
	margin-bottom: 24px;

	h2 {
		font-size: 22px;
		font-weight: 700;
		color: #0f172a;
		margin: 0 0 4px;
		letter-spacing: -0.3px;
	}

	p {
		color: #64748b;
		font-size: 13px;
		margin: 0;
		line-height: 1.5;
	}
}

/* ===== 账号表单 ===== */
.login-form {
	.custom-input {
		:deep(.el-input__wrapper) {
			background: #f8fafc;
			box-shadow: none;
			border: 1.5px solid #e2e8f0;
			border-radius: 10px;
			transition: all 0.2s ease;
			padding: 6px 12px;

			&.is-focus {
				background: #fff;
				border-color: #4f46e5;
				box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
			}

			&:hover:not(.is-focus) {
				border-color: #cbd5e1;
			}
		}

		:deep(.el-input__inner) {
			color: #1e293b;
			height: 36px;
			font-size: 14px;
		}

		:deep(.el-input__inner::placeholder) {
			color: #94a3b8;
		}
	}

	.el-form-item {
		margin-bottom: 16px;
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;

		.forgot-pwd {
			font-size: 13px;
			color: #4f46e5;
			transition: color 0.2s ease;
			cursor: pointer;

			&:hover { color: #4338ca; }
		}
	}

	.submit-btn {
		width: 100%;
		height: 44px;
		font-size: 15px;
		font-weight: 600;
		background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
		border: none;
		border-radius: 10px;
		transition: all 0.25s ease;
		cursor: pointer;

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 8px 24px -6px rgba(79, 70, 229, 0.45);
		}

		&:active {
			transform: translateY(0);
			box-shadow: 0 2px 8px -2px rgba(79, 70, 229, 0.4);
		}
	}
}

.login-error {
	margin-bottom: 14px;
}

/* ===== 扫码面板 ===== */
.qrcode-panel {
	display: flex;
	flex-direction: column;
	align-items: center;

	.form-header {
		text-align: center;
		margin-bottom: 20px;
	}
}

.qrcode-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;

	.qrcode-box {
		position: relative;
		width: 168px;
		height: 168px;
		border-radius: 14px;
		overflow: hidden;
		border: 2px solid #e2e8f0;
		background: #fff;
		transition: border-color 0.25s ease, box-shadow 0.25s ease;

		.qrcode-img {
			display: block;
			width: 168px;
			height: 168px;
		}

		&:hover {
			border-color: #c7d2fe;
			box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.06);
		}

		&.is-scanned {
			border-color: #4f46e5;
			box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
		}

		&.is-expired .qrcode-img {
			filter: blur(4px);
		}
	}

	.qrcode-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.94);
		border-radius: 12px;
		animation: overlayIn 0.25s ease;

		.overlay-title {
			color: #0f172a;
			font-size: 14px;
			font-weight: 600;
			margin: 0;
		}

		.overlay-sub {
			color: #64748b;
			font-size: 12px;
			margin: 0;
		}
	}

	.qrcode-tip {
		color: #64748b;
		font-size: 13px;
		margin: 0;

		strong { color: #4f46e5; font-weight: 600; }
	}
}

@keyframes overlayIn {
	from { opacity: 0; transform: scale(0.95); }
	to { opacity: 1; transform: scale(1); }
}

.qrcode-steps {
	display: flex;
	gap: 24px;
	margin-top: 20px;

	.step-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #94a3b8;

		.step-num {
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: linear-gradient(135deg, #4f46e5, #7c3aed);
			color: #fff;
			font-size: 11px;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
	}
}

/* ===== 底部 ===== */
.form-footer {
	flex-shrink: 0;
	padding-top: 16px;
	border-top: 1px solid #f1f5f9;
	margin-top: auto;
}

.social-login {
	margin-bottom: 12px;

	.divider {
		display: flex;
		align-items: center;
		margin-bottom: 14px;

		&::before,
		&::after {
			content: '';
			flex: 1;
			height: 1px;
			background: #e2e8f0;
		}

		span {
			padding: 0 12px;
			font-size: 12px;
			color: #94a3b8;
			white-space: nowrap;
		}
	}

	.social-buttons {
		display: flex;
		justify-content: center;
		gap: 16px;
	}
}

.social-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 8px 20px;
	border-radius: 8px;
	border: 1.5px solid #e2e8f0;
	background: #fff;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 13px;
	font-weight: 500;
	color: #334155;

	&:hover {
		border-color: #cbd5e1;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	&:active {
		transform: scale(0.98);
	}
}

.github-btn {
	svg {
		flex-shrink: 0;
	}

	&:hover {
		border-color: #6e7681;
		background: #f6f8fa;
	}
}

.register-link {
	text-align: center;
	font-size: 13px;
	color: #94a3b8;
	margin: 0;
}

/* ===== ICP ===== */
.icp-info {
	position: absolute;
	bottom: 20px;
	left: 0;
	right: 0;
	text-align: center;
	z-index: 1;

	a {
		color: rgba(255, 255, 255, 0.45);
		font-size: 12px;
		text-decoration: none;
		transition: color 0.25s ease;

		&:hover { color: rgba(255, 255, 255, 0.8); }
	}
}

/* ===== prefers-reduced-motion ===== */
@media (prefers-reduced-motion: reduce) {
	.background-shapes .shape { animation: none; }
	.slide-in { animation: none; }
	.mode-fade-enter-active,
	.mode-fade-leave-active { transition: none; }
}

/* ===== 移动端 ===== */
@media (max-width: 960px) {
	.login-box {
		width: 92%;
		max-width: 420px;
		height: auto;
		max-height: none;
		flex-direction: column;
	}

	.login-left {
		width: auto;
		padding: 28px 24px;
		min-height: 130px;

		.brand-features { display: none; }
		.brand-title { font-size: 20px; }
	}

	.login-right {
		padding: 24px;
	}

	.qrcode-steps {
		flex-direction: column;
		gap: 8px;
		align-items: center;
	}
}
</style>
