<template>
  <div class="role-management">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="角色编码">
          <el-input
            v-model="searchForm.roleCode"
            placeholder="请输入角色编码"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input
            v-model="searchForm.roleName"
            placeholder="请输入角色名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon class="el-icon--left"><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon class="el-icon--left"><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">角色列表</span>
          <div class="right-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon class="el-icon--left"><Plus /></el-icon>新增角色
            </el-button>
            <el-button @click="loadRoleList" :loading="loading">
              <el-icon class="el-icon--left"><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        border
        header-cell-class-name="table-header"
        style="width: 100%"
      >
        <el-table-column prop="roleCode" label="角色编码" width="150">
          <template #default="{ row }">
            <span class="role-code-cell">{{ row.roleCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="roleName" label="角色名称" width="150">
          <template #default="{ row }">
            <div class="role-name-cell">
              <span>{{ row.roleName }}</span>
              <el-tag v-if="row.type === 1" size="small" type="warning" effect="light" style="margin-left: 6px">内置</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
        <el-table-column prop="dataScope" label="数据范围" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="dataScopeTagType(row.dataScope)" effect="plain" size="small">
              {{ dataScopeLabel(row.dataScope) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status" type="success" effect="light">启用</el-tag>
            <el-tag v-else type="danger" effect="light">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleGrant(row)">
              <el-icon class="el-icon--left"><Setting /></el-icon>菜单权限
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" :disabled="row.type === 1">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pageParams.pageNum"
          v-model:page-size="pageParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
          small
        />
      </div>
    </el-card>

    <!-- 新增/编辑角色对话框 -->
    <role-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :role-data="dialogRoleData"
      @success="handleDialogSuccess"
    />

    <!-- 菜单权限分配抽屉 -->
    <role-menu-drawer
      v-model="drawerVisible"
      :role-data="drawerRoleData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Setting } from '@element-plus/icons-vue'
import RoleDialog from '@/views/sys/role/components/role-dialog.vue'
import RoleMenuDrawer from '@/views/sys/role/components/role-menu-drawer.vue'
import { type RoleRow, type RolePageParams, getRoleListPageApi, deleteRoleApi } from '@/api/roleApi'

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

// 菜单权限抽屉相关
const drawerVisible = ref(false)
const drawerRoleData = ref<RoleRow | null>(null)

// 数据范围标签
const dataScopeLabel = (scope?: number) => {
  const map: Record<number, string> = {
    1: '全部',
    2: '指定部门',
    3: '本部门',
    4: '本部门及以下',
    5: '仅本人'
  }
  return map[scope || 1] || '全部'
}

const dataScopeTagType = (scope?: number) => {
  const map: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: '',
    4: '',
    5: 'info'
  }
  return (map[scope || 1] || '') as any
}

// 加载角色列表
const loadRoleList = async () => {
  loading.value = true
  try {
    const params = { ...pageParams, ...searchForm }
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

const handleSearch = () => {
  pageParams.pageNum = 1
  loadRoleList()
}

const handleReset = () => {
  searchForm.roleCode = ''
  searchForm.roleName = ''
  searchForm.status = undefined
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  dialogRoleData.value = null
  dialogVisible.value = true
}

const handleEdit = (row: RoleRow) => {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  dialogRoleData.value = { ...row }
  dialogVisible.value = true
}

const handleGrant = (row: RoleRow) => {
  drawerRoleData.value = { ...row }
  drawerVisible.value = true
}

const handleDelete = (row: RoleRow) => {
  ElMessageBox.confirm(
    `确定要删除角色「${row.roleName}」吗？删除后不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteRoleApi(row.id)
      ElMessage.success('删除成功')
      loadRoleList()
    } catch (error: any) {
      ElMessage.error(error?.message || '删除失败')
    }
  })
}

const handleDialogSuccess = () => {
  loadRoleList()
}

const handleSizeChange = (val: number) => {
  pageParams.pageSize = val
  pageParams.pageNum = 1
  loadRoleList()
}

const handleCurrentChange = (val: number) => {
  pageParams.pageNum = val
  loadRoleList()
}

onMounted(() => {
  loadRoleList()
})
</script>

<style scoped lang="scss">
.role-management {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .search-card {
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

    :deep(.el-card__body) {
      padding: 16px 20px 4px;
    }

    .search-form {
      :deep(.el-form-item) {
        margin-bottom: 12px;
      }
    }
  }

  .table-card {
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

    :deep(.el-card__header) {
      padding: 14px 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    :deep(.el-card__body) {
      padding: 0;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
      }

      .right-actions {
        display: flex;
        gap: 10px;
      }
    }

    .role-code-cell {
      font-family: 'SF Mono', 'Cascadia Code', monospace;
      font-size: 13px;
      color: #6366f1;
      background: #eef2ff;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .role-name-cell {
      display: flex;
      align-items: center;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      padding: 16px 20px;
      border-top: 1px solid #f0f0f0;
    }
  }

  :deep(.table-header) {
    background-color: #f8fafc !important;
    color: #475569;
    font-weight: 600;
    height: 48px;
  }
}
</style>
