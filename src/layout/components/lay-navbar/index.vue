<template>
  <div class="lay-navbar">
    <el-menu
        :default-active="route.path"
        class="el-menu-vertical-demo"
        @open="handleOpen"
        @close="handleClose"
         :unique-opened="true"
    >

        <el-menu-item
        v-for="menu in menuData"
        :key="menu.id || menu.path"
        :index="menu.path"
      >
        <span>{{menu.label}}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>
<script setup lang="ts">

import {
  useNav
} from '@/layout/hooks/useNav.ts';
import { useRouter, useRoute } from 'vue-router';


const { handleOpen, handleClose,menuData } = useNav();
const router = useRouter();
const route = useRoute();

function go(path?: string) {
  if (!path) return;
  if (route.path === path) return;
  router.push(path).catch(() => {});
}

defineOptions({
  name: 'LayNavbar'
})
</script>
<style scoped>
.lay-navbar {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 16px 0;
}

.el-menu-vertical-demo {
  border-right: none;
  background: transparent;
}
/* 选中/悬停样式：更明显的背景色和主色高亮 */
.el-menu-vertical-demo .el-menu-item.is-active,
.el-menu-vertical-demo .el-submenu.is-active > .el-submenu__title {
  background-color: #6d9ed6 !important; /* 更明显的浅蓝背景 */
  color: #f5f5f5 !important; /* 主色文字 */
}

.el-menu-vertical-demo .el-menu-item:hover,
.el-menu-vertical-demo .el-submenu__title:hover {
  background-color: rgba(31,111,235,0.06);
}

/* 去掉选中项左侧的突出条（如果需要你也可以保留或自定义）*/
.el-menu-vertical-demo .el-menu-item.is-active::after {
  display: none;
}
</style>