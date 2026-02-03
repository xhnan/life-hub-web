<template>
	<div class="login-container">
		<div class="background-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>
		
		<div class="login-box slide-in">
			<div class="login-left">
				<div class="brand-content">
					<div class="logo-circle">
						<el-icon :size="40" color="#fff"><s-promotion /></el-icon>
					</div>
					<div class="glass-decoration"></div>
				</div>
			</div>
			
			<div class="login-right">
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
					@keyup.enter="handleLogin"
				>
					<el-form-item prop="username">
						<el-input
							v-model="loginForm.username"
							placeholder="用户名 / 邮箱"
							:prefix-icon="User"
							class="custom-input"
						/>
					</el-form-item>
					
					<el-form-item prop="password">
						<el-input
							v-model="loginForm.password"
							type="password"
							placeholder="密码"
							show-password
							:prefix-icon="Lock"
							class="custom-input"
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
				
				<div class="form-footer">
					<p>还没有账号？ <el-link type="primary" underline="never">立即注册</el-link></p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, Promotion as SPromotion } from '@element-plus/icons-vue';
import { loginApi, type LoginForm } from '@/api/authApi';
import { STORAGE_KEYS } from '@/utils/constants';

const router = useRouter();

const loginFormRef = ref<FormInstance>();
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
				const expiresAt = Date.now() + res.data.expiresIn * 1000;
				localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());

				const userInfo = {
					username: res.data.username,
					avatar: res.data.avatar
				};
				localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

				ElMessage.success('登录成功，欢迎回来！');
				router.push('/');
			} else {
				errorMessage.value = res.message || '登录失败，请检查账号密码';
			}
		} catch (error: any) {
			console.error('登录失败:', error);
			errorMessage.value = error.message || '登录发生错误，请稍后重试';
		} finally {
			loading.value = false;
		}
	});
};
</script>

<style scoped lang="scss">

.login-container {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background: #0f172a; /* Slate 900 */
	font-family: 'Fira Sans', sans-serif;
	overflow: hidden;
}

/* Dynamic Background Shapes */
.background-shapes {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow: hidden;
	z-index: 0;

	.shape {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.6;
		animation: float 20s infinite ease-in-out;
	}

	.shape-1 {
		width: 500px;
		height: 500px;
		background: #4f46e5; /* Indigo 600 */
		top: -100px;
		left: -100px;
		animation-delay: 0s;
	}

	.shape-2 {
		width: 400px;
		height: 400px;
		background: #ec4899; /* Pink 500 */
		bottom: -50px;
		right: -50px;
		animation-delay: -5s;
	}

	.shape-3 {
		width: 300px;
		height: 300px;
		background: #06b6d4; /* Cyan 500 */
		top: 40%;
		left: 60%;
		animation-delay: -10s;
	}
}

@keyframes float {
	0%, 100% { transform: translate(0, 0); }
	50% { transform: translate(30px, -50px); }
}

.login-box {
	position: relative;
	display: flex;
	width: 900px;
	height: 550px;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 24px;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	overflow: hidden;
	z-index: 1;
	transition: transform 0.3s ease;
}

.slide-in {
	animation: slideIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes slideIn {
	from { opacity: 0; transform: translateY(30px); }
	to { opacity: 1; transform: translateY(0); }
}

/* Left Side - Branding */
.login-left {
	flex: 1;
	background: linear-gradient(135deg, rgba(79, 70, 229, 0.8) 0%, rgba(124, 58, 237, 0.8) 100%);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 40px;
	color: white;
	position: relative;
	
	.brand-content {
		text-align: center;
		z-index: 2;
	}

	.logo-circle {
		width: 80px;
		height: 80px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.glass-decoration {
		position: absolute;
		width: 150%;
		height: 50px;
		background: rgba(255, 255, 255, 0.1);
		transform: rotate(-45deg);
		top: 20%;
		left: -25%;
		pointer-events: none;
	}
}

/* Right Side - Form */
.login-right {
	flex: 1;
	padding: 50px;
	background: rgba(255, 255, 255, 0.7);
	display: flex;
	flex-direction: column;
	justify-content: center;

	.form-header {
		margin-bottom: 30px;
		
		h2 {
			font-size: 28px;
			font-weight: 600;
			color: #1e293b;
			margin-bottom: 8px;
		}
		
		p {
			color: #64748b;
			font-size: 14px;
		}
	}
}

.login-form {
	.custom-input {
		:deep(.el-input__wrapper) {
			background: #f1f5f9;
			box-shadow: none;
			border: 1px solid transparent;
			border-radius: 12px;
			transition: all 0.3s ease;
			padding: 8px 15px;
			
			&.is-focus {
				background: #fff;
				border-color: #4f46e5;
				box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
			}

			&:hover:not(.is-focus) {
				background: #e2e8f0;
			}
		}
		
		:deep(.el-input__inner) {
			color: #334155;
			height: 40px;
		}
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		
		.forgot-pwd {
			font-size: 13px;
			color: #4f46e5;
			
			&:hover {
				color: #4338ca;
			}
		}
	}

	.submit-btn {
		width: 100%;
		height: 50px;
		font-size: 16px;
		font-weight: 600;
		background: linear-gradient(to right, #4f46e5, #7c3aed);
		border: none;
		border-radius: 12px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		
		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 10px 20px -10px rgba(79, 70, 229, 0.5);
		}
		
		&:active {
			transform: translateY(0);
		}
	}
}

.login-error {
	margin-bottom: 20px;
}

.form-footer {
	text-align: center;
	margin-top: 20px;
	font-size: 14px;
	color: #64748b;
}

/* Mobile Responsiveness */
@media (max-width: 960px) {
	.login-box {
		width: 90%;
		height: auto;
		flex-direction: column;
	}

	.login-left {
		padding: 30px;
		min-height: 150px;
	}

	.login-right {
		padding: 30px;
	}
}
</style>
