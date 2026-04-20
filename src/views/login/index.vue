<template>
	<div class="login-container">
		<!-- 背景 -->
		<div class="aurora-bg">
			<div class="aurora aurora-1"></div>
			<div class="aurora aurora-2"></div>
			<div class="aurora aurora-3"></div>
		</div>
		<div class="noise-overlay"></div>

		<div class="login-card" :class="{ visible: cardVisible }">
			<!-- 左侧品牌 -->
			<div class="brand-panel">
				<div class="brand-glow"></div>
				<div class="brand-content">
					<div class="logo-ring">
						<div class="logo-inner">
							<Icon icon="ph:flower-lotus-bold" :width="30" />
						</div>
					</div>
					<h1 class="brand-title">LifeHub</h1>
					<p class="brand-subtitle">你的生活管理中心</p>

					<div class="feature-list">
						<div class="feature-row" v-for="f in features" :key="f.label">
							<Icon :icon="f.icon" :width="16" class="feature-icon" />
							<span>{{ f.label }}</span>
						</div>
					</div>
				</div>
				<div class="brand-line brand-line-1"></div>
				<div class="brand-line brand-line-2"></div>
			</div>

			<!-- 右侧表单 -->
			<div class="form-panel">
				<!-- Tab -->
				<div class="tab-bar" role="tablist">
					<button
						role="tab"
						class="tab-btn"
						:class="{ active: loginType === 'account' }"
						:aria-selected="loginType === 'account'"
						@click="switchLoginType('account')"
					>
						<Icon icon="lucide:user" :width="15" />
						<span>账号登录</span>
					</button>
					<button
						role="tab"
						class="tab-btn"
						:class="{ active: loginType === 'qrcode' }"
						:aria-selected="loginType === 'qrcode'"
						@click="switchLoginType('qrcode')"
					>
						<Icon icon="lucide:scan-line" :width="15" />
						<span>扫码登录</span>
					</button>
					<div class="tab-pill" :class="{ right: loginType === 'qrcode' }"></div>
				</div>

				<!-- 主体 -->
				<div class="form-body">
					<Transition name="fade-slide" mode="out-in">
						<!-- 账号登录 -->
						<div v-if="loginType === 'account'" key="account">
							<div class="section-head">
								<h2>欢迎回来</h2>
								<p>登录你的账号以继续</p>
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
										class="styled-input"
										@keyup.enter="handleUsernameEnter"
									>
										<template #prefix>
											<Icon icon="lucide:at-sign" :width="16" style="color:var(--muted)" />
										</template>
									</el-input>
								</el-form-item>

								<el-form-item prop="password">
									<el-input
										ref="passwordInputRef"
										v-model="loginForm.password"
										type="password"
										placeholder="密码"
										show-password
										class="styled-input"
										@keyup.enter="handleLogin"
									>
										<template #prefix>
											<Icon icon="lucide:lock" :width="16" style="color:var(--muted)" />
										</template>
									</el-input>
								</el-form-item>

								<div class="form-row">
									<el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
									<el-link type="primary" underline="never" class="link-accent">忘记密码？</el-link>
								</div>

								<el-alert
									v-if="errorMessage"
									:title="errorMessage"
									type="error"
									show-icon
									:closable="false"
									class="form-alert"
								/>

								<el-form-item>
									<button
										type="button"
										class="submit-btn"
										:class="{ loading }"
										:disabled="loading"
										@click="handleLogin"
									>
										<span v-if="loading" class="btn-loader"></span>
										<span>{{ loading ? '登录中...' : '立即登录' }}</span>
									</button>
								</el-form-item>
							</el-form>
						</div>

						<!-- 扫码登录 -->
						<div v-else key="qrcode" class="qr-section">
							<div class="section-head center">
								<h2>扫码登录</h2>
								<p>使用 APP 扫描二维码</p>
							</div>

							<div class="qr-frame" :class="{ scanned: qrcodeScanned, expired: qrcodeExpired }">
								<img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="二维码" class="qr-img" />
								<div v-if="qrcodeScanned && !qrcodeExpired" class="qr-mask">
									<Icon icon="lucide:check-circle-2" :width="36" style="color:#0d9488" />
									<p class="mask-title">扫描成功</p>
									<p class="mask-sub">请在手机上确认</p>
								</div>
								<div v-if="qrcodeExpired" class="qr-mask">
									<Icon icon="lucide:refresh-cw" :width="28" style="color:#64748b" />
									<p class="mask-title">已过期</p>
									<button class="refresh-btn" @click="initQrcode">点击刷新</button>
								</div>
							</div>

							<p class="qr-hint">打开 <strong>APP</strong> 扫一扫</p>

							<div class="qr-steps">
								<div class="qr-step" v-for="(s, i) in qrSteps" :key="i">
									<span class="step-dot">{{ i + 1 }}</span>
									<span>{{ s }}</span>
								</div>
							</div>
						</div>
					</Transition>
				</div>

				<!-- 底部 -->
				<div class="form-foot">
					<div class="divider-line"><span>其他登录方式</span></div>
					<div class="social-row">
						<button class="social-btn" @click="handleGithubLogin" aria-label="GitHub 登录">
							<Icon icon="mdi:github" :width="20" />
							<span>GitHub</span>
						</button>
					</div>
					<p class="foot-link">还没有账号？ <el-link type="primary" underline="never">立即注册</el-link></p>
				</div>
			</div>
		</div>

		<!-- ICP -->
		<div class="icp">
			<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">赣ICP备2026003009号-1</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Icon } from '@iconify/vue';
