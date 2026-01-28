<template>
  <div class="lay-navbar">
    <!-- Logo Area -->
    <div class="logo-container">
      <div class="logo-icon">
        <el-icon :size="24" color="#fff"><Promotion /></el-icon>
      </div>
      <span class="logo-text">LifeHub</span>
    </div>

    <!-- Menu Area -->
    <el-menu
      :default-active="route.path"
      class="el-menu-vertical-custom"
      router
      @open="handleOpen"
      @close="handleClose"
      :unique-opened="true"
      :collapse-transition="false"
      background-color="transparent"
      text-color="#94a3b8"
      active-text-color="#ffffff"
    >
      <template v-for="menu in menuData" :key="menu.id || menu.path">
        <!-- Sub Menu -->
        <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
          <template #title>
            <el-icon v-if="menu.icon" class="menu-icon"><Icon :icon="menu.icon" /></el-icon>
            <span class="menu-label">{{ menu.label }}</span>
          </template>
          <menu-item v-for="child in menu.children" :key="child.id || child.path" :item="child" />
        </el-sub-menu>

        <!-- Leaf Menu Item -->
        <el-menu-item v-else :index="menu.path">
          <el-icon v-if="menu.icon" class="menu-icon"><Icon :icon="menu.icon" /></el-icon>
          <template #title>
            <span class="menu-label">{{ menu.label }}</span>
          </template>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- User/Footer Area -->
    <div class="navbar-footer">
      <div class="user-profile" v-if="userInfo">
        <el-avatar :size="32" :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
        <div class="user-info">
          <span class="username">{{ userInfo.username || 'User' }}</span>
          <span class="role-badge">Admin</span>
        </div>
      </div>
      
      <div class="action-buttons">
        <el-tooltip content="退出登录" placement="top">
          <el-button text circle class="icon-btn" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNav } from '@/layout/hooks/useNav.ts';
import { useRoute } from 'vue-router';
import MenuItem from "@/layout/components/lay-navbar/MenuItem.vue";
import { Icon } from '@iconify/vue';
import { logoutApi } from '@/api/authApi';
import { clearAuthData } from '@/utils/auth';
import { ElMessage } from 'element-plus';
import { Promotion, SwitchButton } from '@element-plus/icons-vue';
import { ref, onMounted } from 'vue';
import { STORAGE_KEYS } from '@/utils/constants';

const { handleOpen, handleClose, menuData } = useNav();
const route = useRoute();
const userInfo = ref<any>(null);

onMounted(() => {
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  if (storedUser) {
    try {
      userInfo.value = JSON.parse(storedUser);
    } catch (e) {
      console.error('Failed to parse user info', e);
    }
  }
});

const handleLogout = async () => {
  try {
    await logoutApi();
  } catch (e) {
    console.error(e);
  } finally {
    clearAuthData();
    ElMessage.success('已安全退出');
    window.location.href = '/#/login';
    window.location.reload();
  }
}

defineOptions({
  name: 'LayNavbar'
})
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600&display=swap');

.lay-navbar {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #0f172a; /* Slate 900 */
  font-family: 'Fira Sans', sans-serif;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 10;
}

/* Logo Section */
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 10px;

  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #4f46e5, #ec4899);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }

  .logo-text {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
    background: linear-gradient(to right, #fff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* Menu Section */
.el-menu-vertical-custom {
  flex: 1;
  border-right: none !important;
  padding: 0 12px;
  overflow-y: auto;
  overflow-x: hidden;

  /* Scrollbar Styling */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  :deep(.el-sub-menu__title),
  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    border-radius: 8px;
    margin-bottom: 4px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
      color: #fff !important;
    }
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(90deg, rgba(79, 70, 229, 0.15), rgba(79, 70, 229, 0.05)) !important;
    color: #818cf8 !important; /* Indigo 400 */
    font-weight: 600;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      height: 20px;
      width: 3px;
      background: #818cf8;
      border-radius: 0 2px 2px 0;
    }
  }

  .menu-icon {
    font-size: 18px;
    margin-right: 10px;
    vertical-align: middle;
  }

  .menu-label {
    vertical-align: middle;
  }
}

/* Footer Section */
.navbar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;

  .user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;

    .user-info {
      display: flex;
      flex-direction: column;
      
      .username {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 80px;
      }
      
      .role-badge {
        font-size: 10px;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.05);
        padding: 1px 6px;
        border-radius: 4px;
        align-self: flex-start;
      }
    }
  }

  .action-buttons {
    .icon-btn {
      color: #94a3b8;
      font-size: 18px;
      padding: 8px;
      
      &:hover {
        color: #ef4444; /* Red 500 */
        background: rgba(239, 68, 68, 0.1);
      }
    }
  }
}
</style>
