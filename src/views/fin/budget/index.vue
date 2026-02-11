<template>
  <div class="budget-page">
    <!-- 搜索与操作栏 -->
    <el-card shadow="never" class="search-card mb-4">
      <div class="search-bar">
        <div class="filter-section">
          <div class="ledger-wrapper">
            <LedgerSelect />
          </div>
          <el-input
            v-model="searchName"
            placeholder="搜索预算..."
            clearable
            :prefix-icon="Search"
            class="search-input"
            @keyup.enter="loadData"
          />
          <el-button :icon="Refresh" circle @click="handleReset" />
        </div>
        <el-button
          type="primary"
          :icon="Plus"
          round
          :disabled="!ledgerStore.currentLedgerId"
          @click="handleAdd"
        >
          新增预算
        </el-button>
      </div>
    </el-card>

    <!-- 预算概览统计 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card total-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">预算总额</div>
              <div class="stat-value text-blue">¥ {{ formatCurrency(overviewStats.totalBudget) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card used-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">已使用</div>
              <div class="stat-value text-red">¥ {{ formatCurrency(overviewStats.totalUsed) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card remain-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">剩余可用</div>
              <div class="stat-value" :class="overviewStats.remaining >= 0 ? 'text-green' : 'text-red'">
                ¥ {{ formatCurrency(overviewStats.remaining) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预算卡片列表 -->
    <el-card shadow="never" class="content-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="title-icon"><DataAnalysis /></el-icon>
            预算列表
          </span>
          <el-tag type="info" size="small" round>共 {{ total }} 条</el-tag>
        </div>
      </template>

      <div v-loading="loading" class="budget-grid">
        <div v-if="budgetList.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无预算，点击右上角新增" />
        </div>

        <div
          v-for="item in budgetList"
          :key="item.id"
          class="budget-card"
        >
          <div class="budget-card-header">
            <div class="budget-name-row">
              <div class="budget-icon-box" :class="getStatusClass(item)">
                <el-icon><Coin /></el-icon>
              </div>
              <div class="budget-info">
                <span class="budget-name">{{ item.name }}</span>
                <span class="budget-period">{{ getPeriodLabel(item.period) }}</span>
              </div>
            </div>
            <div class="budget-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" link :icon="Edit" circle size="small" @click="handleEdit(item)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" link :icon="Delete" circle size="small" @click="handleDelete(item)" />
              </el-tooltip>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="budget-progress-section">
            <div class="progress-info">
              <span class="used-text">已用 ¥{{ formatCurrency(item.usedAmount || 0) }}</span>
              <span class="total-text">/ ¥{{ formatCurrency(item.amount || 0) }}</span>
            </div>
            <el-progress
              :percentage="getUsagePercent(item)"
              :color="getProgressColor(item)"
              :stroke-width="10"
              :show-text="false"
              class="budget-progress"
            />
            <div class="progress-footer">
              <span class="percent-text" :style="{ color: getProgressColor(item) }">
                {{ getUsagePercent(item).toFixed(1) }}%
              </span>
              <span class="remain-text">
                剩余 ¥{{ formatCurrency(Math.max((item.amount || 0) - (item.usedAmount || 0), 0)) }}
              </span>
            </div>
          </div>

          <!-- 底部信息 -->
          <div class="budget-card-footer">
            <span class="account-tag" v-if="item.accountName">
              <el-icon><Folder /></el-icon>
              {{ item.accountName }}
            </span>
            <span class="budget-remark" v-if="item.remark">{{ item.remark }}</span>
          </div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          size="small"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <BudgetDialog ref="dialogRef" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, Refresh, Search, Coin,
  ShoppingCart, Wallet, DataAnalysis, Folder
} from '@element-plus/icons-vue'
import { getBudgetPageApi, deleteBudgetApi, type BudgetRow } from '@/api/fin/budget'
import BudgetDialog from './components/BudgetDialog.vue'
import { ledgerStore } from '@/store/ledger'
import LedgerSelect from '@/components/LedgerSelect/index.vue'

const loading = ref(false)
const budgetList = ref<BudgetRow[]>([])
const searchName = ref('')
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogRef = ref<InstanceType<typeof BudgetDialog>>()

// 概览统计
const overviewStats = computed(() => {
  const totalBudget = budgetList.value.reduce((s, b) => s + (b.amount || 0), 0)
  const totalUsed = budgetList.value.reduce((s, b) => s + (b.usedAmount || 0), 0)
  return {
    totalBudget,
    totalUsed,
    remaining: totalBudget - totalUsed
  }
})

const formatCurrency = (amount: number) => {
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const getPeriodLabel = (period?: string) => {
  const map: Record<string, string> = { MONTHLY: '月度', YEARLY: '年度', CUSTOM: '自定义' }
  return map[period || ''] || period || '-'
}

const getUsagePercent = (item: BudgetRow) => {
  if (!item.amount || item.amount === 0) return 0
  return Math.min(((item.usedAmount || 0) / item.amount) * 100, 100)
}

const getProgressColor = (item: BudgetRow) => {
  const pct = getUsagePercent(item)
  if (pct >= 90) return '#EF4444'
  if (pct >= 70) return '#F59E0B'
  return '#10B981'
}

const getStatusClass = (item: BudgetRow) => {
  const pct = getUsagePercent(item)
  if (pct >= 90) return 'status-danger'
  if (pct >= 70) return 'status-warning'
  return 'status-safe'
}

const loadData = async () => {
  if (!ledgerStore.currentLedgerId) {
    budgetList.value = []
    return
  }
  loading.value = true
  try {
    const res = await getBudgetPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      bookId: ledgerStore.currentLedgerId,
      name: searchName.value || undefined
    })
    if (res.data) {
      budgetList.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchName.value = ''
  pageNum.value = 1
  loadData()
}

const handleAdd = () => {
  dialogRef.value?.open('add')
}

const handleEdit = (row: BudgetRow) => {
  dialogRef.value?.open('edit', row)
}

const handleDelete = (row: BudgetRow) => {
  ElMessageBox.confirm(
    `确定要删除预算「${row.name}」吗？`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await deleteBudgetApi(row.id!)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      // 错误已由拦截器处理
    }
  }).catch(() => {})
}

watch(() => ledgerStore.currentLedgerId, () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
$primary-color: #F59E0B;
$success-color: #10B981;
$danger-color: #EF4444;
$warning-color: #F59E0B;
$text-main: #0F172A;
$text-secondary: #64748B;
$border-color: #e2e8f0;
$shadow-glass: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

.budget-page {
  padding: 16px;
  background-color: #F8FAFC;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 搜索栏
.search-card {
  flex-shrink: 0;
  border-radius: 16px;
  border: 1px solid $border-color;
  :deep(.el-card__body) { padding: 12px 24px; }
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ledger-wrapper {
  width: 180px;
  :deep(.el-input__wrapper) {
    background-color: white;
    border: 1px solid $border-color;
    box-shadow: none !important;
    border-radius: 20px;
  }
}

.search-input {
  width: 200px;
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 0 0 1px $border-color inset;
    &:hover, &.is-focus { box-shadow: 0 0 0 1px $primary-color inset; }
  }
}

// 统计卡片
.stat-card {
  border: none;
  border-radius: 16px;
  background: white;
  box-shadow: $shadow-glass;
  transition: transform 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .stat-content {
    display: flex;
    align-items: center;
    padding: 12px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin-right: 16px;
    .el-icon { color: white; }
  }

  &.total-card .stat-icon { background: linear-gradient(135deg, #3B82F6, #60A5FA); }
  &.used-card .stat-icon { background: linear-gradient(135deg, #EF4444, #F87171); }
  &.remain-card .stat-icon { background: linear-gradient(135deg, #10B981, #34D399); }

  .stat-info {
    .stat-label { font-size: 14px; color: $text-secondary; margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 700; font-family: 'Fira Sans', sans-serif; }
  }
}

// 内容卡片
.content-card {
  flex: 1;
  border-radius: 16px;
  border: 1px solid $border-color;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
  }
  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    font-weight: 600;
    font-size: 16px;
    color: $text-main;
    display: flex;
    align-items: center;
    gap: 8px;
    .title-icon { color: $primary-color; }
  }
}

// 预算网格
.budget-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  align-content: start;
  overflow-y: auto;
  padding: 4px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

// 预算卡片
.budget-card {
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.budget-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.budget-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.budget-icon-box {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  &.status-safe { background: rgba(16, 185, 129, 0.12); color: $success-color; }
  &.status-warning { background: rgba(245, 158, 11, 0.12); color: $warning-color; }
  &.status-danger { background: rgba(239, 68, 68, 0.12); color: $danger-color; }
}

.budget-info {
  display: flex;
  flex-direction: column;
  .budget-name { font-size: 15px; font-weight: 600; color: $text-main; }
  .budget-period { font-size: 12px; color: $text-secondary; }
}

.budget-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
  .budget-card:hover & { opacity: 1; }
}

// 进度条区域
.budget-progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  .used-text { font-size: 16px; font-weight: 700; color: $text-main; font-family: 'Fira Sans', monospace; }
  .total-text { font-size: 13px; color: $text-secondary; }
}

.budget-progress {
  :deep(.el-progress-bar__outer) { border-radius: 6px; background-color: #f1f5f9; }
  :deep(.el-progress-bar__inner) { border-radius: 6px; transition: width 0.6s ease; }
}

.progress-footer {
  display: flex;
  justify-content: space-between;
  .percent-text { font-size: 13px; font-weight: 600; }
  .remain-text { font-size: 12px; color: $text-secondary; }
}

// 底部
.budget-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .account-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #3B82F6;
    background: rgba(59, 130, 246, 0.08);
    padding: 2px 10px;
    border-radius: 10px;
  }

  .budget-remark {
    font-size: 12px;
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

// 辅助类
.text-green { color: $success-color; }
.text-red { color: $danger-color; }
.text-blue { color: #3B82F6; }
.mb-4 { margin-bottom: 16px; }
</style>
