<template>
  <div class="error-container">
    <el-result
      icon="error"
      title="初始化失败"
      sub-title="无法加载用户权限信息，请稍后重试或重新登录"
    >
      <template #extra>
        <el-button @click="handleRetry">重试</el-button>
        <el-button type="primary" @click="handleRelogin">重新登录</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { clearAuthData } from '@/utils/auth';

const router = useRouter();

const handleRetry = () => {
  window.location.reload();
};

const handleRelogin = () => {
  clearAuthData();
  router.push('/login');
};
</script>

<style scoped>
.error-container {
  height: 100%;
  min-height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-bg-color);
}
</style>
