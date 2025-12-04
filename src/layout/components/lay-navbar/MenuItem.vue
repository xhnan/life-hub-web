<template>
  <!-- 有子菜单：递归使用 el-sub-menu -->
  <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
    <template #title>
      <el-icon v-if="item.icon"><Icon :icon="item.icon" /></el-icon>
      <span>{{ item.label }}</span>
    </template>
    <!-- 递归自身 -->
    <menu-item v-for="child in item.children" :key="child.id || child.path" :item="child" />
  </el-sub-menu>

  <!-- 无子菜单：使用 el-menu-item -->
  <el-menu-item v-else :index="item.path">
    <el-icon v-if="item.icon"><Icon :icon="item.icon" /></el-icon>
    <span>{{ item.label }}</span>
  </el-menu-item>
</template>

<script setup lang="ts">
import type { MenuItem as MenuItemType } from '@/layout/hooks/useNav';
import { Icon } from '@iconify/vue';

defineProps<{
  item: MenuItemType
}>();

defineOptions({
  name: 'MenuItem'
})
</script>