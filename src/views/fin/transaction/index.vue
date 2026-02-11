<template>
  <div class="transaction-page">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card income-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本月收入</div>
              <div class="stat-value text-green">¥ {{ formatCurrency(monthlyStats.income) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card expense-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本月支出</div>
              <div class="stat-value text-red">¥ {{ formatCurrency(monthlyStats.expense) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card balance-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本月结余</div>
              <div class="stat-value" :class="monthlyStats.balance >= 0 ? 'text-blue' : 'text-red'">
                ¥ {{ formatCurrency(monthlyStats.balance) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索与操作栏 -->
    <el-card shadow="never" class="search-card mb-4">
      <div class="search-bar">
        <div class="filter-section">
          <div class="ledger-wrapper">
            <LedgerSelect />
          </div>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="default"
            class="date-picker"
            @change="handleDateChange"
          />
          <el-button :icon="Refresh" circle @click="handleReset" />
        </div>
        <el-button 
          type="primary" 
          :icon="Plus"
          round
          :disabled="!ledgerStore.currentLedgerId"
          @click="handleQuickTrack"
        >
          快速记账
        </el-button>
      </div>
    </el-card>

    <!-- 主内容区：左右分栏 -->
    <div class="split-container">
      <!-- 左侧：交易列表 -->
      <div class="left-pane">
        <el-card shadow="never" class="list-card">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon class="title-icon"><List /></el-icon>
                交易记录
              </span>
              <el-tag type="info" size="small" round>共 {{ total }} 条</el-tag>
            </div>
          </template>
          
          <el-table
            ref="transactionTableRef"
            :data="transactionList"
            v-loading="loadingTransactions"
            highlight-current-row
            @current-change="handleTransactionSelect"
            height="100%"
            style="width: 100%"
            class="transaction-table"
            :row-class-name="getRowClassName"
          >
            <el-table-column prop="transDate" label="日期" width="110">
              <template #default="{ row }">
                <div class="date-cell">
                  <span class="date-day">{{ formatDateDay(row.transDate) }}</span>
                  <span class="date-month">{{ formatDateMonth(row.transDate) }}</span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="description" label="描述" min-width="200">
               <template #default="{ row }">
                 <div class="desc-cell">
                   <el-icon class="desc-icon"><Tickets /></el-icon>
                   <div class="desc-content">
                     <span class="desc-text">{{ row.description || '无描述' }}</span>
                     <div class="tag-list" v-if="getTransactionTags(row).length > 0">
                       <span
                         v-for="tag in getTransactionTags(row)"
                         :key="tag.id"
                         class="trans-tag"
                         :style="getTagStyle(tag)"
                       >
                         <ReIcon v-if="tag.icon && isIconifyIcon(tag.icon)" :icon="tag.icon" class="tag-icon" />
                         <el-icon v-else-if="!tag.icon"><PriceTag /></el-icon>
                         {{ tag.tagName }}
                       </span>
                     </div>
                   </div>
                 </div>
               </template>
            </el-table-column>

            <el-table-column label="分录数" width="80" align="center">
               <template #default="{ row }">
                  <el-tag size="small" type="info" round>
                    {{ getEntryCount(row.id) }}
                  </el-tag>
               </template>
            </el-table-column>

            <el-table-column label="金额" width="120" align="right">
               <template #default="{ row }">
                  <span class="amount-text">
                    ¥ {{ formatCurrency(row.amount || 0) }}
                  </span>
               </template>
            </el-table-column>

            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <div class="operation-group">
                  <el-tooltip content="编辑" placement="top">
                    <el-button type="primary" link :icon="Edit" circle @click.stop="handleEditTransaction(row)" />
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button type="danger" link :icon="Delete" circle @click.stop="handleDeleteTransaction(row)" />
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pageNum"
              v-model:page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              size="small"
              @current-change="loadTransactions"
            />
          </div>
        </el-card>
      </div>

      <!-- 右侧：分录明细 -->
      <div class="right-pane">
        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon class="title-icon"><Document /></el-icon>
                分录明细
              </span>
              <el-button 
                type="primary" 
                size="small" 
                :icon="Plus" 
                round
                :disabled="!currentTransaction" 
                @click="handleAddEntry"
              >
                新增分录
              </el-button>
            </div>
          </template>

          <div v-if="!currentTransaction" class="empty-state">
            <el-empty description="请选择左侧交易记录查看明细">
              <template #image>
                <el-icon :size="60" color="#e2e8f0"><DocumentCopy /></el-icon>
              </template>
            </el-empty>
          </div>

          <div v-else class="entries-content">
            <!-- 交易信息卡片 -->
            <div class="transaction-info-card">
              <div class="info-row">
                <div class="info-item">
                  <el-icon class="info-icon"><Calendar /></el-icon>
                  <span class="info-label">日期</span>
                  <span class="info-value">{{ formatDate(currentTransaction.transDate) }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item full-width">
                  <el-icon class="info-icon"><ChatLineSquare /></el-icon>
                  <span class="info-label">描述</span>
                  <span class="info-value">{{ currentTransaction.description || '无描述' }}</span>
                </div>
              </div>
              <div class="info-row" v-if="getTransactionTags(currentTransaction).length > 0">
                <div class="info-item full-width">
                  <el-icon class="info-icon"><PriceTag /></el-icon>
                  <span class="info-label">标签</span>
                  <div class="info-tags">
                    <span
                      v-for="tag in getTransactionTags(currentTransaction)"
                      :key="tag.id"
                      class="trans-tag"
                      :style="getTagStyle(tag)"
                    >
                      <ReIcon v-if="tag.icon && isIconifyIcon(tag.icon)" :icon="tag.icon" class="tag-icon" />
                      <el-icon v-else-if="!tag.icon"><PriceTag /></el-icon>
                      {{ tag.tagName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分录表格 -->
            <el-table
              :data="entryList"
              v-loading="loadingEntries"
              style="width: 100%"
              class="entry-table"
            >
              <el-table-column prop="accountId" label="科目" min-width="130">
                <template #default="{ row }">
                  <span class="account-name">{{ getAccountName(row.accountId) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="direction" label="方向" width="70" align="center">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.direction === 'DEBIT' ? 'success' : 'danger'" 
                    size="small"
                    effect="light"
                    round
                  >
                    {{ row.direction === 'DEBIT' ? '借' : '贷' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="110" align="right">
                <template #default="{ row }">
                  <span :class="getAmountClass(row)" class="amount-value">
                    {{ formatSignedAmount(row) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="memo" label="备注" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="memo-text">{{ row.memo || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link :icon="Edit" size="small" @click="handleEditEntry(row)" />
                  <el-button type="danger" link :icon="Delete" size="small" @click="handleDeleteEntry(row)" />
                </template>
              </el-table-column>
            </el-table>

            <!-- 分录汇总 -->
            <div class="entry-summary" v-if="entryList.length > 0">
              <div class="summary-item">
                <span class="summary-label">借方合计</span>
                <span class="summary-value text-green">¥ {{ formatCurrency(debitTotal) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">贷方合计</span>
                <span class="summary-value text-red">¥ {{ formatCurrency(creditTotal) }}</span>
              </div>
              <div class="summary-item" :class="{ 'balance-warning': !isBalanced }">
                <span class="summary-label">差额</span>
                <span class="summary-value">¥ {{ formatCurrency(Math.abs(debitTotal - creditTotal)) }}</span>
                <el-icon v-if="isBalanced" class="balance-icon success"><CircleCheck /></el-icon>
                <el-icon v-else class="balance-icon warning"><Warning /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 弹窗组件 -->
    <TransactionDialog ref="dialogRef" @success="handleSuccess" />
    <QuickTrackerDrawer v-model="quickTrackerVisible" @success="handleSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Edit, Delete, Refresh, TrendCharts, ShoppingCart, Wallet, 
  List, Document, DocumentCopy, Calendar, ChatLineSquare, Tickets,
  CircleCheck, Warning, PriceTag
} from '@element-plus/icons-vue'
import { 
  getTransactionPageApi, 
  deleteTransactionApi,
  getMonthlyStatisticsApi,
  type TransactionRow 
} from '@/api/fin/transaction'
import { 
  getEntryPageApi, 
  deleteEntryApi, 
  type EntryRow 
} from '@/api/fin/entry'
import { getAccountListApi, type AccountRow } from '@/api/fin/account'
import { getTagListApi, type TagRow } from '@/api/fin/tag'
import { getTransTagListApi, type TransTagRow } from '@/api/fin/transTag'
import TransactionDialog from './components/TransactionDialog.vue'
import dayjs from 'dayjs'
import { ledgerStore } from '@/store/ledger'
import LedgerSelect from "@/components/LedgerSelect/index.vue"
import QuickTrackerDrawer from './components/QuickTrackerDrawer.vue'
import ReIcon from '@/components/ReIcon/index.vue'

// 状态定义
const loadingTransactions = ref(false)
const loadingEntries = ref(false)
const transactionList = ref<TransactionRow[]>([])
const entryList = ref<EntryRow[]>([])
const allEntries = ref<EntryRow[]>([])
const accountList = ref<AccountRow[]>([])
const tagList = ref<TagRow[]>([])
const transTagList = ref<TransTagRow[]>([])
const currentTransaction = ref<TransactionRow | null>(null)
const dateRange = ref<[string, string] | ''>('')
const dialogRef = ref<InstanceType<typeof TransactionDialog>>()
const quickTrackerVisible = ref(false)

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 月度统计
const monthlyStats = ref({
  income: 0,
  expense: 0,
  balance: 0
})

// 计算分录汇总
const debitTotal = computed(() => {
  return entryList.value
    .filter(e => e.direction === 'DEBIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
})

const creditTotal = computed(() => {
  return entryList.value
    .filter(e => e.direction === 'CREDIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
})

const isBalanced = computed(() => {
  return Math.abs(debitTotal.value - creditTotal.value) < 0.01
})

// 获取交易的分录数量
const getEntryCount = (transId: number) => {
  return allEntries.value.filter(e => e.transId === transId).length
}

// 获取行样式类名
const getRowClassName = ({ row }: { row: TransactionRow }) => {
  return currentTransaction.value?.id === row.id ? 'selected-row' : ''
}

// 获取账户映射
const accountMap = computed(() => {
  const map: Record<string, string> = {}
  accountList.value.forEach(acc => {
    map[String(acc.id)] = acc.name
  })
  return map
})

const getAccountName = (id: number) => {
  return accountMap.value[String(id)] || `ID:${id}`
}

// 格式化函数
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const formatDateDay = (date: string) => {
  return date ? dayjs(date).format('DD') : '-'
}

const formatDateMonth = (date: string) => {
  return date ? dayjs(date).format('MM月') : ''
}

const formatCurrency = (amount: number) => {
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const getAccountType = (accountId: number) => {
  const account = accountList.value.find(a => a.id === accountId)
  return account?.accountTypeEnum
}

// 格式化有符号金额
const formatSignedAmount = (row: EntryRow) => {
  const type = getAccountType(row.accountId)
  if (!type) return formatCurrency(row.amount)
  
  const isDebitDefault = ['ASSET', 'EXPENSE', '资产', '支出'].includes(type)
  const isDebit = row.direction === 'DEBIT'
  
  let amount = row.amount
  if (isDebitDefault) {
    if (!isDebit) amount = -amount
  } else {
    if (isDebit) amount = -amount
  }
  
  return formatCurrency(amount)
}

const getAmountClass = (row: EntryRow) => {
  const amountStr = formatSignedAmount(row)
  const amount = parseFloat(amountStr.replace(/,/g, ''))
  if (amount > 0) return 'text-green'
  if (amount < 0) return 'text-red'
  return ''
}

// 加载数据
const loadTransactions = async () => {
  if (!ledgerStore.currentLedgerId) {
    transactionList.value = []
    return
  }
  loadingTransactions.value = true
  try {
    const params: any = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      bookId: ledgerStore.currentLedgerId
    }
    
    if (dateRange.value && Array.isArray(dateRange.value)) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const res = await getTransactionPageApi(params)
    if (res.data) {
      transactionList.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
  } finally {
    loadingTransactions.value = false
  }
}

// 初始化日期范围为本月
const initDateRange = () => {
  const start = dayjs().startOf('month').format('YYYY-MM-DD')
  const end = dayjs().endOf('month').format('YYYY-MM-DD')
  dateRange.value = [start, end]
}

const loadAllEntries = async () => {
  if (!ledgerStore.currentLedgerId) {
    allEntries.value = []
    return
  }
  try {
    const res = await getEntryPageApi({ 
      pageNum: 1, 
      pageSize: 1000,
      bookId: ledgerStore.currentLedgerId
    })
    if (res.data && res.data.records) {
      allEntries.value = res.data.records
    }
  } catch (error) {
    console.error(error)
  }
}

// 加载月度统计
const loadMonthlyStats = async () => {
  if (!ledgerStore.currentLedgerId) {
    monthlyStats.value = { income: 0, expense: 0, balance: 0 }
    return
  }
  try {
    const res = await getMonthlyStatisticsApi(ledgerStore.currentLedgerId)
    if (res.data) {
      monthlyStats.value = {
        income: res.data.totalIncome || 0,
        expense: res.data.totalExpense || 0,
        balance: res.data.balance || 0
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const loadAccounts = async () => {
  if (!ledgerStore.currentLedgerId) return
  try {
    const res = await getAccountListApi(ledgerStore.currentLedgerId)
    if (res.data) {
      accountList.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

// 标签映射
const tagMap = computed(() => {
  const map: Record<string, TagRow> = {}
  tagList.value.forEach(tag => {
    if (tag.id) map[String(tag.id)] = tag
  })
  return map
})

// 交易ID -> 标签ID列表 映射
const transTagMap = computed(() => {
  const map: Record<string, number[]> = {}
  transTagList.value.forEach(tt => {
    if (tt.transId && tt.tagId) {
      const key = String(tt.transId)
      if (!map[key]) map[key] = []
      map[key].push(tt.tagId)
    }
  })
  return map
})

const getTransactionTags = (row: TransactionRow): TagRow[] => {
  const tagIds = transTagMap.value[String(row.id)]
  if (!tagIds || tagIds.length === 0) return []
  return tagIds
    .map(id => tagMap.value[String(id)])
    .filter((tag): tag is TagRow => !!tag)
}

const loadTags = async () => {
  try {
    const res = await getTagListApi()
    if (res.data) {
      tagList.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const loadTransTags = async () => {
  try {
    const res = await getTransTagListApi()
    if (res.data) {
      transTagList.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

// 标签辅助函数
const isIconifyIcon = (icon?: string) => {
  return !!icon && (icon.includes(':') || icon.includes('/'))
}

const getTagStyle = (tag: TagRow) => {
  const color = tag.color || '#64748b'
  return {
    backgroundColor: color + '18',
    color: color,
    borderColor: color + '30'
  }
}

watch(() => ledgerStore.currentLedgerId, () => {
  loadTransactions()
  loadAccounts()
  loadAllEntries()
  loadMonthlyStats()
  loadTags()
  loadTransTags()
})

// 事件处理
const handleTransactionSelect = (row: TransactionRow | undefined) => {
  currentTransaction.value = row || null
  if (row) {
    loadingEntries.value = true
    setTimeout(() => {
      entryList.value = allEntries.value.filter(entry => entry.transId === row.id)
      loadingEntries.value = false
    }, 100)
  } else {
    entryList.value = []
  }
}

const handleDateChange = () => {
  loadTransactions()
}

const handleReset = () => {
  initDateRange()
  loadTransactions()
}

const handleQuickTrack = () => {
  if (!ledgerStore.currentLedgerId) {
    ElMessage.warning('请先选择账本')
    return
  }
  quickTrackerVisible.value = true
}

const handleEditTransaction = (_row: TransactionRow) => {
  ElMessage.info('编辑功能暂未完全开放，请先使用新增')
}

const handleSuccess = () => {
  loadTransactions()
  loadAllEntries()
  loadMonthlyStats()
  loadTransTags()
}

const handleDeleteTransaction = (row: TransactionRow) => {
  if (!ledgerStore.currentLedgerId) {
    ElMessage.warning('请先选择账本')
    return
  }
  ElMessageBox.confirm('确定删除该交易记录吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteTransactionApi(row.id, ledgerStore.currentLedgerId!)
      ElMessage.success('删除成功')
      loadTransactions()
      if (currentTransaction.value?.id === row.id) {
        currentTransaction.value = null
        entryList.value = []
      }
    } catch (error) {
      console.error(error)
    }
  })
}

const handleAddEntry = () => {
  ElMessage.info('新增分录功能待实现')
}

const handleEditEntry = (row: EntryRow) => {
  ElMessage.info(`编辑分录: ${row.id}`)
}

const handleDeleteEntry = (row: EntryRow) => {
  ElMessageBox.confirm('确定删除该分录吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteEntryApi(row.id)
      ElMessage.success('删除成功')
      await loadAllEntries()
      if (currentTransaction.value) {
        handleTransactionSelect(currentTransaction.value)
      }
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(() => {
  initDateRange()
  loadTransactions()
  loadAllEntries()
  loadAccounts()
  loadMonthlyStats()
  loadTags()
  loadTransTags()
})
</script>

<style scoped lang="scss">
// 颜色变量
$primary-color: #F59E0B;
$success-color: #10B981;
$danger-color: #EF4444;
$text-main: #0F172A;
$text-secondary: #64748B;
$border-color: #e2e8f0;
$shadow-glass: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

.transaction-page {
  padding: 16px;
  background-color: #F8FAFC;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 统计卡片样式
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
    
    .el-icon {
      color: white;
    }
  }

  &.income-card .stat-icon {
    background: linear-gradient(135deg, #10B981, #34D399);
  }
  
  &.expense-card .stat-icon {
    background: linear-gradient(135deg, #EF4444, #F87171);
  }
  
  &.balance-card .stat-icon {
    background: linear-gradient(135deg, #3B82F6, #60A5FA);
  }

  .stat-info {
    .stat-label {
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      font-family: 'Fira Sans', sans-serif;
    }
  }
}

// 搜索栏样式
.search-card {
  flex-shrink: 0;
  border-radius: 16px;
  border: 1px solid $border-color;

  :deep(.el-card__body) {
    padding: 12px 24px;
  }
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
    .el-input__inner {
      color: #606266;
    }
  }
}

.date-picker {
  width: 260px;
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 0 0 1px $border-color inset;
    &:hover, &.is-focus {
      box-shadow: 0 0 0 1px $primary-color inset;
    }
  }
}

// 主内容区
.split-container {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.left-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.right-pane {
  width: 480px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.list-card, .detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid $border-color;
  
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
  }
  
  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
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
    
    .title-icon {
      color: $primary-color;
    }
  }
}

// 交易表格样式
.transaction-table {
  :deep(.el-table__row) {
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover > td {
      background-color: #f8fafc !important;
    }
    
    &.selected-row > td {
      background-color: #fef3c7 !important;
    }
  }
  
  :deep(th.el-table__cell) {
    background-color: #f8fafc !important;
    font-weight: 600;
    color: $text-secondary;
  }
  
  :deep(td.el-table__cell) {
    border-bottom: 1px solid #f1f5f9;
  }
}

.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .date-day {
    font-size: 20px;
    font-weight: 700;
    color: $text-main;
    line-height: 1.2;
  }
  
  .date-month {
    font-size: 12px;
    color: $text-secondary;
  }
}

.desc-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  
  .desc-icon {
    color: $text-secondary;
    font-size: 16px;
    margin-top: 2px;
    flex-shrink: 0;
  }
  
  .desc-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  
  .desc-text {
    color: $text-main;
    font-weight: 500;
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}

.trans-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  height: 22px;
  line-height: 22px;
  padding: 0 8px;
  border-radius: 11px;
  border: 1px solid;
  white-space: nowrap;
  
  .tag-icon {
    font-size: 12px;
  }
  
  .el-icon {
    font-size: 11px;
  }
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.amount-text {
  font-weight: 600;
  color: $text-main;
  font-family: 'Fira Sans', monospace;
}

.operation-group {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.pagination-wrapper {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

// 右侧分录明细
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entries-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.transaction-info-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 16px;
  border-radius: 12px;
  flex-shrink: 0;
  
  .info-row {
    display: flex;
    gap: 24px;
    
    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }
  
  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    &.full-width {
      flex: 1;
    }
    
    .info-icon {
      color: $primary-color;
      font-size: 16px;
    }
    
    .info-label {
      color: $text-secondary;
      font-size: 13px;
      min-width: 32px;
    }
    
    .info-value {
      color: $text-main;
      font-weight: 500;
      font-size: 14px;
    }
  }
}

.entry-table {
  flex: 1;
  min-height: 0;
  
  :deep(th.el-table__cell) {
    background-color: #f8fafc !important;
    font-weight: 600;
    color: $text-secondary;
    font-size: 13px;
  }
  
  :deep(td.el-table__cell) {
    border-bottom: 1px solid #f1f5f9;
    padding: 8px 0;
  }
  
  .account-name {
    font-weight: 500;
    color: $text-main;
  }
  
  .amount-value {
    font-weight: 600;
    font-family: 'Fira Sans', monospace;
  }
  
  .memo-text {
    color: $text-secondary;
    font-size: 13px;
  }
}

.entry-summary {
  display: flex;
  justify-content: space-around;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 10px;
  flex-shrink: 0;
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    &.balance-warning {
      .summary-value {
        color: $danger-color;
      }
    }
    
    .summary-label {
      font-size: 13px;
      color: $text-secondary;
    }
    
    .summary-value {
      font-weight: 600;
      font-family: 'Fira Sans', monospace;
    }
    
    .balance-icon {
      font-size: 16px;
      
      &.success {
        color: $success-color;
      }
      
      &.warning {
        color: $danger-color;
      }
    }
  }
}

// 辅助类
.text-green { color: $success-color; }
.text-red { color: $danger-color; }
.text-blue { color: #3B82F6; }
.mb-4 { margin-bottom: 16px; }
</style>
