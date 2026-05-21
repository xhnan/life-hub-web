<template>
  <el-dialog
    v-model="visible"
    title="分配角色"
    width="650px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div v-loading="loading">
      <!-- 用户信息 -->
      <div class="user-info">
        <div class="info-item">
          <span class="label">当前用户：</span>
          <span class="value">{{ userData?.username }}</span>
          <span class="nickname" v-if="userData?.nickname">({{ userData?.nickname }})</span>
        </div>
      </div>

      <el-divider>角色列表</el-divider>

      <!-- 角色选择 -->
      <div class="role-list-container">
        <el-checkbox-group v-model="selectedRoles">
          <div v-if="roleList.length === 0" class="empty-text">暂无可用角色</div>
          <el-row :gutter="10">
            <el-col :span="12" v-for="role in roleList" :key="role.id">
              <el-checkbox :label="role.id" border style="width: 100%; margin-bottom: 10px">
                {{ role.roleName }}
                <span class="role-code">({{ role.roleCode }})</span>
                <el-tag v-if="role.type === 1" size="small" type="warning" style="margin-left: 4px">内置</el-tag>
              </el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="selected-count">
          已选择 <span class="count">{{ selectedRoles.length }}</span> 个角色
        </div>
        <div>
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            确定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserRow } from '@/api/userApi'
import type { RoleRow } from '@/api/roleApi'
import { getRoleSimpleListApi } from '@/api/roleApi'
import { getUserRoleListApi, assignUserRoleApi } from '@/api/permissionApi'

const emit = defineEmits<{
  'success': []
}>()

const visible = ref(false)
const loading = ref(false)
const submitLoading = ref(false)
const roleList = ref<RoleRow[]>([])
const selectedRoles = ref<(string | number)[]>([])
const userData = ref<UserRow | null>(null)

// 加载所有可用角色（精简列表，仅启用的）
const loadAllRoles = async () => {
  try {
    const res = await getRoleSimpleListApi()
    roleList.value = res.data || []
  } catch (error) {
    console.error('获取角色列表失败', error)
    ElMessage.error('获取角色列表失败')
  }
}

// 加载用户已有的角色ID列表
const loadUserRoles = async (userId: string | number) => {
  try {
    const res = await getUserRoleListApi(userId)
    selectedRoles.value = res.data || []
  } catch (error) {
    console.error('获取用户角色失败', error)
    ElMessage.error('获取用户角色失败')
  }
}

// 打开对话框
const openDialog = async (userInfo: UserRow) => {
  visible.value = true
  userData.value = userInfo

  if (userInfo.userId) {
    loading.value = true
    selectedRoles.value = []
    try {
      await Promise.all([loadAllRoles(), loadUserRoles(userInfo.userId)])
    } finally {
      loading.value = false
    }
  }
}

const handleClose = () => {
  visible.value = false
}

const handleSubmit = async () => {
  if (!userData.value?.userId) return

  submitLoading.value = true
  try {
    await assignUserRoleApi({
      userId: userData.value.userId,
      roleIds: selectedRoles.value as number[]
    })

    ElMessage.success('分配角色成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error?.message || '分配角色失败')
  } finally {
    submitLoading.value = false
  }
}

defineExpose({
  openDialog
})
</script>

<style scoped>
.user-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.label {
  color: #606266;
  width: 80px;
}
.value {
  font-weight: 500;
  color: #303133;
}
.nickname {
  margin-left: 8px;
  color: #909399;
}
.role-list-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
}
.role-code {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}
.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px;
}
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.selected-count {
  color: #606266;
  font-size: 14px;
}
.count {
  color: #409eff;
  font-weight: bold;
  margin: 0 4px;
}
</style>
