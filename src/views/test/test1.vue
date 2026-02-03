<template>
  <div class="test-container p-4">
    <el-card header="gRPC Health Check Test">
      <div class="mb-4">
        <el-button type="primary" @click="handleCheck" :loading="loading">
          Check Health
        </el-button>
      </div>
      
      <div v-if="result" class="result-box">
        <el-descriptions title="Health Status" border>
          <el-descriptions-item label="Status">
            <el-tag :type="result.status === 'SERVING' ? 'success' : 'danger'">
              {{ result.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Version">{{ result.version }}</el-descriptions-item>
          <el-descriptions-item label="Timestamp">{{ result.timestamp }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="mt-4">
          <h4>Raw Response:</h4>
          <pre class="bg-gray-100 p-2 rounded">{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getHealthCheckApi, type HealthStatus } from '@/api/testGrpcApi';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const result = ref<HealthStatus | null>(null);

const handleCheck = async () => {
  loading.value = true;
  try {
    const res = await getHealthCheckApi();
    result.value = res.data;
    ElMessage.success('Health check successful');
  } catch (error) {
    console.error(error);
    // Error is handled by http interceptor, but we can clear result or show specific msg
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.test-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
