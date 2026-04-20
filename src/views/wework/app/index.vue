<template>
  <div>
    <!-- 搜索表单 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="应用名称">
          <el-input v-model="searchForm.appName" placeholder="请输入应用名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="AgentId">
          <el-input v-model="searchForm.agentId" placeholder="请输入AgentId" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.isEnabled" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增应用</el-button>
          <el-button type="warning" @click="handleTest" :loading="testLoading">测试连接</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 应用表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="appName" label="应用名称" width="180" />
        <el-table-column prop="agentId" label="AgentId" width="100" />
        <el-table-column prop="corpId" label="企业ID" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="corp-id">{{ row.corpId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="corpSecret" label="应用密钥" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.corpSecret" class="secret-mask">{{ maskSecret(row.corpSecret) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="token" label="回调Token" width="150" show-overflow-tooltip />
        <el-table-column prop="encodingAesKey" label="加密密钥" width="150" show-overflow-tooltip />
        <el-table-column prop="handlerBeanName" label="处理器" width="200" show-overflow-tooltip />
        <el-table-column prop="isEnabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isEnabled === 1" type="success">启用</el-tag>
            <el-tag v-else type="info">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageParams.pageNum"
        v-model:page-size="pageParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <wework-app-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :app-data="dialogAppData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import WeworkAppDialog from './components/WeworkAppDialog.vue'
import {
  type WeworkAppRow,
  type WeworkAppPageParams,
  getWeworkAppListPageApi,
  deleteWeworkAppApi,
  testWeworkAppApi
} from '@/api/weworkAppApi'

const loading = ref(false)
const testLoading = ref(false)
const tableData = ref<WeworkAppRow[]>([])
const total = ref(0)

const pageParams = reactive<WeworkAppPageParams>({
  pageNum: 1,
  pageSize: 10
})

const searchForm = reactive({
  appName: '',
  agentId: '',
  isEnabled: '' as number | string
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const dialogAppData = ref<WeworkAppRow | null>(null)

// 过滤后的表格数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    const matchName = !searchForm.appName || item.appName?.includes(searchForm.appName)
    const matchAgentId = !searchForm.agentId || item.agentId?.toString().includes(searchForm.agentId)
    const matchStatus = searchForm.isEnabled === '' || item.isEnabled === searchForm.isEnabled
    return matchName && matchAgentId && matchStatus
  })
})

const loadAppList = async () => {
  loading.value = true
  try {
    const res = await getWeworkAppListPageApi(pageParams)
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error: any) {
    ElMessage.error(error?.message || '获取应用列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.pageNum = 1
  loadAppList()
}

const handleReset = () => {
  searchForm.appName = ''
  searchForm.agentId = ''
  searchForm.isEnabled = ''
  pageParams.pageNum = 1
  loadAppList()
}

const handleAdd = () => {
  dialogTitle.value = '新增企业微信应用'
  isEdit.value = false
  dialogAppData.value = null
  dialogVisible.value = true
}

const handleEdit = (row: WeworkAppRow) => {
  dialogTitle.value = '编辑企业微信应用'
  isEdit.value = true
  dialogAppData.value = row
  dialogVisible.value = true
}

const handleDialogSuccess = () => {
  loadAppList()
}

const handleDelete = async (row: WeworkAppRow) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除企业微信应用「${row.appName}」吗？`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteWeworkAppApi(row.id!)
    ElMessage.success('删除成功')
    await loadAppList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

const handleTest = async () => {
  try {
    testLoading.value = true
    const res = await testWeworkAppApi()
    ElMessage.success('连接测试成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '连接测试失败')
  } finally {
    testLoading.value = false
  }
}

const maskSecret = (secret: string) => {
  if (!secret || secret.length <= 8) return '****'
  return secret.substring(0, 4) + '****' + secret.substring(secret.length - 4)
}

const handleSizeChange = () => {
  pageParams.pageNum = 1
  loadAppList()
}

const handleCurrentChange = () => {
  loadAppList()
}

onMounted(() => {
  loadAppList()
})
</script>

<style scoped>
.corp-id {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.secret-mask {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #909399;
}
</style>
