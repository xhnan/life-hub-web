<template>
  <div>
    <!-- 搜索表单 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="角色编码">
          <el-input v-model="searchForm.roleCode" placeholder="请输入角色编码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.roleName" placeholder="请输入角色名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增角色</el-button>
          <el-button type="success" @click="test">测试按钮</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 角色表格 -->
    <el-card shadow="never">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleCode" label="角色编码" width="150" />
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status" type="success">启用</el-tag>
            <el-tag v-else type="danger">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleGrant(row)">授权</el-button>
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

    <!-- 新增/编辑角色对话框 -->
    <role-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :role-data="dialogRoleData"
      @success="handleDialogSuccess"
    />

    <!-- 授权抽屉 -->
    <role-grant-drawer
      v-model="drawerVisible"
      :role-data="drawerRoleData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RoleDialog from '@/views/sys/role/components/role-dialog.vue'
import RoleGrantDrawer from '@/views/sys/role/components/role-grant-drawer.vue'
import {type RoleRow, type RolePageParams, testApi} from '@/api/roleApi'
import { getRoleListPageApi, deleteRoleApi } from '@/api/roleApi'

const loading = ref(false)
const tableData = ref<RoleRow[]>([])
const total = ref(0)

const pageParams = reactive<RolePageParams>({
  pageNum: 1,
  pageSize: 10
})

const searchForm = reactive({
  roleCode: '',
  roleName: '',
  status: undefined as boolean | undefined
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const dialogRoleData = ref<RoleRow | null>(null)

// 授权抽屉相关
const drawerVisible = ref(false)
const drawerRoleData = ref<RoleRow | null>(null)

// 加载角色列表
const loadRoleList = async () => {
  loading.value = true
  try {
    const params = {
      ...pageParams,
      ...searchForm
    }
    // 过滤掉空字符串、null、undefined
    const validParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    )
    const res = await getRoleListPageApi(validParams as any)
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error: any) {
    console.error('获取角色列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageParams.pageNum = 1
  loadRoleList()
}

const test=()=>{
   testApi()
}

// 重置
const handleReset = () => {
  searchForm.roleCode = ''
  searchForm.roleName = ''
  searchForm.status = undefined
  handleSearch()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  dialogRoleData.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: RoleRow) => {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  dialogRoleData.value = { ...row }
  dialogVisible.value = true
}

// 授权
const handleGrant = (row: RoleRow) => {
  drawerRoleData.value = { ...row }
  drawerVisible.value = true
}

// 删除
const handleDelete = (row: RoleRow) => {
  ElMessageBox.confirm('确认删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRoleApi(row.id)
      ElMessage.success('删除成功')
      loadRoleList()
    } catch (error: any) {
      ElMessage.error(error?.message || '删除失败')
    }
  })
}

// 对话框成功回调
const handleDialogSuccess = () => {
  loadRoleList()
}

// 分页大小改变
const handleSizeChange = (val: number) => {
  pageParams.pageSize = val
  loadRoleList()
}

// 当前页改变
const handleCurrentChange = (val: number) => {
  pageParams.pageNum = val
  loadRoleList()
}

onMounted(() => {
  loadRoleList()
})
</script>

<style scoped>
</style>
