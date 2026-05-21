<template>
  <div class="permission-management">
    <!-- 顶部信息 -->
    <el-card class="info-card" shadow="never">
      <div class="info-header">
        <div class="info-title">
          <el-icon :size="22" color="#6366f1"><Key /></el-icon>
          <span>权限分配</span>
        </div>
        <div class="info-desc">
          基于 RBAC 模型：用户 → 角色 → 菜单，通过菜单的权限标识（menuCode）控制访问权限
        </div>
      </div>
      <div class="quick-nav">
        <el-tag
          type="info"
          effect="plain"
          size="large"
          class="nav-tag"
          @click="activeTab = 'user-role'"
          :class="{ active: activeTab === 'user-role' }"
        >
          <el-icon class="el-icon--left"><User /></el-icon>用户角色
        </el-tag>
        <el-tag
          type="info"
          effect="plain"
          size="large"
          class="nav-tag"
          @click="activeTab = 'role-menu'"
          :class="{ active: activeTab === 'role-menu' }"
        >
          <el-icon class="el-icon--left"><Menu /></el-icon>角色菜单
        </el-tag>
      </div>
    </el-card>

    <!-- 用户角色分配 -->
    <el-card v-show="activeTab === 'user-role'" class="content-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">用户角色分配</span>
          <span class="subtitle">查询用户已有角色，并可进行角色调整</span>
        </div>
      </template>

      <div class="search-section">
        <el-form :inline="true">
          <el-form-item label="用户ID">
            <el-input
              v-model="userId"
              placeholder="请输入用户ID"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearchUserRoles"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearchUserRoles" :disabled="!userId" :loading="userRoleLoading">
              <el-icon class="el-icon--left"><Search /></el-icon>查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 查询结果 -->
      <div v-if="showUserRoleResult" class="result-section">
        <div class="result-header">
          <span>用户 <em>{{ userId }}</em> 的角色配置</span>
          <el-tag size="small" type="info">已选 {{ selectedRoleIds.length }} / {{ roleList.length }}</el-tag>
        </div>

        <div class="role-grid" v-loading="userRoleLoading">
          <div
            v-for="role in roleList"
            :key="role.id"
            class="role-item"
            :class="{ selected: selectedRoleIds.includes(role.id as number), builtin: role.type === 1 }"
            @click="toggleRole(role)"
          >
            <div class="role-item-header">
              <el-checkbox
                :model-value="selectedRoleIds.includes(role.id as number)"
                @change="toggleRole(role)"
                @click.stop
              />
              <span class="role-name">{{ role.roleName }}</span>
              <el-tag v-if="role.type === 1" size="small" type="warning" effect="light">内置</el-tag>
            </div>
            <div class="role-item-code">{{ role.roleCode }}</div>
          </div>
        </div>

        <div class="action-bar">
          <el-button type="primary" :loading="submitLoading" @click="handleSaveUserRoles">
            <el-icon class="el-icon--left"><Check /></el-icon>保存角色分配
          </el-button>
        </div>
      </div>

      <el-empty v-if="!showUserRoleResult && !userRoleLoading" description="输入用户ID查询其角色" :image-size="80" />
    </el-card>

    <!-- 角色菜单快览 -->
    <el-card v-show="activeTab === 'role-menu'" class="content-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">角色菜单快览</span>
          <span class="subtitle">查看各角色拥有的菜单权限（编辑请前往角色管理页面）</span>
        </div>
      </template>

      <div class="search-section">
        <el-form :inline="true">
          <el-form-item label="选择角色">
            <el-select
              v-model="selectedRoleForView"
              placeholder="请选择角色"
              clearable
              style="width: 240px"
              @change="handleViewRoleMenus"
            >
              <el-option
                v-for="role in roleList"
                :key="role.id"
                :label="`${role.roleName} (${role.roleCode})`"
                :value="role.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="viewMenuTree.length > 0" class="menu-preview">
        <el-tree
          :data="viewMenuTree"
          :props="{ children: 'children', label: 'menuName' }"
          default-expand-all
          :expand-on-click-node="false"
        >
          <template #default="{ data }">
            <div class="preview-node">
              <span>{{ data.menuName }}</span>
              <el-tag
                v-if="data.menuType === 1" size="small" type="info" effect="plain"
              >目录</el-tag>
              <el-tag
                v-else-if="data.menuType === 2" size="small" type="primary" effect="plain"
              >菜单</el-tag>
              <el-tag
                v-else-if="data.menuType === 3" size="small" type="warning" effect="plain"
              >按钮</el-tag>
            </div>
          </template>
        </el-tree>
      </div>

      <el-empty v-else-if="selectedRoleForView && !roleMenuLoading" description="该角色暂无菜单权限" :image-size="80" />
      <el-empty v-else-if="!selectedRoleForView" description="请选择一个角色查看" :image-size="80" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Check, Key, User, Menu } from '@element-plus/icons-vue'
import { getRoleSimpleListApi, type RoleRow } from '@/api/roleApi'
import { getUserRoleListApi, assignUserRoleApi, getRoleMenuListApi } from '@/api/permissionApi'
import { getMenuListApi, type MenuRow } from '@/api/menuApi'

