<template>
  <div class="menu-management">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">菜单管理</span>
          <div class="right-actions">
            <el-button type="primary" @click="handleAdd(null)">
              <el-icon class="el-icon--left"><Plus /></el-icon>新增根菜单
            </el-button>
            <el-button @click="handleExpandAll">
              <el-icon class="el-icon--left"><Sort /></el-icon>{{ isExpandAll ? '折叠全部' : '展开全部' }}
            </el-button>
            <el-button @click="loadMenuTree" :loading="loading">
              <el-icon class="el-icon--left"><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="menuTableData"
        row-key="id"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        header-cell-class-name="table-header"
        border
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="180" show-overflow-tooltip />
        
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="scope">
            <el-icon v-if="scope.row.icon" size="16">
              <component :is="scope.row.icon.includes(':') ? 'span' : scope.row.icon" />
            </el-icon>
          </template>
        </el-table-column>

        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />

        <el-table-column prop="menuCode" label="权限标识" min-width="150" show-overflow-tooltip />

        <el-table-column prop="path" label="组件路径" min-width="180" show-overflow-tooltip>
             <template #default="scope">
                {{ scope.row.component || scope.row.path }}
             </template>
        </el-table-column>

        <el-table-column prop="menuType" label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.menuType === 1" type="info" effect="plain">目录</el-tag>
            <el-tag v-else-if="scope.row.menuType === 2" type="primary" effect="plain">菜单</el-tag>
            <el-tag v-else-if="scope.row.menuType === 3" type="warning" effect="plain">按钮</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status" type="success" effect="light">启用</el-tag>
            <el-tag v-else type="danger" effect="light">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleAdd(scope.row)">
              新增
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
              修改
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑菜单对话框 -->
    <menu-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :menu-data="dialogMenuData"
      :menu-tree-data="menuTableData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Sort } from '@element-plus/icons-vue'
import MenuDialog from "@/views/sys/menu/components/menu-dialog.vue"
import type { MenuRow } from '@/api/menuApi'
import { deleteMenuApi, getMenuTreeApi } from '@/api/menuApi'

const loading = ref(false)
const menuTableData = ref<MenuRow[]>([])
const isExpandAll = ref(false)
const refreshTable = ref(true)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const dialogMenuData = ref<MenuRow | null>(null)

// 加载菜单树数据
const loadMenuTree = async () => {
  loading.value = true
  try {
    const res = await getMenuTreeApi()
    menuTableData.value = res.data || []
  } catch (error) {
    console.error('加载菜单树失败:', error)
    ElMessage.error('加载菜单数据失败')
  } finally {
    loading.value = false
  }
}

// 展开/折叠全部
const handleExpandAll = () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
}

// 新增菜单
const handleAdd = (row: MenuRow | null) => {
  isEdit.value = false
  if (row) {
      dialogTitle.value = '新增子菜单'
      dialogMenuData.value = { id: row.id } as MenuRow // 只传递 ID 作为 parentId 的参考
  } else {
      dialogTitle.value = '新增根菜单'
      dialogMenuData.value = null
  }
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = (row: MenuRow) => {
  isEdit.value = true
  dialogTitle.value = '修改菜单'
  dialogMenuData.value = { ...row }
  dialogVisible.value = true
}

// 删除菜单
const handleDelete = async (row: MenuRow) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单「${row.menuName}」吗？这将同时删除其所有子菜单！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteMenuApi(row.id)
    ElMessage.success('删除成功')
    loadMenuTree()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 对话框操作成功
const handleDialogSuccess = () => {
  loadMenuTree()
}

onMounted(() => {
  loadMenuTree()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.menu-management {
  padding: 0;
  
  .box-card {
    border: none;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    
    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .right-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  :deep(.table-header) {
    background-color: #f8fafc !important;
    color: #475569;
    font-weight: 600;
    height: 50px;
  }
}
</style>
