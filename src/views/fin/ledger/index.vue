<template>
  <div class="ledger-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card mb-4">
      <div class="search-bar">
        <div class="action-buttons">
          <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增账本</el-button>
        </div>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%; height: 100%"
      >
        <el-table-column prop="name" label="账本名称" min-width="150" />
        <el-table-column prop="defaultCurrency" label="币种" width="100" align="center" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <LedgerDialog ref="dialogRef" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { 
  getLedgerPageApi, 
  deleteLedgerApi, 
  type LedgerRow 
} from '@/api/fin/ledger'
import LedgerDialog from './components/LedgerDialog.vue'

const loading = ref(false)
const tableData = ref<LedgerRow[]>([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogRef = ref<InstanceType<typeof LedgerDialog>>()

const searchForm = reactive({})

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await getLedgerPageApi(params)
    if (res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  pageNum.value = 1
  loadData()
}

const handleAdd = () => {
  dialogRef.value?.open('add')
}

const handleEdit = (row: LedgerRow) => {
  dialogRef.value?.open('edit', row)
}

const handleDelete = (row: LedgerRow) => {
  ElMessageBox.confirm(
    `确定要删除账本「${row.name}」吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteLedgerApi(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadData()
}

const handleCurrentChange = (val: number) => {
  pageNum.value = val
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.ledger-page {
  padding: 16px;
  background-color: #F8FAFC;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
}

.search-card {
  flex-shrink: 0;
  :deep(.el-card__body) {
    padding: 18px 20px;
  }
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 0;
  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 16px;
  }
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
  }
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.mb-4 { margin-bottom: 16px; }
</style>