const activeTab = ref<'user-role' | 'role-menu'>('user-role')

// === 用户角色分配 ===
const userId = ref('')
const userRoleLoading = ref(false)
const submitLoading = ref(false)
const showUserRoleResult = ref(false)
const roleList = ref<RoleRow[]>([])
const selectedRoleIds = ref<number[]>([])

// === 角色菜单快览 ===
const selectedRoleForView = ref<number | string>('')
const roleMenuLoading = ref(false)
const viewMenuTree = ref<MenuRow[]>([])
const allMenus = ref<MenuRow[]>([])

// 切换角色选中
const toggleRole = (role: RoleRow) => {
  const id = role.id as number
  const idx = selectedRoleIds.value.indexOf(id)
  if (idx > -1) {
    selectedRoleIds.value.splice(idx, 1)
  } else {
    selectedRoleIds.value.push(id)
  }
}

// 加载角色列表
const loadRoleList = async () => {
  try {
    const res = await getRoleSimpleListApi()
    roleList.value = res.data || []
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

// 加载全量菜单
const loadAllMenus = async () => {
  try {
    const res = await getMenuListApi()
    allMenus.value = res.data || []
  } catch (error) {
    console.error('获取菜单列表失败', error)
  }
}

// 查询用户角色
const handleSearchUserRoles = async () => {
  if (!userId.value) return

  userRoleLoading.value = true
  showUserRoleResult.value = true
  try {
    const res = await getUserRoleListApi(userId.value)
    selectedRoleIds.value = (res.data || []) as number[]
  } catch (error: any) {
    ElMessage.error(error?.message || '查询失败')
    showUserRoleResult.value = false
  } finally {
    userRoleLoading.value = false
  }
}

// 保存用户角色
const handleSaveUserRoles = async () => {
  if (!userId.value) return

  submitLoading.value = true
  try {
    await assignUserRoleApi({
      userId: userId.value,
      roleIds: selectedRoleIds.value
    })
    ElMessage.success('角色分配保存成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

// 查看角色菜单
const handleViewRoleMenus = async () => {
  if (!selectedRoleForView.value) {
    viewMenuTree.value = []
    return
  }

  roleMenuLoading.value = true
  try {
    const res = await getRoleMenuListApi(selectedRoleForView.value)
    const menuIds = new Set(res.data || [])

    // 过滤并构建树
    const filteredMenus = allMenus.value.filter(m => menuIds.has(m.id as number))
    viewMenuTree.value = buildTree(filteredMenus)
  } catch (error) {
    console.error('获取角色菜单失败', error)
  } finally {
    roleMenuLoading.value = false
  }
}

// 构建树
const buildTree = (menus: MenuRow[]): MenuRow[] => {
  const map = new Map<number | string, MenuRow>()
  const roots: MenuRow[] = []

  menus.forEach(m => map.set(m.id, { ...m, children: [] }))

  menus.forEach(m => {
    const node = map.get(m.id)!
    if (!m.parentId || m.parentId === 0 || !map.has(m.parentId)) {
      roots.push(node)
    } else {
      const parent = map.get(m.parentId)!
      parent.children = parent.children || []
      parent.children.push(node)
    }
  })

  return roots
}

onMounted(() => {
  loadRoleList()
  loadAllMenus()
})
</script>

<style scoped lang="scss">
.permission-management {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .info-card {
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

    :deep(.el-card__body) {
      padding: 20px 24px;
    }

    .info-header {
      margin-bottom: 16px;

      .info-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 6px;
      }

      .info-desc {
        font-size: 13px;
        color: #6b7280;
        padding-left: 30px;
      }
    }

    .quick-nav {
      display: flex;
      gap: 12px;
      padding-left: 30px;

      .nav-tag {
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 6px;
        padding: 8px 16px;

        &:hover {
          background: #eef2ff;
          border-color: #c7d2fe;
          color: #4f46e5;
        }

        &.active {
          background: #eef2ff;
          border-color: #6366f1;
          color: #4f46e5;
          font-weight: 500;
        }
      }
    }
  }

  .content-card {
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

    :deep(.el-card__header) {
      padding: 14px 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    :deep(.el-card__body) {
      padding: 20px 24px;
    }

    .card-header {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
      }

      .subtitle {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }

  .search-section {
    margin-bottom: 16px;
  }

  .result-section {
    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 14px;
      color: #374151;

      em {
        font-style: normal;
        font-weight: 600;
        color: #6366f1;
      }
    }
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 20px;

    .role-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 14px;
      cursor: pointer;
      transition: all 0.2s;
      background: #fff;

      &:hover {
        border-color: #c7d2fe;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
      }

      &.selected {
        border-color: #6366f1;
        background: #f5f3ff;
      }

      &.builtin {
        border-style: dashed;
      }

      .role-item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .role-name {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }
      }

      .role-item-code {
        font-size: 12px;
        font-family: 'SF Mono', 'Cascadia Code', monospace;
        color: #9ca3af;
        padding-left: 24px;
      }
    }
  }

  .action-bar {
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
  }

  .menu-preview {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #fafbfc;
    max-height: 500px;
    overflow-y: auto;

    .preview-node {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
  }
}
</style>
