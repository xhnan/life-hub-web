<template>
  <el-dialog
    v-model="visible"
    title="分配角色"
    width="650px"
    @close="handleClose"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="role-assign-body">
      <!-- 用户信息 -->
      <div class="user-info">
        <el-icon :size="20" color="#6366f1"><UserFilled /></el-icon>
        <span class="username">{{ userData?.username }}</span>
        <span class="nickname" v-if="userData?.nickname">({{ userData?.nickname }})</span>
      </div>

      <!-- 角色选择区域 -->
      <div class="role-grid">
        <div
          v-for="role in roleList"
          :key="role.id"
          class="role-card"
          :class="{ selected: selectedRoles.includes(role.id as number) }"
          @click="toggleRole(role)"
        >
          <div class="role-card-left">
            <el-checkbox
              :model-value="selectedRoles.includes(role.id as number)"
              @change="toggleRole(role)"
              @click.stop
            />
          </div>
          <div class="role-card-content">
            <div class="role-card-name">
              {{ role.roleName }}
              <el-tag v-if="role.type === 1" size="small" type="warning" effect="light">内置</el-tag>
            </div>
            <div class="role-card-code">{{ role.roleCode }}</div>
          </div>
        </div>

        <div v-if="roleList.length === 0" class="empty-text">暂无可用角色</div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="selected-count">
          已选择 <em>{{ selectedRoles.length }}</em> 个角色
        </span>
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
import { UserFilled } from '@element-plus/icons-vue'
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
const selectedRoles = ref<number[]>([])
const userData = ref<UserRow | null>(null)

const toggleRole = (role: RoleRow) => {
  const id = role.id as number
  const idx = selectedRoles.value.indexOf(id)
  if (idx > -1) {
    selectedRoles.value.splice(idx, 1)
  } else {
    selectedRoles.value.push(id)
  }
}

const loadAllRoles = async () => {
  try {
    const res = await getRoleSimpleListApi()
    roleList.value = res.data || []
  } catch (error) {
    console.error('获取角色列表失败', error)
    ElMessage.error('获取角色列表失败')
  }
}

const loadUserRoles = async (userId: string | number) => {
  try {
    const res = await getUserRoleListApi(userId)
    selectedRoles.value = (res.data || []) as number[]
  } catch (error) {
    console.error('获取用户角色失败', error)
    ElMessage.error('获取用户角色失败')
  }
}

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
      roleIds: selectedRoles.value
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

<style scoped lang="scss">
.role-assign-body {
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 20px;

    .username {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }

    .nickname {
      font-size: 13px;
      color: #6b7280;
    }
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;
    padding: 4px;

    .role-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #c7d2fe;
        box-shadow: 0 2px 6px rgba(99, 102, 241, 0.06);
      }

      &.selected {
        border-color: #6366f1;
        background: #f5f3ff;
      }

      .role-card-content {
        flex: 1;

        .role-card-name {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .role-card-code {
          font-size: 12px;
          font-family: 'SF Mono', 'Cascadia Code', monospace;
          color: #9ca3af;
          margin-top: 2px;
        }
      }
    }

    .empty-text {
      grid-column: 1 / -1;
      text-align: center;
      color: #9ca3af;
      padding: 32px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .selected-count {
    font-size: 13px;
    color: #6b7280;

    em {
      font-style: normal;
      font-weight: 600;
      color: #6366f1;
    }
  }
}
</style>
