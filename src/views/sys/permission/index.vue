<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span style="font-size: 16px; font-weight: 500">用户角色分配</span>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
        show-icon
      >
        <template #title>
          新版 RBAC 权限模型：用户 → 角色 → 菜单。直接通过菜单的 menuCode 字段作为权限标识，无需独立的权限表。
        </template>
      </el-alert>

      <!-- 用户搜索 -->
      <el-form :inline="true" style="margin-bottom: 16px">
        <el-form-item label="用户ID">
          <el-input
            v-model="userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :disabled="!userId">查询用户角色</el-button>
        </el-form-item>
      </el-form>

      <!-- 用户角色分配 -->
      <div v-if="showResult" v-loading="loading">
        <el-divider content-position="left">
          用户 {{ userId }} 的角色列表
        </el-divider>

        <el-checkbox-group v-model="selectedRoleIds" style="margin-bottom: 16px">
          <el-checkbox
            v-for="role in roleList"
            :key="role.id"
            :label="role.id"
            :disabled="role.type === 1"
            style="margin-bottom: 8px; display: block"
          >
            <span>{{ role.roleName }}</span>
            <el-tag size="small" type="info" style="margin-left: 8px">{{ role.roleCode }}</el-tag>
            <el-tag v-if="role.type === 1" size="small" type="warning" style="margin-left: 4px">内置</el-tag>
          </el-checkbox>
        </el-checkbox-group>

        <el-button type="primary" :loading="submitLoading" @click="handleSave">
          保存角色分配
        </el-button>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!showResult && !loading" description="请输入用户ID查询" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoleSimpleListApi, type RoleRow } from '@/api/roleApi'
import { getUserRoleListApi, assignUserRoleApi } from '@/api/permissionApi'

const userId = ref('')
const loading = ref(false)
const submitLoading = ref(false)
const showResult = ref(false)

const roleList = ref<RoleRow[]>([])
const selectedRoleIds = ref<(number | string)[]>([])

// 加载角色列表（精简列表，仅启用的角色）
const loadRoleList = async () => {
  try {
    const res = await getRoleSimpleListApi()
    roleList.value = res.data || []
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

// 查询用户已有角色
const handleSearch = async () => {
  if (!userId.value) return

  loading.value = true
  showResult.value = true
  try {
    const res = await getUserRoleListApi(userId.value)
    selectedRoleIds.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error?.message || '查询失败')
    showResult.value = false
  } finally {
    loading.value = false
  }
}

// 保存角色分配
const handleSave = async () => {
  if (!userId.value) return

  submitLoading.value = true
  try {
    await assignUserRoleApi({
      userId: userId.value,
      roleIds: selectedRoleIds.value as number[]
    })
    ElMessage.success('角色分配保存成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadRoleList()
})
</script>

<style scoped>
</style>
