<template>
  <div class="psychology-page">
    <section class="page-hero">
      <div>
        <p class="page-eyebrow">Psychology Monitor</p>
        <h1>心理健康监控</h1>
        <p class="page-desc">
          实时监控用户心理评估风险预警，关注中度及以上严重程度的评估结果，保障用户心理健康。
        </p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span class="metric-label">总评估数</span>
          <strong class="metric-value">{{ alerts.length }}</strong>
        </div>
        <div class="metric-card metric-card--success">
          <span class="metric-label">正常</span>
          <strong class="metric-value">{{ severityCounts.normal }}</strong>
        </div>
        <div class="metric-card metric-card--warning">
          <span class="metric-label">轻度</span>
          <strong class="metric-value">{{ severityCounts.mild }}</strong>
        </div>
        <div class="metric-card metric-card--moderate">
          <span class="metric-label">中度</span>
          <strong class="metric-value">{{ severityCounts.moderate }}</strong>
        </div>
        <div class="metric-card metric-card--danger">
          <span class="metric-label">重度</span>
          <strong class="metric-value">{{ severityCounts.severe }}</strong>
        </div>
      </div>
    </section>

    <section class="workspace-shell">
      <div class="workspace-toolbar">
        <div>
          <div class="table-title">风险预警列表</div>
          <div class="table-subtitle">每 5 分钟自动刷新</div>
        </div>
        <el-button :icon="Refresh" @click="loadAlerts" :loading="loading">刷新</el-button>
      </div>

      <el-table
        :data="alerts"
        v-loading="loading"
        stripe
        class="alerts-table"
        @row-click="handleRowClick"
        empty-text="当前无高风险预警"
      >
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="scaleName" label="量表" min-width="160" />
        <el-table-column prop="totalScore" label="评分" width="80" align="center" />
        <el-table-column label="严重程度" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getSeverityTagType(row.severityLevel)"
              :style="getSeverityStyle(row.severityLevel)"
              size="small"
            >
              {{ getSeverityLabel(row.severityLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assessmentDate" label="评估日期" min-width="160" />
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getPsychologyAlertsApi } from '@/api/health/healthAdminApi'
import type { PsychologyAlertVO } from '@/api/health/types'

const router = useRouter()

const alerts = ref<PsychologyAlertVO[]>([])
const loading = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const severityCounts = computed(() => {
  const counts = { normal: 0, mild: 0, moderate: 0, severe: 0 }
  for (const alert of alerts.value) {
    const level = alert.severityLevel as keyof typeof counts
    if (level in counts) {
      counts[level]++
    }
  }
  return counts
})

function getSeverityTagType(level: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  switch (level) {
    case 'normal':
      return 'success'
    case 'mild':
      return 'warning'
    case 'moderate':
      return ''
    case 'severe':
      return 'danger'
    default:
      return 'info'
  }
}

function getSeverityStyle(level: string): Record<string, string> {
  if (level === 'moderate') {
    return {
      backgroundColor: '#fff7ed',
      color: '#ea580c',
      borderColor: '#fdba74'
    }
  }
  return {}
}

function getSeverityLabel(level: string): string {
  const labels: Record<string, string> = {
    normal: '正常',
    mild: '轻度',
    moderate: '中度',
    severe: '重度'
  }
  return labels[level] ?? level
}

function handleRowClick(row: PsychologyAlertVO) {
  router.push(`/health/users?userId=${row.userId}`)
}

async function loadAlerts() {
  loading.value = true
  try {
    const res = await getPsychologyAlertsApi()
    alerts.value = res.data ?? []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取心理预警数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAlerts()
  refreshTimer = setInterval(loadAlerts, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped lang="scss">
.psychology-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(400px, 1fr);
  gap: 24px;
  padding: 24px 26px;
  border: 1px solid #e6ecf5;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 32%),
    linear-gradient(145deg, #f7fbff 0%, #eef6ff 46%, #ffffff 100%);
}

.page-eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0369a1;
}

.page-hero h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  color: #0f172a;
}

.page-desc {
  max-width: 720px;
  margin: 12px 0 0;
  color: #475569;
  line-height: 1.7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 90px;
  padding: 16px;
  border: 1px solid #dbe7f3;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
}

.metric-card--success {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  border-color: #bbf7d0;
}

.metric-card--warning {
  background: linear-gradient(180deg, #fefce8 0%, #ffffff 100%);
  border-color: #fde68a;
}

.metric-card--moderate {
  background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
  border-color: #fdba74;
}

.metric-card--danger {
  background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);
  border-color: #fecaca;
}

.metric-label {
  font-size: 13px;
  color: #64748b;
}

.metric-value {
  color: #0f172a;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.workspace-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
  padding: 20px;
  border: 1px solid #e6ecf5;
  border-radius: 24px;
  background: #fbfdff;
}

.workspace-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.table-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.table-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.alerts-table {
  width: 100%;

  :deep(.el-table__row) {
    cursor: pointer;
  }
}

@media (max-width: 1100px) {
  .page-hero {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
