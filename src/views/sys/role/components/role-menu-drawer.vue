<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    size="500px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="drawer-content" v-loading="loading">
      <!-- 菜单树 -->
      <div class="tree-container">
        <el-input
          v-model="filterText"
          placeholder="搜索菜单"
          clearable
          style="margin-bottom: 12px"
        />
        <el-tree
          ref="treeRef"
          :data="menuTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-expand-all="true"
          :filter-node-method="filterNode"
          :check-strictly="checkStrictly"
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span>{{ data.menuName }}</span>
              <el-tag
                v-if="data.menuType === 1"
                size="small"
                type="warning"
                style="margin-left: 8px"
              >目录</el-tag>
              <el-tag
                v-else-if="data.menuType === 2"
                size="small"
                type="success"
                style="margin-left: 8px"
              >菜单</el-tag>
              <el-tag
                v-else-if="data.menuType === 3"
                size="small"
                type="info"
                style="margin-left: 8px"
              >按钮</el-tag>
            </span>
          </template>
        </el-tree>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-checkbox v-model="checkStrictly" label="父子联动" style="margin-right: auto" />
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
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
const checkStrictly = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()

const menuTree = ref<MenuRow[]>([])

const treeProps = {
  children: 'children',
  label: 'menuName'
}

// 搜索过滤
const filterNode = (value: string, data: MenuRow) => {
  if (!value) return true
  return data.menuName.includes(value)
}

// 监听搜索框
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

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
        // 如果找不到父节点，当作根节点
        roots.push(node)
      }
    }
  })

  return roots
}

// 获取所有叶子节点ID（用于回显，因为 el-tree 的 setCheckedKeys 在非 check-strictly 模式需要只设置叶子节点）
const getLeafNodeIds = (tree: MenuRow[], checkedIds: Set<number>): number[] => {
  const leafIds: number[] = []
  const traverse = (nodes: MenuRow[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      } else {
        // 叶子节点
        if (checkedIds.has(node.id as number)) {
          leafIds.push(node.id as number)
        }
      }
    })
  }
  traverse(tree)
  return leafIds
}

// 加载菜单树和角色已有菜单
const loadData = async () => {
  if (!props.roleData) return

  loading.value = true
  try {
    // 加载全量菜单列表
    const menuRes = await getMenuListApi()
    const flatMenus = menuRes.data || []
    menuTree.value = buildMenuTree(flatMenus)

    // 加载角色已分配的菜单ID
    const roleMenuRes = await getRoleMenuListApi(props.roleData.id)
    const checkedMenuIds = roleMenuRes.data || []

    // 等待树渲染完成后设置选中
    await nextTick()
    if (!checkStrictly.value) {
      // 非严格模式，只设置叶子节点（父节点会自动选中）
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

// 监听打开
watch(() => props.modelValue, async (val) => {
  if (val && props.roleData) {
    title.value = `菜单权限分配 - ${props.roleData.roleName}`
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
    // 获取选中的菜单ID（包括半选的父节点）
    const checkedKeys = treeRef.value?.getCheckedKeys(false) as number[] || []
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() as number[] || []
    const allMenuIds = [...checkedKeys, ...halfCheckedKeys]

    await assignRoleMenuApi({
      roleId: props.roleData.id,
      menuIds: allMenuIds
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

<style scoped>
.drawer-content {
  padding: 0 20px;
}
.tree-container {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  height: calc(100vh - 220px);
  overflow-y: auto;
  padding: 12px;
}
.tree-node {
  display: flex;
  align-items: center;
}
.drawer-footer {
  display: flex;
  align-items: center;
  padding: 20px;
}
</style>
