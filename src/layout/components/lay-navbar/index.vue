<template>
  <div class="lay-navbar">
    <el-menu :default-active="route.path" class="el-menu-vertical-demo" router @open="handleOpen" @close="handleClose"
      :unique-opened="true">

      <!-- <el-menu-item
        v-for="menu in menuData"
        :key="menu.id || menu.path"
        :index="menu.path"
      >
        <span>{{menu.label}}</span>
      </el-menu-item> -->
        <template v-for="menu in menuData" :key="menu.id || menu.path">
        <!-- 有子菜单：使用 el-sub-menu -->
        <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
          <template #title>
            <el-icon v-if="menu.icon"><Icon :icon="menu.icon" /></el-icon>
            <span>{{ menu.label }}</span>
          </template>
          <!-- 递归渲染子菜单 -->
          <menu-item v-for="child in menu.children" :key="child.id || child.path" :item="child" />
        </el-sub-menu>

        <!-- 无子菜单：使用 el-menu-item -->
        <el-menu-item v-else :index="menu.path">
          <el-icon v-if="menu.icon"><Icon :icon="menu.icon" /></el-icon>
          <span>{{ menu.label }}</span>
        </el-menu-item>
      </template>

    </el-menu>

    <div class="logout-container">
      <el-button text class="logout-btn" @click="handleLogout">
        <el-icon style="margin-right: 5px;"><Icon icon="mdi:logout" /></el-icon>
        <span>退出登录</span>
      </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">

import {
  useNav
} from '@/layout/hooks/useNav.ts';
import { useRoute } from 'vue-router';
import MenuItem from "@/layout/components/lay-navbar/MenuItem.vue";
import { Icon } from '@iconify/vue';
import { logoutApi } from '@/api/authApi';
import { clearAuthData } from '@/utils/auth';
import { ElMessage } from 'element-plus';


const { handleOpen, handleClose, menuData } = useNav();

const route = useRoute();

const handleLogout = async () => {
    try {
        await logoutApi();
    } catch (e) {
        console.error(e);
        ElMessage.error('退出登录失败，请重试');
    } finally {
        clearAuthData();
        window.location.href = '/#/login';
        window.location.reload();
    }
}


defineOptions({
  name: 'LayNavbar'
})
</script>
<style scoped lang="scss">
@use "@/styles/variables" as *;
.lay-navbar {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 16px 0;
}

.el-menu-vertical-demo {
  border-right: none;
  background: transparent;
  flex: 1;
  overflow-y: auto;
}

.logout-container {
    padding: 10px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
    width: 100%;
    color: #fff;
    justify-content: flex-start;
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
}

/* 选中/悬停样式：更明显的背景色和主色高亮 */
.el-menu-vertical-demo .el-menu-item.is-active,
.el-menu-vertical-demo .el-submenu.is-active>.el-submenu__title {
  background-color: #6d9ed6 !important;
  /* 更明显的浅蓝背景 */
  color: #f5f5f5 !important;
  /* 主色文字 */
}

.el-menu-vertical-demo .el-menu-item:hover,
.el-menu-vertical-demo .el-submenu__title:hover {
  background-color: rgba(31, 111, 235, 0.06);
}

/* 去掉选中项左侧的突出条（如果需要你也可以保留或自定义）*/
.el-menu-vertical-demo .el-menu-item.is-active::after {
  display: none;
}

/* 作用到所有内联子菜单（含多层嵌套） */
:deep(.el-menu--inline) {
  background:  $menu-background-color;
}

/* 如果还看到单个项颜色不一致，再把默认项也统一 */
:deep(.el-menu-item) {
  background: $menu-background-color;
  transition: background-color 0.15s ease;
}

/* 悬停时的统一浅色背景 */
:deep(.el-menu-item:hover),
:deep(.el-submenu__title:hover) {
  background: $menu-background-color;
}
</style>