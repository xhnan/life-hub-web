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
import { getUserRolesApi, sysUserRoleApi } from '@/api/userApi'
import type { RoleRow } from '@/api/roleApi'
import { getRoleListPageApi } from '@/api/roleApi'

const emit = defineEmits<{
  'success': []
}>()

const visible = ref(false)
const loading = ref(false)
const submitLoading = ref(false)
const roleList = ref<RoleRow[]>([])
const selectedRoles = ref<(string | number)[]>([]) // 存储选中的 roleId
const userData = ref<UserRow | null>(null)
// 存储原始的关联关系，用于删除时查找 id
// 结构: { roleId: sysUserRoleId }
const originalUserRoleMap = ref<Record<string | number, string | number>>({})

// 加载所有角色
const loadAllRoles = async () => {
  try {
    // 使用分页接口获取所有角色（假设最大1000条）
    const res = await getRoleListPageApi({ pageNum: 1, pageSize: 1000 })
    const list = res.data?.records || []
    // 只显示启用的角色
    roleList.value = list.filter(r => r.status !== false)
  } catch (error) {
    console.error('获取角色列表失败', error)
    ElMessage.error('获取角色列表失败')
  }
}

// 加载用户已有的角色
const loadUserRoles = async (userId: string | number) => {
  try {
    // 1. 获取用户角色列表 (List<SysRole>)
    const res = await getUserRolesApi(userId)
    const roles = res.data || []
    
    // 2. 这里的 getUserRolesApi 只返回了 SysRole，没有中间表 ID
    // 导致我们无法调用 delete 接口。
    // 我们必须获取 SysUserRole 列表才能知道删除时的 ID。
    // 由于后端只提供了 getAll() 接口，我们可以尝试调用它并在前端过滤 (虽然效率低，但这是目前唯一的方法)
    // 或者，我们可以赌一把，也许 delete 接口也支持传 roleId (虽然用户给的代码写的是 delete(@PathVariable Long id))
    
    // 鉴于无法直接获取中间表ID，我们尝试调用 getAll 获取所有关联，然后过滤
    // 注意：如果数据量大，这会很慢。
    const allRelationsRes = await sysUserRoleApi.getAll()
    const allRelations = allRelationsRes.data || []
    
    // 过滤出当前用户的关联
    const userRelations = allRelations.filter((item: any) => String(item.userId) === String(userId))
    
    originalUserRoleMap.value = {}
    selectedRoles.value = []
    
    userRelations.forEach((item: any) => {
      // 记录 roleId -> id 的映射
      originalUserRoleMap.value[item.roleId] = item.id
      selectedRoles.value.push(item.roleId)
    })
    
    // 如果 getAll 不可用或为空，尝试回退到旧逻辑（仅用于显示，无法删除）
    if (userRelations.length === 0 && roles.length > 0) {
      console.warn('无法获取关联表ID，只能显示角色，可能无法删除')
      selectedRoles.value = roles.map((r: any) => r.id)
    }

  } catch (error) {
    console.error('获取用户角色失败', error)
    ElMessage.error('获取用户角色失败')
  }
}

// 打开对话框
const openDialog = async (userInfo: UserRow) => {
  console.log('openDialog', userInfo)
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
    const currentRoleIds = selectedRoles.value
    const userId = userData.value.userId

    // 计算差异
    // 需要新增的：currentRoleIds 中有，但 originalUserRoleMap 中没有的
    const toAdd = currentRoleIds.filter(id => !originalUserRoleMap.value[id])
    
    // 需要删除的：originalUserRoleMap 中有，但 currentRoleIds 中没有的
    const originalIds = Object.keys(originalUserRoleMap.value).map(k => Number(k))
    const toRemove = originalIds.filter(id => !currentRoleIds.includes(id))

    // 执行删除
    for (const roleId of toRemove) {
      const relationId = originalUserRoleMap.value[roleId]
      if (relationId) {
        await sysUserRoleApi.delete(relationId)
      }
    }

    // 执行新增
    for (const roleId of toAdd) {
      await sysUserRoleApi.add({
        userId,
        roleId
      })
    }
    
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