import { loginApi, generateQrcodeApi, getQrcodeStatusApi, type LoginForm } from '@/api/authApi';
import { STORAGE_KEYS } from '@/utils/constants';

const router = useRouter();

// ========== 常量 ==========
const features = [
	{ icon: 'lucide:wallet', label: '智能记账' },
	{ icon: 'lucide:heart-pulse', label: '健康追踪' },
	{ icon: 'lucide:layout-dashboard', label: '生活管理' }
];
const qrSteps = ['打开 APP', '扫描二维码', '确认登录'];

// ========== 状态 ==========
const cardVisible = ref(false);
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
		const QRCode = (await import('qrcode')).default;
		const res = await generateQrcodeApi();
		if (res.code === 200 && res.data) {
			qrcodeId.value = res.data.qrCodeId;
			qrcodeDataUrl.value = await QRCode.toDataURL(
				`lifehub://qrcode/login?qrCodeId=${res.data.qrCodeId}`,
				{ width: 160, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }
			);
			startPolling();
		}
	} catch {
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
					localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, (Date.now() + (res.data.expiresIn || 86400000)).toString());
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

// ========== GitHub OAuth ==========
const handleGithubLogin = () => {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
	window.location.href = `${apiBaseUrl}/oauth2/authorization/github`;
};

// ========== Lifecycle ==========
onMounted(() => requestAnimationFrame(() => { cardVisible.value = true; }));
onUnmounted(stopPolling);
</script>

<style scoped lang="scss">
/* ---------- Design Tokens ---------- */
:root {
	--bg: #05080f;
	--accent: #0d9488;
	--accent-hover: #0f766e;
	--accent-glow: rgba(13, 148, 136, 0.12);
}

/* ---------- Container ---------- */
.login-container {
	--bg-deep: #05080f;
	--accent: #0d9488;
	--accent-hover: #0f766e;
	--accent-glow: rgba(13, 148, 136, 0.12);
	--amber: #f59e0b;
	--panel-bg: #fafaf9;
	--input-bg: #f5f5f4;
	--input-border: #e7e5e4;
	--ink: #1c1917;
	--muted: #a8a29e;
	--subtle: #d6d3d1;

	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	padding: 24px 24px 56px;
	box-sizing: border-box;
	background: var(--bg-deep);
	font-family: 'Outfit', system-ui, -apple-system, sans-serif;
	overflow: hidden;
	contain: layout style;
}

