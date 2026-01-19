<template>
  <div>
    <el-tree
      node-key="id"
      :data="treeData"
      :props="treeProps"
      :loading="loading"
      default-expand-all
      @check-change="handleCheckChange"
      @node-click="handleNodeClick"
    />

    <div v-if="error" style="margin-top: 8px; color: #f56c6c">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getMenuTreeApi, type MenuRow } from '@/api/menuApi'

const emit = defineEmits<{
  menuClick: [menu: MenuRow]
}>()

const treeData = ref<MenuRow[]>([])
const loading = ref(false)
const error = ref<string>('')

// 直接告诉 el-tree：显示 menuName 字段；子节点字段是 children
const treeProps = {
  label: 'menuName',
  children: 'children'
} as const

const handleCheckChange = (data: MenuRow, checked: boolean, indeterminate: boolean) => {
  console.log('check-change:', { data, checked, indeterminate })
}

// 处理节点点击事件，通过 emit 传递给父组件
const handleNodeClick = (data: MenuRow) => {
  console.log('节点被点击:', data)
  emit('menuClick', data)
}

const getMenuTree = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getMenuTreeApi()
    console.log('menu tree api raw response:', res.data)
    treeData.value = Array.isArray(res.data) ? res.data : []
    console.log('treeData length:', treeData.value.length)
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || '获取菜单树失败'
  } finally {
    loading.value = false
  }
}

// 暴露刷新方法给父组件
const refreshTree = async () => {
  await getMenuTree()
}

defineExpose({
  refreshTree
})

onMounted(() => {
  void getMenuTree()
})
</script>

<style scoped></style>
