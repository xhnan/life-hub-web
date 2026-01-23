<template>
  <div>
    <!-- 搜索表单 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="searchForm.nickname" placeholder="请输入昵称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option label="正常" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="禁用" value="banned" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增用户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户表格 -->
    <el-card shadow="never">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.gender === 1" type="primary">男</el-tag>
            <el-tag v-else-if="row.gender === 2" type="danger">女</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success">正常</el-tag>
            <el-tag v-else-if="row.status === 'inactive'" type="info">停用</el-tag>
            <el-tag v-else-if="row.status === 'banned'" type="danger">禁用</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleAssignRole(row)">分配角色</el-button>
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

    <!-- 新增/编辑用户对话框 -->
    <user-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :user-data="dialogUserData"
      @success="handleDialogSuccess"
    />

    <!-- 角色分配弹窗 -->
    <user-role-dialog
      ref="userRoleDialogRef"
      @success="loadUserList"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserDialog from '@/views/sys/user/components/user-dialog.vue'
import UserRoleDialog from './components/user-role-dialog.vue'
import { type UserRow, type PageParams, getUserListPageApi, deleteUserApi, resetUserPasswordApi, updateStatusApi } from '@/api/userApi'

const loading = ref(false)
const tableData = ref<UserRow[]>([])
const total = ref(0)

const pageParams = reactive<PageParams>({
  pageNum: 1,
  pageSize: 10
})

// 搜索表单
const searchForm = reactive({
  username: '',
  nickname: '',
  status: '' as string | undefined
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const dialogUserData = ref<UserRow | null>(null)

// 角色分配对话框
const userRoleDialogRef = ref()

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  try {
    const params = {
      ...pageParams,
      ...searchForm
    }
    const res = await getUserListPageApi(params)
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error: any) {
    ElMessage.error(error?.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageParams.pageNum = 1
  loadUserList()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.nickname = ''
  searchForm.status = undefined
  pageParams.pageNum = 1
  loadUserList()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增用户'
  isEdit.value = false
  dialogUserData.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: UserRow) => {
  dialogTitle.value = '编辑用户'
  isEdit.value = true
  dialogUserData.value = row
  dialogVisible.value = true
}

// 对话框成功回调
const handleDialogSuccess = () => {
  loadUserList()
}

// 分配角色
const handleAssignRole = (row: UserRow) => {
  userRoleDialogRef.value?.openDialog(row)
}

// 删除
const handleDelete = async (row: UserRow) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${row.username}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteUserApi(row.userId)
    ElMessage.success('删除成功')
    await loadUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 分页大小变化
const handleSizeChange = () => {
  pageParams.pageNum = 1
  loadUserList()
}

// 当前页变化
const handleCurrentChange = () => {
  loadUserList()
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
</style>