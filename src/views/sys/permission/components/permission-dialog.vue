<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="所属菜单" prop="menuId">
        <el-tree-select
          v-model="formData.menuId"
          :data="menuTree"
          :props="{ label: 'menuName', children: 'children' }"
          check-strictly
          placeholder="请选择所属菜单"
          clearable
          node-key="id"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="应用编码" prop="appCode">
        <el-select
          v-model="formData.appCode"
          placeholder="请选择应用编码"
          clearable
          :disabled="isEdit"
          style="width: 100%"
        >
          <el-option
            v-for="code in appCodeList"
            :key="code"
            :label="code"
            :value="code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="权限编码" prop="permissionCodeSuffix">
        <template v-if="isEdit">
          <el-input
            :model-value="fullPermissionCode"
            disabled
            placeholder="权限编码"
          />
        </template>
        <template v-else>
          <el-input
            v-model="formData.permissionCodeSuffix"
            placeholder="请输入权限编码后缀"
            clearable
          >
            <template #prepend>
              <span>{{ formData.appCode || '应用编码' }}:</span>
            </template>
          </el-input>
          <div v-if="fullPermissionCode" style="margin-top: 4px; font-size: 12px; color: #909399">
            完整编码: {{ fullPermissionCode }}
          </div>
        </template>
      </el-form-item>
      <el-form-item label="权限名称" prop="permissionName">
        <el-input
          v-model="formData.permissionName"
          placeholder="请输入权限名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入权限描述"
          clearable
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-switch
          v-model="formData.status"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { PermissionFormData } from '@/api/permissionApi'
import { addPermissionApi, updatePermissionApi, getAppCodeListApi } from '@/api/permissionApi'
import { getMenuTreeApi, type MenuRow } from '@/api/menuApi'

interface Props {
  modelValue: boolean
  title: string
  isEdit: boolean
  permissionData: PermissionFormData | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  isEdit: false,
  permissionData: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const menuTree = ref<MenuRow[]>([])
const appCodeList = ref<string[]>([])

const formData = reactive<Partial<PermissionFormData & { permissionCodeSuffix: string }>>({
  id: undefined,
  menuId: undefined,
  appCode: '',
  permissionCode: '',
  permissionCodeSuffix: '',
  permissionName: '',
  description: '',
  status: true
})

// 计算完整权限编码
const fullPermissionCode = computed(() => {
  if (formData.appCode && formData.permissionCodeSuffix) {
    return `${formData.appCode}:${formData.permissionCodeSuffix}`
  }
  return ''
})

const rules: FormRules = {
  appCode: [
    { required: true, message: '请选择应用编码', trigger: 'change' }
  ],
  permissionCodeSuffix: [
    { required: true, message: '请输入权限编码后缀', trigger: 'blur' }
  ],
  permissionName: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ]
}

// 监听对话框打开，填充数据
watch(() => props.modelValue, async (val) => {
  if (val) {
    await Promise.all([loadMenuTree(), loadAppCodeList()])
    if (props.isEdit && props.permissionData) {
      Object.assign(formData, props.permissionData)
      // 如果是编辑模式，需要将权限编码拆分为应用编码和后缀
      if (formData.permissionCode) {
        const parts = formData.permissionCode.split(':')
        if (parts.length === 2) {
          formData.appCode = parts[0]
          formData.permissionCodeSuffix = parts[1]
        } else {
          // 如果没有冒号，尝试从权限编码中提取应用编码
          formData.permissionCodeSuffix = formData.permissionCode
        }
      }
    } else {
      resetForm()
    }
  }
})

// 加载菜单树
const loadMenuTree = async () => {
  try {
    const res = await getMenuTreeApi()
    menuTree.value = res.data || []
  } catch (error) {
    console.error('获取菜单树失败', error)
  }
}

// 加载应用编码列表
const loadAppCodeList = async () => {
  try {
    const res = await getAppCodeListApi()
    appCodeList.value = res.data || []
  } catch (error) {
    console.error('获取应用编码列表失败', error)
  }
}

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.menuId = undefined
  formData.appCode = ''
  formData.permissionCode = ''
  formData.permissionCodeSuffix = ''
  formData.permissionName = ''
  formData.description = ''
  formData.status = true
  formRef.value?.clearValidate()
}

// 关闭对话框
const handleClose = () => {
  emit('update:modelValue', false)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      // 提交前自动拼接完整权限编码，并排除前端辅助字段
      const submitData: Partial<PermissionFormData> = {
        id: formData.id,
        menuId: formData.menuId,
        appCode: formData.appCode,
        permissionCode: fullPermissionCode.value,
        permissionName: formData.permissionName,
        description: formData.description,
        status: formData.status
      }
      
      if (props.isEdit) {
        await updatePermissionApi(submitData)
        ElMessage.success('修改成功')
      } else {
        await addPermissionApi(submitData)
        ElMessage.success('新增成功')
      }
      emit('success')
      handleClose()
    } catch (error: any) {
      ElMessage.error(error?.message || '操作失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
</style>
