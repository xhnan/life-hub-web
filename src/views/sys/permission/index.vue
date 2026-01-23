<template>
  <div>
    <!-- 搜索表单 -->
    <el-card shadow="never" style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="应用编码">
          <el-select
            v-model="searchForm.appCode"
            placeholder="请选择应用"
            clearable
            style="width: 200px"
            @change="handleSearch"
          >
            <el-option
              v-for="code in appCodeList"
              :key="code"
              :label="code"
              :value="code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限编码">
          <el-input
            v-model="searchForm.permissionKey"
            placeholder="请输入权限编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="权限名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入权限名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增权限</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 权限表格 - 按应用分组展示 -->
    <el-card shadow="never">
      <el-collapse v-model="activeAppCodes" v-loading="loading">
        <el-collapse-item
          v-for="appCode in displayAppCodes"
          :key="appCode"
          :name="appCode"
        >
          <template #title>
            <div style="display: flex; align-items: center; width: 100%">
              <el-tag type="primary" size="large" style="margin-right: 12px">
                {{ appCode }}
              </el-tag>
              <span style="color: #909399; font-size: 14px">
                ({{ getPermissionCountByApp(appCode) }} 个权限)
              </span>
            </div>
          </template>

          <el-table
            :data="getPermissionsByApp(appCode)"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="权限编码" width="200">
              <template #default="{ row }">
                {{ row.permissionKey || row.permissionCode }}
              </template>
            </el-table-column>
            <el-table-column label="权限名称" width="200">
              <template #default="{ row }">
                {{ row.name || row.permissionName }}
              </template>
            </el-table-column>
            <el-table-column prop="appCode" label="应用编码" width="150" />
            <el-table-column label="关联菜单" width="150">
              <template #default="{ row }">
                <el-tag v-if="row.parentId || row.menuId" type="success" size="small">
                  {{ getMenuNameById(row.parentId || row.menuId) }}
                </el-tag>
                <span v-else style="color: #909399">未关联</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.status" type="success">启用</el-tag>
                <el-tag v-else type="danger">禁用</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="info" size="small" @click="handleView(row)">查看</el-button>
                <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>

      <!-- 如果没有数据 -->
      <el-empty v-if="!loading && displayAppCodes.length === 0" description="暂无权限数据" />

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

    <!-- 新增/编辑权限对话框 -->
    <permission-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :permission-data="dialogPermissionData"
      @success="handleDialogSuccess"
    />

    <!-- 查看权限详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="权限详情"
      width="600px"
    >
      <el-descriptions v-if="viewPermissionData" :column="2" border>
        <el-descriptions-item label="ID">{{ viewPermissionData.id }}</el-descriptions-item>
        <el-descriptions-item label="应用编码">{{ viewPermissionData.appCode }}</el-descriptions-item>
        <el-descriptions-item label="权限编码">{{ viewPermissionData.permissionKey }}</el-descriptions-item>
        <el-descriptions-item label="权限名称" :span="2">{{ viewPermissionData.name }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ viewPermissionData.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="viewPermissionData.status" type="success">启用</el-tag>
          <el-tag v-else type="danger">禁用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewPermissionData.createdAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">{{ viewPermissionData.updatedAt || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PermissionDialog from '@/views/sys/permission/components/permission-dialog.vue'
import type { PermissionRow, PermissionPageParams, PermissionFormData } from '@/api/permissionApi'
import {
  getPermissionListPageApi,
  getAppCodeListApi,
  deletePermissionApi
} from '@/api/permissionApi'
import { getMenuTreeApi, type MenuRow } from '@/api/menuApi'

const loading = ref(false)
const tableData = ref<PermissionRow[]>([])
const total = ref(0)
const appCodeList = ref<string[]>([])
const activeAppCodes = ref<string[]>([]) // 展开的应用分组
const menuList = ref<MenuRow[]>([]) // 菜单列表（用于显示菜单名称）

const pageParams = reactive<PermissionPageParams>({
  pageNum: 1,
  pageSize: 10
})

const searchForm = reactive({
  permissionKey: '', // 后端字段
  name: '', // 后端字段
  appCode: '',
  status: undefined as boolean | undefined
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const dialogPermissionData = ref<PermissionFormData | null>(null)

// 查看详情对话框
const viewDialogVisible = ref(false)
const viewPermissionData = ref<PermissionRow | null>(null)

// 后端数据转换为前端表单数据
const transformToFormData = (row: PermissionRow): PermissionFormData => {
  return {
    id: row.id,
    menuId: row.parentId,
    appCode: row.appCode,
    permissionCode: row.permissionKey,
    permissionName: row.name,
    description: row.description,
    status: row.status
  }
}

// 获取显示的应用编码列表（根据当前表格数据）
const displayAppCodes = computed(() => {
  const codes = new Set(tableData.value.map(item => item.appCode))
  return Array.from(codes).sort()
})

// 根据应用编码获取权限列表
const getPermissionsByApp = (appCode: string) => {
  return tableData.value.filter(item => item.appCode === appCode)
}

// 获取某个应用的权限数量
const getPermissionCountByApp = (appCode: string) => {
  return tableData.value.filter(item => item.appCode === appCode).length
}

// 根据菜单ID获取菜单名称
const getMenuNameById = (menuId: string | number) => {
  const findMenu = (menus: MenuRow[]): string => {
    for (const menu of menus) {
      if (menu.id === menuId) {
        return menu.menuName
      }
      if (menu.children && menu.children.length > 0) {
        const found = findMenu(menu.children)
        if (found) return found
      }
    }
    return ''
  }
  return findMenu(menuList.value) || '未知菜单'
}

// 加载菜单树
const loadMenuTree = async () => {
  try {
    const res = await getMenuTreeApi()
    menuList.value = res.data || []
  } catch (error: any) {
    console.error('获取菜单树失败:', error)
  }
}

// 加载应用编码列表
const loadAppCodeList = async () => {
  try {
    const res = await getAppCodeListApi()
    appCodeList.value = res.data || []
  } catch (error: any) {
    console.error('获取应用编码列表失败:', error)
  }
}

// 加载权限列表
const loadPermissionList = async () => {
  loading.value = true
  try {
    const params = {
      ...pageParams,
      ...searchForm
    }
    const res = await getPermissionListPageApi(params)
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
    
    // 默认展开所有分组
    if (displayAppCodes.value.length > 0 && activeAppCodes.value.length === 0) {
      activeAppCodes.value = displayAppCodes.value
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取权限列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageParams.pageNum = 1
  loadPermissionList()
}

// 重置
const handleReset = () => {
  searchForm.permissionKey = ''
  searchForm.name = ''
  searchForm.appCode = ''
  searchForm.status = undefined
  pageParams.pageNum = 1
  loadPermissionList()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增权限'
  isEdit.value = false
  dialogPermissionData.value = null
  dialogVisible.value = true
}

// 查看
const handleView = (row: PermissionRow) => {
  viewPermissionData.value = row
  viewDialogVisible.value = true
}

// 编辑
const handleEdit = (row: PermissionRow) => {
  dialogTitle.value = '编辑权限'
  isEdit.value = true
  dialogPermissionData.value = transformToFormData(row)
  dialogVisible.value = true
}

// 对话框成功回调
const handleDialogSuccess = () => {
  loadPermissionList()
  loadAppCodeList()
}

// 删除
const handleDelete = async (row: PermissionRow) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限「${row.name}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (row.id) {
      await deletePermissionApi(row.id)
      ElMessage.success('删除成功')
      await loadPermissionList()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 分页大小变化
const handleSizeChange = () => {
  pageParams.pageNum = 1
  loadPermissionList()
}

// 当前页变化
const handleCurrentChange = () => {
  loadPermissionList()
}

onMounted(() => {
  loadAppCodeList()
  loadMenuTree()
  loadPermissionList()
})
</script>

<style scoped lang="scss">
:deep(.el-collapse-item__header) {
  height: 60px;
  line-height: 60px;
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
</style>