/* ---------- Aurora ---------- */
.aurora-bg {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;

	.aurora {
		position: absolute;
		border-radius: 50%;
		will-change: transform;
	}

	.aurora-1 {
		width: 55vmax;
		height: 55vmax;
		top: -28%;
		left: -18%;
		background: radial-gradient(circle, rgba(13, 148, 136, 0.16) 0%, transparent 65%);
		animation: drift-a 22s ease-in-out infinite;
	}

	.aurora-2 {
		width: 45vmax;
		height: 45vmax;
		bottom: -22%;
		right: -12%;
		background: radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 65%);
		animation: drift-b 18s ease-in-out infinite;
	}

	.aurora-3 {
		width: 30vmax;
		height: 30vmax;
		top: 45%;
		left: 55%;
		background: radial-gradient(circle, rgba(245, 158, 11, 0.07) 0%, transparent 65%);
		animation: drift-c 26s ease-in-out infinite;
	}
}

.noise-overlay {
	position: absolute;
	inset: 0;
	z-index: 0;
	opacity: 0.03;
	background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	background-size: 128px 128px;
	pointer-events: none;
}

@keyframes drift-a {
	0%, 100% { transform: translate(0, 0); }
	33% { transform: translate(3vw, -2vh); }
	66% { transform: translate(-2vw, 3vh); }
}
@keyframes drift-b {
	0%, 100% { transform: translate(0, 0); }
	33% { transform: translate(-3vw, 2vh); }
	66% { transform: translate(2vw, -3vh); }
}
@keyframes drift-c {
	0%, 100% { transform: translate(0, 0) scale(1); }
	50% { transform: translate(-4vw, 2vh) scale(1.05); }
}

