<template>
  <div class="health-users-page">
    <!-- Left panel: user list -->
    <div class="user-list-panel">
      <div class="panel-header">
        <h3>用户列表</h3>
        <el-input
          v-model="keyword"
          placeholder="搜索用户"
          clearable
          @input="handleSearch"
          prefix-icon="Search"
        />
      </div>
      <el-table
        :data="userList"
        v-loading="listLoading"
        stripe
        height="calc(100% - 120px)"
        @row-click="selectUser"
        highlight-current-row
      >
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="totalRecords" label="记录数" width="80" align="center" />
      </el-table>
      <el-pagination
        small
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        v-model:current-page="pageNum"
        @current-change="loadUsers"
        style="margin-top: 12px; justify-content: center"
      />
    </div>

    <!-- Right panel: user detail -->
    <div class="user-detail-panel" v-if="selectedUser">
      <div class="detail-header">
        <h3>{{ selectedUser.username }} {{ selectedUser.nickname ? `(${selectedUser.nickname})` : '' }}</h3>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="概览" name="overview">
          <div class="overview-cards">
            <div class="overview-card">
              <span class="overview-label">最新体重</span>
              <strong class="overview-value">{{ selectedUser.latestWeight ?? '-' }} kg</strong>
            </div>
            <div class="overview-card">
              <span class="overview-label">最新心情分</span>
              <strong class="overview-value">{{ selectedUser.latestMoodScore ?? '-' }}</strong>
            </div>
            <div class="overview-card">
              <span class="overview-label">总记录数</span>
              <strong class="overview-value">{{ selectedUser.totalRecords }}</strong>
            </div>
            <div class="overview-card">
              <span class="overview-label">最后活跃</span>
              <strong class="overview-value">{{ selectedUser.lastActiveDate ?? '-' }}</strong>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="运动记录" name="activities">
          <el-table :data="userDetail?.activities ?? []" stripe empty-text="暂无运动记录">
            <el-table-column prop="activityType" label="类型" width="120" />
            <el-table-column prop="durationMinutes" label="时长(分钟)" width="100" align="center" />
            <el-table-column prop="caloriesBurned" label="消耗热量(kcal)" width="130" align="center" />
            <el-table-column prop="steps" label="步数" width="100" align="center" />
            <el-table-column prop="activityDate" label="日期" min-width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="饮食记录" name="diet">
          <el-table :data="userDetail?.dietLogs ?? []" stripe empty-text="暂无饮食记录">
            <el-table-column prop="mealType" label="餐类" width="100" />
            <el-table-column prop="foodName" label="食物" min-width="140" />
            <el-table-column prop="calories" label="热量(kcal)" width="110" align="center" />
            <el-table-column prop="protein" label="蛋白质(g)" width="100" align="center" />
            <el-table-column prop="logDate" label="日期" min-width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="体重记录" name="weight">
          <el-table :data="userDetail?.weightLogs ?? []" stripe empty-text="暂无体重记录">
            <el-table-column prop="weight" label="体重(kg)" width="120" align="center" />
            <el-table-column prop="bodyFatRate" label="体脂率(%)" width="120" align="center" />
            <el-table-column prop="bmi" label="BMI" width="100" align="center" />
            <el-table-column prop="recordDate" label="日期" min-width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="健康目标" name="goals">
          <el-table :data="userDetail?.goals ?? []" stripe empty-text="暂无健康目标">
            <el-table-column prop="goalType" label="目标类型" width="120" />
            <el-table-column prop="targetValue" label="目标值" width="100" align="center" />
            <el-table-column prop="currentValue" label="当前值" width="100" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center" />
            <el-table-column prop="deadline" label="截止日期" min-width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="心理评估" name="psychology">
          <el-table :data="userDetail?.assessments ?? []" stripe empty-text="暂无心理评估">
            <el-table-column prop="scaleName" label="量表" min-width="140" />
            <el-table-column prop="totalScore" label="总分" width="80" align="center" />
            <el-table-column prop="severityLevel" label="严重程度" width="100" align="center" />
            <el-table-column prop="assessmentDate" label="日期" min-width="120" />
          </el-table>
          <el-divider content-position="left">每日心情</el-divider>
          <el-table :data="userDetail?.dailyMoods ?? []" stripe empty-text="暂无心情记录">
            <el-table-column prop="moodScore" label="心情分" width="80" align="center" />
            <el-table-column prop="moodTags" label="标签" min-width="140" />
            <el-table-column prop="notes" label="备注" min-width="180" />
            <el-table-column prop="recordDate" label="日期" width="120" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="user-detail-panel empty-panel" v-else>
      <el-empty description="请从左侧选择用户查看详情" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserListApi, getUserDetailApi } from '@/api/health/healthAdminApi'
import type { AdminUserSummaryVO, AdminUserDetailVO } from '@/api/health/types'

const route = useRoute()

const keyword = ref('')
const userList = ref<AdminUserSummaryVO[]>([])
const listLoading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const selectedUser = ref<AdminUserSummaryVO | null>(null)
const userDetail = ref<AdminUserDetailVO | null>(null)
const activeTab = ref('overview')

let searchTimer: ReturnType<typeof setTimeout> | null = null

function handleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pageNum.value = 1
    loadUsers()
  }, 300)
}

async function loadUsers() {
  listLoading.value = true
  try {
    const res = await getUserListApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    userList.value = res.data?.records ?? []
    total.value = res.data?.total ?? 0
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户列表失败')
  } finally {
    listLoading.value = false
  }
}

async function selectUser(row: AdminUserSummaryVO) {
  selectedUser.value = row
  activeTab.value = 'overview'
  try {
    const res = await getUserDetailApi(row.userId)
    userDetail.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户详情失败')
    userDetail.value = null
  }
}

async function selectUserById(userId: number) {
  try {
    const res = await getUserDetailApi(userId)
    userDetail.value = res.data
    if (res.data) {
      selectedUser.value = {
        userId: res.data.userId,
        username: res.data.username,
        nickname: res.data.nickname,
        latestWeight: null,
        latestMoodScore: null,
        lastActiveDate: null,
        totalRecords: 0
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户详情失败')
  }
}

onMounted(() => {
  loadUsers()
  // Support navigation from other pages with ?userId=xxx
  const userId = route.query.userId
  if (userId) {
    selectUserById(Number(userId))
  }
})
</script>

<style scoped lang="scss">
.health-users-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.user-list-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  min-width: 320px;
  padding: 20px;
  border: 1px solid #e6ecf5;
  border-radius: 20px;
  background: #fbfdff;
}

.panel-header {
  margin-bottom: 14px;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }
}

.user-detail-panel {
  flex: 1;
  min-width: 0;
  padding: 20px;
  border: 1px solid #e6ecf5;
  border-radius: 20px;
  background: #fbfdff;
  overflow: auto;
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.overview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid #e7edf5;
  border-radius: 14px;
  background: #ffffff;
}

.overview-label {
  font-size: 13px;
  color: #64748b;
}

.overview-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
</style>
