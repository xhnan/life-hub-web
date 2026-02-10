<template>
  <div class="transaction-page">
    <div class="split-container">
      <!-- 左侧：交易主表 -->
      <div class="left-pane">
        <el-card shadow="never" class="list-card">
          <template #header>
            <div class="card-header">
              <span class="title">交易记录</span>
              <!-- 列表操作：快速记账按钮放这里，或者放下面搜索栏 -->
            </div>
          </template>
          
          <!-- 搜索栏 -->
          <div class="search-bar mb-4 flex items-center justify-between">
             <div class="flex items-center">
                <div class="ledger-wrapper mr-2">
                  <LedgerSelect />
                </div>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  size="default"
                  style="width: 240px"
                  @change="handleDateChange"
                />
             </div>
             
             <el-button 
                type="primary" 
                :icon="Plus"
                :disabled="!ledgerStore.currentLedgerId"
                @click="handleQuickTrack"
              >
                快速记账
              </el-button>
          </div>
          
          <el-table
            ref="transactionTableRef"
            :data="transactionList"
            v-loading="loadingTransactions"
            highlight-current-row
            @current-change="handleTransactionSelect"
            height="calc(100% - 50px)"
            style="width: 100%"
            class="transaction-table"
          >
            <el-table-column prop="transDate" label="日期" width="100">
              <template #default="{ row }">
                {{ formatDate(row.transDate) }}
              </template>
            </el-table-column>
            
            <el-table-column prop="description" label="描述" min-width="200">
               <template #default="{ row }">
                 <div class="desc-cell">
                   <span class="desc-text">{{ row.description }}</span>
                 </div>
               </template>
            </el-table-column>

            <el-table-column label="金额" width="120" align="right">
               <template #default="{ row }">
                  <!-- 暂时无法直接获取金额，因为 TransactionRow 里没有总金额字段，通常需要后端计算或者前端遍历 entries -->
                  <!-- 这里先留空，或者显示 '查看明细' -->
                  <el-tag size="small" type="info" class="cursor-pointer">查看明细</el-tag>
               </template>
            </el-table-column>

            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" link :icon="Edit" circle @click.stop="handleEditTransaction(row)" />
                <el-button type="danger" link :icon="Delete" circle @click.stop="handleDeleteTransaction(row)" />
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
              <span class="title">分录明细</span>
              <el-button 
                type="success" 
                size="default" 
                :icon="Plus" 
                :disabled="!currentTransaction" 
                @click="handleAddEntry"
              >
                新增分录
              </el-button>
            </div>
          </template>

          <div v-if="!currentTransaction" class="empty-state">
            <el-empty description="请选择左侧交易记录查看明细" />
          </div>

          <div v-else class="entries-content">
            <div class="transaction-info mb-4">
              <div class="info-item">
                <span class="label">交易日期：</span>
                <span class="value">{{ formatDate(currentTransaction.transDate) }}</span>
              </div>
              <div class="info-item">
                <span class="label">描述：</span>
                <span class="value">{{ currentTransaction.description }}</span>
              </div>
            </div>

            <el-table
              :data="entryList"
              v-loading="loadingEntries"
              border
              style="width: 100%"
            >
              <el-table-column prop="accountId" label="科目" min-width="150">
                <template #default="{ row }">
                  {{ getAccountName(row.accountId) }}
                </template>
              </el-table-column>
              <el-table-column prop="direction" label="方向" width="80" align="center" v-if="false">
                <template #default="{ row }">
                  <el-tag :type="row.direction === 'DEBIT' ? 'success' : 'danger'" size="small">
                    {{ row.direction === 'DEBIT' ? '借' : '贷' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="{ row }">
                  <span :class="getAmountClass(row)">
                    {{ formatSignedAmount(row) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="memo" label="备注" min-width="120" show-overflow-tooltip />
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link :icon="Edit" circle @click="handleEditEntry(row)" />
                  <el-button type="danger" link :icon="Delete" circle @click="handleDeleteEntry(row)" />
                </template>
              </el-table-column>
            </el-table>
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { 
  getTransactionPageApi, 
  deleteTransactionApi, 
  type TransactionRow 
} from '@/api/fin/transaction'
import { 
  getEntryPageApi, 
  deleteEntryApi, 
  type EntryRow 
} from '@/api/fin/entry'
import { getAccountListApi, type AccountRow } from '@/api/fin/account'
import TransactionDialog from './components/TransactionDialog.vue'
import dayjs from 'dayjs'
import { ledgerStore } from '@/store/ledger'
import LedgerSelect from "@/components/LedgerSelect/index.vue";
import QuickTrackerDrawer from './components/QuickTrackerDrawer.vue'

// 状态定义
const loadingTransactions = ref(false)
const loadingEntries = ref(false)
const transactionList = ref<TransactionRow[]>([])
const entryList = ref<EntryRow[]>([]) // 当前选中的交易的分录列表
const allEntries = ref<EntryRow[]>([]) // 所有分录（暂时全部加载，后期优化为按ID查询）
const accountList = ref<AccountRow[]>([])
const currentTransaction = ref<TransactionRow | null>(null)
const dateRange = ref<[string, string] | ''>('')
const dialogRef = ref<InstanceType<typeof TransactionDialog>>()
const quickTrackerVisible = ref(false)

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)


// 获取账户映射
const accountMap = computed(() => {
  const map: Record<number, string> = {}
  accountList.value.forEach(acc => {
    map[acc.id] = acc.name
  })
  return map
})

const getAccountName = (id: number) => {
  return accountMap.value[id] || `ID:${id}`
}

// 格式化函数
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
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
  
  const isDebitDefault = ['ASSET', 'EXPENSE'].includes(type)
  const isDebit = row.direction === 'DEBIT'
  
  // 逻辑：
  // 资产/支出：借方为正，贷方为负
  // 负债/权益/收入：贷方为正，借方为负
  
  let amount = row.amount
  if (isDebitDefault) {
    // 默认借方
    if (!isDebit) amount = -amount
  } else {
    // 默认贷方
    if (isDebit) amount = -amount
  }
  
  return formatCurrency(amount)
}

const getAmountClass = (row: EntryRow) => {
  const amountStr = formatSignedAmount(row)
  const amount = parseFloat(amountStr.replace(/,/g, ''))
  if (amount > 0) return 'text-green-600 font-medium'
  if (amount < 0) return 'text-red-600 font-medium'
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
    
    // 如果选择了日期范围，添加到查询参数
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

// 加载所有分录（临时方案，应该有根据 transId 查询的接口）
// 实际上 getEntryListApi 返回的是所有分录，我们在前端过滤
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

watch(() => ledgerStore.currentLedgerId, () => {
  loadTransactions()
  loadAccounts()
  loadAllEntries()
})

// 事件处理
const handleTransactionSelect = (row: TransactionRow | undefined) => {
  currentTransaction.value = row || null
  if (row) {
    // 过滤当前交易的分录
    loadingEntries.value = true
    // 模拟网络延迟
    setTimeout(() => {
      entryList.value = allEntries.value.filter(entry => entry.transId === row.id)
      loadingEntries.value = false
    }, 100)
  } else {
    entryList.value = []
  }
}

const handleDateChange = () => {
  // TODO: 实现日期筛选
  loadTransactions()
}

const handleAddTransaction = () => {
  if (!ledgerStore.currentLedgerId) {
    ElMessage.warning('请先选择账本')
    return
  }
  dialogRef.value?.open('add')
}

const handleQuickTrack = () => {
  if (!ledgerStore.currentLedgerId) {
    ElMessage.warning('请先选择账本')
    return
  }
  quickTrackerVisible.value = true
}

const handleEditTransaction = (row: TransactionRow) => {
  // 目前仅支持新增，因为后端未提供聚合查询接口，无法回显分录
  ElMessage.info('编辑功能暂未完全开放，请先使用新增')
  // dialogRef.value?.open('edit', row)
}

const handleViewDetail = (row: TransactionRow) => {
  ElMessage.info('明细查看暂未开放，请通过右侧“查看明细”进入分录页')
}

const handleSuccess = () => {
  loadTransactions()
  loadAllEntries() // 刷新分录列表
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
      // 重新加载分录数据
      await loadAllEntries()
      // 刷新当前显示
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
})
</script>

<style scoped lang="scss">
.transaction-page {
  padding: 16px;
  background-color: #F8FAFC;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
}

.split-container {
  display: flex;
  gap: 16px;
  height: 100%;
}

.left-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.right-pane {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.list-card, .detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  
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
    color: #1e293b;
  }
}

.transaction-table {
  :deep(.el-table__row) {
    cursor: pointer;
  }
}

.pagination-wrapper {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  justify-content: center;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transaction-info {
  background-color: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 24px;
  
  .info-item {
    .label {
      color: #64748b;
      font-size: 14px;
    }
    .value {
      color: #0f172a;
      font-weight: 500;
    }
  }
}

.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.flex { display: flex; }
.items-center { align-items: center; }
.ml-2 { margin-left: 8px; }
.mr-2 { margin-right: 8px; }

.ledger-wrapper {
  width: 160px;
  :deep(.el-input__wrapper) {
    background-color: white;
    border: 1px solid #dcdfe6;
    box-shadow: none !important;
    .el-input__inner {
      color: #606266;
    }
  }
}
</style>
