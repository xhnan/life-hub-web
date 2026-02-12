<template>
  <div>
    <!-- 搜索表单 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="应用名称">
          <el-input v-model="searchForm.appName" placeholder="请输入应用名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="应用编码">
          <el-input v-model="searchForm.appCode" placeholder="请输入应用编码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增应用</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 应用表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="appName" label="应用名称" width="160" />
        <el-table-column prop="appCode" label="应用编码" width="160" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status" type="success">启用</el-tag>
            <el-tag v-else type="info">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
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
    <app-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :app-data="dialogAppData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppDialog from './components/AppDialog.vue'
import { type AppRow, type AppPageParams, getAppListPageApi, deleteAppApi } from '@/api/appApi'

const loading = ref(false)
const tableData = ref<AppRow[]>([])
const total = ref(0)

const pageParams = reactive<AppPageParams>({
  pageNum: 1,
  pageSize: 10
})

const searchForm = reactive({
  appName: '',
  appCode: '',
  status: '' as string | boolean
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const dialogAppData = ref<AppRow | null>(null)

const loadAppList = async () => {
  loading.value = true
  try {
    const res = await getAppListPageApi({ ...pageParams, ...searchForm })
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
  searchForm.appCode = ''
  searchForm.status = ''
  pageParams.pageNum = 1
  loadAppList()
}

const handleAdd = () => {
  dialogTitle.value = '新增应用'
  isEdit.value = false
  dialogAppData.value = null
  dialogVisible.value = true
}

const handleEdit = (row: AppRow) => {
  dialogTitle.value = '编辑应用'
  isEdit.value = true
  dialogAppData.value = row
  dialogVisible.value = true
}

const handleDialogSuccess = () => {
  loadAppList()
}

const handleDelete = async (row: AppRow) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应用「${row.appName}」吗？`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteAppApi(row.id)
    ElMessage.success('删除成功')
    await loadAppList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
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