/* ---------- Card ---------- */
.login-card {
	position: relative;
	display: flex;
	width: 920px;
	height: 560px;
	max-width: 100%;
	max-height: calc(100vh - 96px);
	border-radius: 20px;
	overflow: hidden;
	z-index: 1;
	background: rgba(255, 255, 255, 0.035);
	border: 1px solid rgba(255, 255, 255, 0.07);
	box-shadow:
		0 0 0 1px rgba(255, 255, 255, 0.03),
		0 40px 80px -20px rgba(0, 0, 0, 0.55),
		0 0 100px -30px var(--accent-glow);
	opacity: 0;
	transform: translateY(24px) scale(0.985);
	transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
				transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);

	&.visible {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

/* ---------- Brand Panel ---------- */
.brand-panel {
	width: 380px;
	flex-shrink: 0;
	background: linear-gradient(168deg, #0c3c37 0%, #0c1222 50%, #1a1640 100%);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 48px 36px;
	color: #fff;
	position: relative;
	overflow: hidden;

	.brand-glow {
		position: absolute;
		width: 280px;
		height: 280px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
}

.brand-content {
	text-align: center;
	z-index: 2;
	position: relative;
}

.logo-ring {
	width: 64px;
	height: 64px;
	border-radius: 18px;
	border: 1px solid rgba(13, 148, 136, 0.3);
	background: rgba(13, 148, 136, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 24px;
	color: var(--accent);
	position: relative;

	.logo-inner {
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.brand-title {
	font-size: 30px;
	font-weight: 700;
	letter-spacing: -0.5px;
	margin: 0 0 6px;
	background: linear-gradient(135deg, #f1f5f9 20%, #5eead4 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.brand-subtitle {
	font-size: 12px;
	letter-spacing: 3px;
	text-transform: uppercase;
	opacity: 0.35;
	margin: 0 0 40px;
	font-weight: 300;
}

.feature-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.feature-row {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 13px;
	opacity: 0.5;
	transition: opacity 0.3s ease;

	.feature-icon {
		color: var(--accent);
		flex-shrink: 0;
	}

	&:hover { opacity: 0.85; }
}

.brand-line {
	position: absolute;
	width: 250%;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.12), transparent);
	pointer-events: none;
}
.brand-line-1 { top: 16%; left: -60%; transform: rotate(-28deg); }
.brand-line-2 { bottom: 20%; left: -30%; transform: rotate(-18deg); opacity: 0.4; }

/* ---------- Form Panel ---------- */
.form-panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	background: var(--panel-bg);
	padding: 32px 44px 20px;
	min-width: 0;
	overflow: hidden;
}

/* ---------- Tab Bar ---------- */
.tab-bar {
	position: relative;
	display: flex;
	background: #e7e5e4;
	border-radius: 10px;
	padding: 3px;
	flex-shrink: 0;
}

.tab-btn {
	position: relative;
	z-index: 1;
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 9px 0;
	border-radius: 8px;
	font-size: 13px;
	font-weight: 500;
	font-family: inherit;
	color: var(--muted);
	background: transparent;
	border: none;
	cursor: pointer;
	transition: color 0.25s ease;
	user-select: none;

	&:hover { color: var(--accent); }
	&.active { color: var(--accent); }
}

.tab-pill {
	position: absolute;
	top: 3px;
	left: 3px;
	width: calc(50% - 3px);
	height: calc(100% - 6px);
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 0;

	&.right { transform: translateX(100%); }
}

/* ---------- Form Body ---------- */
.form-body {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-height: 0;
	overflow: hidden;
}

.fade-slide-enter-active { transition: opacity 0.2s ease, transform 0.25s ease; }
.fade-slide-leave-active { transition: opacity 0.15s ease, transform 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }

/* ---------- Section Head ---------- */
.section-head {
	margin-bottom: 24px;

	h2 {
		font-size: 22px;
		font-weight: 700;
		color: var(--ink);
		margin: 0 0 4px;
		letter-spacing: -0.3px;
	}

	p {
		color: var(--muted);
		font-size: 13px;
		margin: 0;
	}

	&.center { text-align: center; }
}

/* ---------- Form ---------- */
.login-form {
	.styled-input {
		:deep(.el-input__wrapper) {
			background: var(--input-bg);
			box-shadow: none;
			border: 1.5px solid var(--input-border);
			border-radius: 10px;
			transition: all 0.2s ease;
			padding: 6px 12px;

			&.is-focus {
				background: #fff;
				border-color: var(--accent);
				box-shadow: 0 0 0 3px var(--accent-glow);
			}
			&:hover:not(.is-focus) { border-color: var(--subtle); }
		}

		:deep(.el-input__inner) {
			color: var(--ink);
			height: 36px;
			font-size: 14px;
			font-family: inherit;
		}
		:deep(.el-input__inner::placeholder) { color: var(--muted); }
	}

	.el-form-item { margin-bottom: 16px; }
}

.form-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;

	.link-accent {
		font-size: 13px;
		color: var(--accent);
		cursor: pointer;
		&:hover { color: var(--accent-hover); }
	}
}

.form-alert { margin-bottom: 14px; }

/* ---------- Submit Button ---------- */
.submit-btn {
	width: 100%;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-size: 15px;
	font-weight: 600;
	font-family: inherit;
	color: #fff;
	background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
	border: none;
	border-radius: 10px;
	cursor: pointer;
	transition: all 0.25s ease;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 10px 28px -8px rgba(13, 148, 136, 0.45);
	}
	&:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 0 4px 12px -4px rgba(13, 148, 136, 0.35);
	}
	&:disabled { opacity: 0.8; cursor: wait; }
	&.loading { pointer-events: none; }
}

.btn-loader {
	width: 16px;
	height: 16px;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-top-color: #fff;
	border-radius: 50%;
	animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- QR Section ---------- */
.qr-section {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.qr-frame {
	position: relative;
	width: 160px;
	height: 160px;
	border-radius: 16px;
	overflow: hidden;
	border: 2px solid var(--input-border);
	background: #fff;
	transition: border-color 0.25s ease, box-shadow 0.25s ease;

	.qr-img { display: block; width: 160px; height: 160px; }

	&:hover {
		border-color: rgba(13, 148, 136, 0.25);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	&.scanned {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	&.expired .qr-img { filter: blur(4px); }
}

.qr-mask {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	background: rgba(255, 255, 255, 0.94);
	border-radius: 14px;
	animation: pop-in 0.25s ease;

	.mask-title { font-size: 14px; font-weight: 600; color: var(--ink); margin: 0; }
	.mask-sub { font-size: 12px; color: var(--muted); margin: 0; }
}

.refresh-btn {
	font-size: 13px;
	font-family: inherit;
	font-weight: 500;
	color: var(--accent);
	background: none;
	border: 1px solid var(--accent);
	border-radius: 20px;
	padding: 4px 16px;
	cursor: pointer;
	transition: background 0.2s;

	&:hover { background: var(--accent-glow); }
}

@keyframes pop-in {
	from { opacity: 0; transform: scale(0.92); }
	to { opacity: 1; transform: scale(1); }
}

.qr-hint {
	color: var(--muted);
	font-size: 13px;
	margin: 12px 0 0;
	strong { color: var(--accent); font-weight: 600; }
}

.qr-steps {
	display: flex;
	gap: 20px;
	margin-top: 20px;
}

.qr-step {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: var(--muted);

	.step-dot {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: linear-gradient(135deg, #0d9488, #0f766e);
		color: #fff;
		font-size: 11px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
}

/* ---------- Footer ---------- */
.form-foot {
	flex-shrink: 0;
	padding-top: 14px;
	border-top: 1px solid var(--input-border);
	margin-top: auto;
}

.divider-line {
	display: flex;
	align-items: center;
	margin-bottom: 12px;

	&::before, &::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--input-border);
	}
	span { padding: 0 12px; font-size: 12px; color: var(--muted); white-space: nowrap; }
}

.social-row {
	display: flex;
	justify-content: center;
	gap: 12px;
	margin-bottom: 12px;
}

.social-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	padding: 8px 20px;
	border-radius: 8px;
	border: 1.5px solid var(--input-border);
	background: #fff;
	font-size: 13px;
	font-weight: 500;
	font-family: inherit;
	color: #44403c;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--subtle);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}
	&:active { transform: scale(0.98); }
}

.foot-link {
	text-align: center;
	font-size: 13px;
	color: var(--muted);
	margin: 0;
}

/* ---------- ICP ---------- */
.icp {
	position: absolute;
	bottom: 20px;
	left: 0;
	right: 0;
	text-align: center;
	z-index: 1;

	a {
		color: rgba(255, 255, 255, 0.25);
		font-size: 12px;
		text-decoration: none;
		transition: color 0.25s;

		&:hover { color: rgba(255, 255, 255, 0.55); }
	}
}

/* ---------- Reduced Motion ---------- */
@media (prefers-reduced-motion: reduce) {
	.aurora-bg .aurora { animation: none; }
	.login-card { transition: none; opacity: 1; transform: none; }
	.fade-slide-enter-active, .fade-slide-leave-active { transition: none; }
}

/* ---------- Mobile ---------- */
@media (max-width: 960px) {
	.login-card {
		width: 92%;
		max-width: 420px;
		height: auto;
		max-height: none;
		flex-direction: column;
	}

	.brand-panel {
		width: auto;
		padding: 28px 24px;
		min-height: 120px;

		.feature-list { display: none; }
		.brand-title { font-size: 22px; }
		.brand-subtitle { margin-bottom: 0; }
	}

	.form-panel { padding: 24px; }
	.qr-steps { flex-direction: column; gap: 8px; align-items: center; }
}
</style>
