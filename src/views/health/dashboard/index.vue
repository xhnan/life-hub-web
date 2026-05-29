<template>
  <div class="dashboard-page">
    <section class="page-hero">
      <div>
        <p class="page-eyebrow">Health Management</p>
        <h1>健康数据总览</h1>
        <p class="page-desc">
          监控平台健康数据核心指标，掌握用户活跃度与健康趋势，及时发现异常并采取措施。
        </p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span class="metric-label">总用户数</span>
          <strong class="metric-value">{{ overview?.totalUsers ?? '-' }}</strong>
        </div>
        <div class="metric-card metric-card--active">
          <span class="metric-label">今日活跃</span>
          <strong class="metric-value">{{ overview?.todayActiveUsers ?? '-' }}</strong>
        </div>
        <div class="metric-card metric-card--records">
          <span class="metric-label">健康记录总数</span>
          <strong class="metric-value">{{ overview?.totalHealthRecords ?? '-' }}</strong>
        </div>
        <div class="metric-card metric-card--mood">
          <span class="metric-label">平均心情分</span>
          <strong class="metric-value">{{
            overview?.avgMoodScore != null ? overview.avgMoodScore.toFixed(1) : '-'
          }}</strong>
        </div>
      </div>
    </section>

    <section class="workspace-shell">
      <div class="workspace-toolbar">
        <h2 class="section-title">数据趋势</h2>
        <el-radio-group v-model="days" @change="loadTrends">
          <el-radio-button :value="7">7天</el-radio-button>
          <el-radio-button :value="14">14天</el-radio-button>
          <el-radio-button :value="30">30天</el-radio-button>
        </el-radio-group>
      </div>

      <div class="trends-section" v-loading="trendsLoading">
        <div v-if="trends.length === 0 && !trendsLoading" class="empty-state">
          <el-empty description="暂无趋势数据" />
        </div>
        <div v-else class="trends-grid">
          <div class="trend-panel">
            <h3 class="trend-panel-title">每日活跃用户</h3>
            <div class="trend-bars">
              <div
                v-for="item in trends"
                :key="'active-' + item.date"
                class="bar-row"
              >
                <span class="bar-label">{{ formatDate(item.date) }}</span>
                <div class="bar-track">
                  <div
                    class="bar-fill bar-fill--blue"
                    :style="{ width: getBarWidth(item.activeUsers, maxActiveUsers) }"
                  />
                </div>
                <span class="bar-value">{{ item.activeUsers }}</span>
              </div>
            </div>
          </div>
          <div class="trend-panel">
            <h3 class="trend-panel-title">每日新增记录</h3>
            <div class="trend-bars">
              <div
                v-for="item in trends"
                :key="'records-' + item.date"
                class="bar-row"
              >
                <span class="bar-label">{{ formatDate(item.date) }}</span>
                <div class="bar-track">
                  <div
                    class="bar-fill bar-fill--green"
                    :style="{ width: getBarWidth(item.newRecords, maxNewRecords) }"
                  />
                </div>
                <span class="bar-value">{{ item.newRecords }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="active-users-section">
        <div class="table-header">
          <div>
            <div class="table-title">最近活跃用户</div>
            <div class="table-subtitle">展示最近活跃的前 10 名用户</div>
          </div>
        </div>
        <el-table
          :data="overview?.recentActiveUsers ?? []"
          v-loading="overviewLoading"
          stripe
          class="active-users-table"
          @row-click="handleRowClick"
        >
          <el-table-column prop="username" label="用户名" min-width="140" />
          <el-table-column prop="nickname" label="昵称" min-width="140" />
          <el-table-column prop="lastActiveTime" label="最后活跃时间" min-width="180" />
          <el-table-column prop="totalRecords" label="记录数" width="100" align="center" />
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOverviewApi, getTrendsApi } from '@/api/health/healthAdminApi'
import type { AdminOverviewVO, AdminTrendVO } from '@/api/health/types'

const router = useRouter()

const overview = ref<AdminOverviewVO | null>(null)
const overviewLoading = ref(false)
const trends = ref<AdminTrendVO[]>([])
const trendsLoading = ref(false)
const days = ref<number>(7)

const maxActiveUsers = computed(() => {
  if (trends.value.length === 0) return 1
  return Math.max(...trends.value.map(t => t.activeUsers), 1)
})

const maxNewRecords = computed(() => {
  if (trends.value.length === 0) return 1
  return Math.max(...trends.value.map(t => t.newRecords), 1)
})

function getBarWidth(value: number, max: number): string {
  if (max === 0) return '0%'
  return `${Math.round((value / max) * 100)}%`
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`
  }
  return dateStr
}

function handleRowClick(row: { userId: number }) {
  router.push(`/health/users?userId=${row.userId}`)
}

async function loadOverview() {
  overviewLoading.value = true
  try {
    const res = await getOverviewApi()
    overview.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取总览数据失败')
  } finally {
    overviewLoading.value = false
  }
}

async function loadTrends() {
  trendsLoading.value = true
  try {
    const res = await getTrendsApi(days.value)
    trends.value = res.data ?? []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取趋势数据失败')
  } finally {
    trendsLoading.value = false
  }
}

onMounted(() => {
  void loadOverview()
  void loadTrends()
})
</script>

<style scoped lang="scss">
.dashboard-page {
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100px;
  padding: 18px;
  border: 1px solid #dbe7f3;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
}

.metric-card--active {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  border-color: #bbf7d0;
}

.metric-card--records {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
  border-color: #bfdbfe;
}

.metric-card--mood {
  background: linear-gradient(180deg, #fef3c7 0%, #ffffff 100%);
  border-color: #fde68a;
}

.metric-label {
  font-size: 13px;
  color: #64748b;
}

.metric-value {
  color: #0f172a;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.workspace-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.trends-section {
  min-height: 120px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.trend-panel {
  padding: 16px 18px;
  border: 1px solid #e7edf5;
  border-radius: 16px;
  background: #ffffff;
}

.trend-panel-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.trend-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-row {
  display: grid;
  grid-template-columns: 50px 1fr 40px;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 12px;
  color: #64748b;
  text-align: right;
}

.bar-track {
  height: 16px;
  border-radius: 8px;
  background: #f1f5f9;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s ease;
  min-width: 2px;
}

.bar-fill--blue {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.bar-fill--green {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  text-align: right;
}

.active-users-section {
  padding: 18px 20px;
  border: 1px solid #e7edf5;
  border-radius: 20px;
  background: #ffffff;
}

.table-header {
  margin-bottom: 14px;
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

.active-users-table {
  width: 100%;

  :deep(.el-table__row) {
    cursor: pointer;
  }
}

@media (max-width: 1100px) {
  .page-hero {
    grid-template-columns: 1fr;
  }

  .trends-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .workspace-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
