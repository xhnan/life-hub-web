<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    size="600px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="drawer-content" v-loading="loading">
      <!-- 功能权限分配 (按应用分组) -->
      <div class="tree-container">
        <el-collapse v-model="activeAppCodes">
            <el-collapse-item
              v-for="appCode in appCodeList"
              :key="appCode"
              :name="appCode"
            >
              <template #title>
                <div style="display: flex; align-items: center; width: 100%">
                  <el-checkbox
                    :model-value="isAppAllSelected(appCode)"
                    :indeterminate="isAppIndeterminate(appCode)"
                    @change="handleAppCheckChange(appCode, $event)"
                    @click.stop
                  />
                  <el-tag type="primary" size="small" style="margin-left: 8px">
                    {{ appCode }}
                  </el-tag>
                  <span style="color: #909399; font-size: 12px; margin-left: 8px">
                    ({{ getSelectedCountByApp(appCode) }}/{{ getPermissionCountByApp(appCode) }})
                  </span>
                </div>
              </template>
              <el-checkbox-group v-model="selectedPermissions">
                <div
                  v-for="permission in getPermissionsByApp(appCode)"
                  :key="permission.id"
                  style="margin-bottom: 8px"
                >
                  <el-checkbox :label="permission.id">
                    <span>{{ permission.name }}</span>
                    <el-tag size="small" type="info" style="margin-left: 8px">
                      {{ permission.permissionKey }}
                    </el-tag>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </el-collapse-item>
          </el-collapse>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          保存权限
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { RoleRow } from '@/api/roleApi'
import { getRolePermissionIdsApi, assignRolePermissionsApi } from '@/api/roleApi'
import { getAllPermissionListApi, type PermissionRow } from '@/api/permissionApi'

interface Props {
  modelValue: boolean
  roleData: RoleRow | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  roleData: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const title = ref('权限配置')
const loading = ref(false)
const submitLoading = ref(false)
const activeAppCodes = ref<string[]>([])

// 权限相关
const allPermissions = ref<PermissionRow[]>([])
const selectedPermissions = ref<(string | number)[]>([])

// 按应用编码分组的权限列表
const appCodeList = computed(() => {
  const codes = new Set(allPermissions.value.map(item => item.appCode))
  return Array.from(codes).sort()
})

// 根据应用编码获取权限列表
const getPermissionsByApp = (appCode: string) => {
  return allPermissions.value.filter(item => item.appCode === appCode)
}

// 获取某个应用的权限总数
const getPermissionCountByApp = (appCode: string) => {
  return getPermissionsByApp(appCode).length
}

// 获取某个应用已选中的权限数
const getSelectedCountByApp = (appCode: string) => {
  const appPermissions = getPermissionsByApp(appCode)
  return appPermissions.filter(p => p.id && selectedPermissions.value.includes(p.id)).length
}

// 判断某个应用是否全选
const isAppAllSelected = (appCode: string) => {
  const appPermissions = getPermissionsByApp(appCode)
  return appPermissions.length > 0 && appPermissions.every(p => p.id && selectedPermissions.value.includes(p.id))
}

// 判断某个应用是否半选
const isAppIndeterminate = (appCode: string) => {
  const selectedCount = getSelectedCountByApp(appCode)
  const totalCount = getPermissionCountByApp(appCode)
  return selectedCount > 0 && selectedCount < totalCount
}

// 处理应用级别的全选/取消全选
const handleAppCheckChange = (appCode: string, checked: boolean) => {
  const appPermissions = getPermissionsByApp(appCode)
  if (checked) {
    // 全选该应用的权限
    appPermissions.forEach(p => {
      if (p.id && !selectedPermissions.value.includes(p.id)) {
        selectedPermissions.value.push(p.id)
      }
    })
  } else {
    // 取消该应用的所有权限
    const appPermissionIds = appPermissions.filter(p => p.id).map(p => p.id as string | number)
    selectedPermissions.value = selectedPermissions.value.filter(id => !appPermissionIds.includes(id))
  }
}

// 加载权限列表（平铺）
const loadPermissionList = async () => {
  try {
    const res = await getAllPermissionListApi()
    allPermissions.value = res.data || []
    
    // 默认展开所有应用分组
    if (activeAppCodes.value.length === 0) {
      activeAppCodes.value = appCodeList.value
    }
  } catch (error) {
    console.error('获取权限列表失败', error)
  }
}

// 监听打开
watch(() => props.modelValue, async (val) => {
  if (val && props.roleData) {
    title.value = `权限配置 - ${props.roleData.roleName}`
    loading.value = true
    try {
      await loadPermissionList()
      await loadRolePermissions(props.roleData.id)
    } finally {
      loading.value = false
    }
  }
})

// 加载角色权限并回显
const loadRolePermissions = async (roleId: string | number) => {
  try {
    const res = await getRolePermissionIdsApi(roleId)
    selectedPermissions.value = res.data || []
  } catch (error) {
    console.error('获取角色权限失败', error)
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!props.roleData?.id) return
  
  submitLoading.value = true
  try {
    const roleId = props.roleData.id
    
    // 分配权限
    const permIds = selectedPermissions.value
    
    await assignRolePermissionsApi(roleId, permIds as number[])
    
    ElMessage.success('权限保存成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.drawer-content {
  padding: 0 20px;
}
.tree-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 10px;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
}
</style>
