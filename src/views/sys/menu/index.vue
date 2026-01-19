<template>
  <div>
    <el-row :gutter="20" >
      <el-col :span="8">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>菜单树</span>
              <el-button type="primary" size="small" @click="handleAdd(null)">新增根菜单</el-button>
            </div>
          </template>
          <menu-tree ref="menuTreeRef" @menu-click="handleMenuClick"/>
        </el-card>
      </el-col>
      <el-col  :span="16">
        <!-- 显示菜单详细信息 -->
        <el-card v-if="selectedMenu" v-loading="detailLoading">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>菜单详细信息</span>
              <div>
                <el-button type="primary" size="small" @click="handleAdd(selectedMenu.id)">新增子菜单</el-button>
                <el-button type="warning" size="small" @click="handleEdit">修改</el-button>
                <el-button type="danger" size="small" @click="handleDelete">删除</el-button>
                <el-button text @click="selectedMenu = null">关闭</el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="菜单ID">{{ selectedMenu.id }}</el-descriptions-item>
            <el-descriptions-item label="菜单名称">{{ selectedMenu.menuName }}</el-descriptions-item>
            <el-descriptions-item label="父级ID">{{ selectedMenu.parentId || '无' }}</el-descriptions-item>
            <el-descriptions-item label="权限标识">{{ selectedMenu.menuCode || '无' }}</el-descriptions-item>
            <el-descriptions-item label="路径">{{ selectedMenu.path }}</el-descriptions-item>
            <el-descriptions-item label="组件">{{ selectedMenu.component || '无' }}</el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag v-if="selectedMenu.menuType === 1" type="info">目录</el-tag>
              <el-tag v-else-if="selectedMenu.menuType === 2" type="primary">菜单</el-tag>
              <el-tag v-else-if="selectedMenu.menuType === 3" type="warning">按钮</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="图标">{{ selectedMenu.icon || '无' }}</el-descriptions-item>
            <el-descriptions-item label="排序号">{{ selectedMenu.sortOrder || 0 }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag v-if="selectedMenu.status" type="success">启用</el-tag>
              <el-tag v-else type="danger">禁用</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="可见性">
              <el-tag v-if="selectedMenu.visible" type="success">可见</el-tag>
              <el-tag v-else type="info">隐藏</el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedMenu.remark" label="备注">{{ selectedMenu.remark }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-empty v-else description="请点击左侧菜单树节点查看详情" />
      </el-col>
    </el-row>

    <!-- 新增/编辑菜单对话框 -->
    <menu-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :menu-data="dialogMenuData"
      :menu-tree-data="menuTreeData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MenuTree from "@/views/sys/menu/components/menu-tree.vue"
import MenuDialog from "@/views/sys/menu/components/menu-dialog.vue"
import type { MenuRow } from '@/api/menuApi'
import { deleteMenuApi, getMenuTreeApi, getMenuDetailApi } from '@/api/menuApi'

const menuTreeRef = ref<InstanceType<typeof MenuTree>>()
const selectedMenu = ref<MenuRow | null>(null)
const detailLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const dialogMenuData = ref<MenuRow | null>(null)
const menuTreeData = ref<MenuRow[]>([])

const handleMenuClick = async (menu: MenuRow) => {
  // 根据 ID 从后端获取完整的菜单数据
  detailLoading.value = true
  try {
    const res = await getMenuDetailApi(menu.id)
    selectedMenu.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '获取菜单详情失败')
    selectedMenu.value = null
  } finally {
    detailLoading.value = false
  }
}

// 加载菜单树数据（用于父级选择）
const loadMenuTree = async () => {
  try {
    const res = await getMenuTreeApi()
    menuTreeData.value = res.data || []
  } catch (error) {
    console.error('加载菜单树失败:', error)
  }
}

// 新增菜单
const handleAdd = (parentId: string | number | null) => {
  isEdit.value = false
  dialogTitle.value = parentId ? '新增子菜单' : '新增根菜单'
  // 如果有 parentId，传递父菜单信息用于设置默认父级
  if (parentId && selectedMenu.value) {
    dialogMenuData.value = { ...selectedMenu.value }
  } else {
    dialogMenuData.value = null
  }
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = () => {
  if (!selectedMenu.value) return
  isEdit.value = true
  dialogTitle.value = '修改菜单'
  dialogMenuData.value = { ...selectedMenu.value }
  dialogVisible.value = true
}

// 删除菜单
const handleDelete = async () => {
  if (!selectedMenu.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单「${selectedMenu.value.menuName}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteMenuApi(selectedMenu.value.id)
    ElMessage.success('删除成功')
    selectedMenu.value = null
    // 刷新菜单树
    await menuTreeRef.value?.refreshTree()
    await loadMenuTree()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 对话框操作成功
const handleDialogSuccess = async (data: MenuRow) => {
  // 如果是编辑模式，更新选中的菜单数据
  if (isEdit.value && selectedMenu.value) {
    selectedMenu.value = data
  } else {
    selectedMenu.value = null
  }
  await menuTreeRef.value?.refreshTree()
  await loadMenuTree()
}

onMounted(() => {
  loadMenuTree()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;
</style>
