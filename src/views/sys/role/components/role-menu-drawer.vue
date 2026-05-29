<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    size="520px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="drawer-body" v-loading="loading">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-input
          v-model="filterText"
          placeholder="搜索菜单名称"
          clearable
          :prefix-icon="Search"
          style="width: 220px"
        />
        <div class="toolbar-actions">
          <el-button size="small" @click="handleExpandAll">
            {{ isExpandAll ? '折叠' : '展开' }}
          </el-button>
          <el-button size="small" @click="handleCheckAll">
            {{ isAllChecked ? '取消全选' : '全选' }}
          </el-button>
        </div>
      </div>

      <!-- 菜单树 -->
      <div class="tree-container">
        <el-tree
          ref="treeRef"
          :data="menuTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-expand-all="isExpandAll"
          :filter-node-method="filterNode"
          :check-strictly="!linkage"
          highlight-current
          :expand-on-click-node="false"
        >
          <template #default="{ data }">
            <div class="tree-node-content">
              <span class="node-label">{{ data.menuName }}</span>
              <div class="node-tags">
                <el-tag
                  v-if="data.menuType === 1"
                  size="small"
                  type="info"
                  effect="plain"
                >目录</el-tag>
                <el-tag
                  v-else-if="data.menuType === 2"
                  size="small"
                  type="primary"
                  effect="plain"
                >菜单</el-tag>
                <el-tag
                  v-else-if="data.menuType === 3"
                  size="small"
                  type="warning"
                  effect="plain"
                >按钮</el-tag>
                <span v-if="data.menuCode" class="permission-code">{{ data.menuCode }}</span>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <div class="footer-left">
          <el-checkbox v-model="linkage">父子联动</el-checkbox>
          <span class="selected-info">
            已选 <em>{{ selectedCount }}</em> 项
          </span>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            保存
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { RoleRow } from '@/api/roleApi'
import { getRoleMenuListApi, assignRoleMenuApi } from '@/api/permissionApi'
import { getMenuListApi, type MenuRow } from '@/api/menuApi'

interface Props {
  modelValue: boolean
  roleData: RoleRow | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  roleData: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const title = ref('菜单权限分配')
const loading = ref(false)
const submitLoading = ref(false)
const filterText = ref('')
const linkage = ref(true)
const isExpandAll = ref(true)
const treeRef = ref<InstanceType<typeof ElTree>>()

const menuTree = ref<MenuRow[]>([])
const allMenuIds = ref<number[]>([])

const treeProps = {
  children: 'children',
  label: 'menuName'
}

// 选中数量
const selectedCount = computed(() => {
  const checked = treeRef.value?.getCheckedKeys(false) as number[] || []
  return checked.length
})

// 是否全选
const isAllChecked = computed(() => {
  if (allMenuIds.value.length === 0) return false
  const checked = treeRef.value?.getCheckedKeys(false) as number[] || []
  return checked.length >= allMenuIds.value.length
})

// 搜索过滤
const filterNode = (value: string, data: MenuRow) => {
  if (!value) return true
  return data.menuName.includes(value)
}

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

// 展开/折叠
const handleExpandAll = () => {
  const nodes = treeRef.value?.store?.nodesMap
  if (nodes) {
    Object.values(nodes).forEach((node: any) => {
      node.expanded = !isExpandAll.value
    })
  }
  isExpandAll.value = !isExpandAll.value
}

// 全选/取消全选
const handleCheckAll = () => {
  if (isAllChecked.value) {
    treeRef.value?.setCheckedKeys([])
  } else {
    treeRef.value?.setCheckedKeys(allMenuIds.value)
  }
}

// 将平铺菜单列表转换为树结构
const buildMenuTree = (menus: MenuRow[]): MenuRow[] => {
  const map = new Map<number | string, MenuRow>()
  const roots: MenuRow[] = []

  menus.forEach(menu => {
    map.set(menu.id, { ...menu, children: [] })
  })

  menus.forEach(menu => {
    const node = map.get(menu.id)!
    if (!menu.parentId || menu.parentId === 0) {
      roots.push(node)
    } else {
      const parent = map.get(menu.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  })

  return roots
}

// 获取叶子节点ID
const getLeafNodeIds = (tree: MenuRow[], checkedIds: Set<number>): number[] => {
  const leafIds: number[] = []
  const traverse = (nodes: MenuRow[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      } else {
        if (checkedIds.has(node.id as number)) {
          leafIds.push(node.id as number)
        }
      }
    })
  }
  traverse(tree)
  return leafIds
}

// 收集所有菜单ID
const collectAllIds = (tree: MenuRow[]): number[] => {
  const ids: number[] = []
  const traverse = (nodes: MenuRow[]) => {
    nodes.forEach(node => {
      ids.push(node.id as number)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(tree)
  return ids
}

// 加载数据
const loadData = async () => {
  if (!props.roleData) return

  loading.value = true
  try {
    const menuRes = await getMenuListApi()
    const flatMenus = menuRes.data || []
    menuTree.value = buildMenuTree(flatMenus)
    allMenuIds.value = collectAllIds(menuTree.value)

    const roleMenuRes = await getRoleMenuListApi(props.roleData.id)
    const checkedMenuIds = roleMenuRes.data || []

    await nextTick()
    if (linkage.value) {
      const checkedSet = new Set(checkedMenuIds)
      const leafIds = getLeafNodeIds(menuTree.value, checkedSet)
      treeRef.value?.setCheckedKeys(leafIds)
    } else {
      treeRef.value?.setCheckedKeys(checkedMenuIds)
    }
  } catch (error) {
    console.error('加载菜单权限数据失败', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, async (val) => {
  if (val && props.roleData) {
    title.value = `菜单权限 - ${props.roleData.roleName}`
    await loadData()
  }
})

const handleClose = () => {
  filterText.value = ''
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!props.roleData?.id) return

  submitLoading.value = true
  try {
    const checkedKeys = treeRef.value?.getCheckedKeys(false) as number[] || []
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() as number[] || []
    const menuIds = [...checkedKeys, ...halfCheckedKeys]

    await assignRoleMenuApi({
      roleId: props.roleData.id,
      menuIds
    })

    ElMessage.success('菜单权限保存成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.drawer-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
}

.tree-container {
  flex: 1;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow-y: auto;
  padding: 12px;
  background: #fafbfc;

  .tree-node-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: 12px;

    .node-label {
      font-size: 13px;
    }

    .node-tags {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .permission-code {
      font-size: 11px;
      font-family: 'SF Mono', 'Cascadia Code', monospace;
      color: #9ca3af;
    }
  }
}

.drawer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .selected-info {
      font-size: 13px;
      color: #6b7280;

      em {
        font-style: normal;
        font-weight: 600;
        color: #409eff;
      }
    }
  }

  .footer-right {
    display: flex;
    gap: 10px;
  }
}
</style>
