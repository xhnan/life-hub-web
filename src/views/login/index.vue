<template>
	<div class="login-container">
		<div class="login-card">
			<div class="login-header">
				<h1>LifeHub</h1>
				<p>欢迎登录</p>
			</div>
			<el-form
				ref="loginFormRef"
				:model="loginForm"
				:rules="loginRules"
				class="login-form"
				@keyup.enter="handleLogin"
			>
				<el-form-item prop="username">
					<el-input
						v-model="loginForm.username"
						placeholder="请输入用户名"
						size="large"
						clearable
						:prefix-icon="User"
					/>
				</el-form-item>
				<el-form-item prop="password">
					<el-input
						v-model="loginForm.password"
						type="password"
						placeholder="请输入密码"
						size="large"
						show-password
						:prefix-icon="Lock"
					/>
				</el-form-item>
                <div class="login-options">
                    <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
                    <el-link type="primary" :underline="false">忘记密码？</el-link>
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
						size="large"
						class="login-button"
						:loading="loading"
						@click="handleLogin"
					>
						{{ loading ? '登录中...' : '登录' }}
					</el-button>
				</el-form-item>
			</el-form>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
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
		{ min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
	],
	password: [
		{ required: true, message: '请输入密码', trigger: 'blur' },
		{ min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
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
				// 存储 token 过期时间
				const expiresAt = Date.now() + res.data.expiresIn * 1000;
				localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());

				// 构造 userInfo 对象
				const userInfo = {
					username: res.data.username,
					avatar: res.data.avatar
				};
				localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

				ElMessage.success('登录成功');
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
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
	width: 400px;
	padding: 40px;
	background: #ffffff;
	border-radius: 12px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
	text-align: center;
	margin-bottom: 40px;

	h1 {
		font-size: 32px;
		font-weight: 600;
		color: #333;
		margin-bottom: 8px;
	}

	p {
		font-size: 14px;
		color: #999;
	}
}

.login-form {
	:deep(.el-form-item) {
		margin-bottom: 24px;
	}

	:deep(.el-input__wrapper) {
		padding: 12px 15px;
	}
}

.login-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.login-error {
    margin-bottom: 24px;
}

.login-button {
	width: 100%;
	height: 44px;
	font-size: 16px;
	font-weight: 500;
}
</style>
