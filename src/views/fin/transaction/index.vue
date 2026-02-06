<template>
  <div class="transaction-page">
    <div class="split-container">
      <!-- 左侧：交易主表 -->
      <div class="left-pane">
        <el-card shadow="never" class="list-card">
          <template #header>
            <div class="card-header">
              <span class="title">交易记录</span>
              <el-button type="primary" size="small" :icon="Plus" circle @click="handleAddTransaction" />
            </div>
          </template>
          
          <div class="search-bar mb-2">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              style="width: 100%"
              @change="handleDateChange"
            />
          </div>

          <el-table
            ref="transactionTableRef"
            :data="transactionList"
            v-loading="loadingTransactions"
            highlight-current-row
            @current-change="handleTransactionSelect"
            height="calc(100% - 80px)"
            style="width: 100%"
            class="transaction-table"
          >
            <el-table-column prop="transDate" label="日期" width="100">
              <template #default="{ row }">
                {{ formatDate(row.transDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="80" align="center">
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
              small
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
                size="small" 
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
              <el-table-column prop="direction" label="方向" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.direction === 'DEBIT' ? 'success' : 'danger'" size="small">
                    {{ row.direction === 'DEBIT' ? '借' : '贷' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="{ row }">
                  {{ formatCurrency(row.amount) }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { 
  getTransactionPageApi, 
  deleteTransactionApi, 
  type TransactionRow 
} from '@/api/fin/transaction'
import { 
  getEntryListApi, 
  deleteEntryApi, 
  type EntryRow 
} from '@/api/fin/entry'
import { getAccountListApi, type AccountRow } from '@/api/fin/account'
import dayjs from 'dayjs'

// 状态定义
const loadingTransactions = ref(false)
const loadingEntries = ref(false)
const transactionList = ref<TransactionRow[]>([])
const entryList = ref<EntryRow[]>([]) // 当前选中的交易的分录列表
const allEntries = ref<EntryRow[]>([]) // 所有分录（暂时全部加载，后期优化为按ID查询）
const accountList = ref<AccountRow[]>([])
const currentTransaction = ref<TransactionRow | null>(null)
const dateRange = ref('')

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
  return dayjs(date).format('YYYY-MM-DD')
}

const formatCurrency = (amount: number) => {
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

// 加载数据
const loadTransactions = async () => {
  loadingTransactions.value = true
  try {
    const res = await getTransactionPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
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

// 加载所有分录（临时方案，应该有根据 transId 查询的接口）
// 实际上 getEntryListApi 返回的是所有分录，我们在前端过滤
const loadAllEntries = async () => {
  try {
    const res = await getEntryListApi()
    if (res.data) {
      allEntries.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const loadAccounts = async () => {
  try {
    const res = await getAccountListApi()
    if (res.data) {
      accountList.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

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
  ElMessage.info('新增交易功能待实现')
}

const handleEditTransaction = (row: TransactionRow) => {
  ElMessage.info(`编辑交易: ${row.id}`)
}

const handleDeleteTransaction = (row: TransactionRow) => {
  ElMessageBox.confirm('确定删除该交易记录吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteTransactionApi(row.id)
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
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.right-pane {
  flex: 1;
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
</style>
