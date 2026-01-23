<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="角色编码" prop="roleCode">
        <el-input
          v-model="formData.roleCode"
          placeholder="请输入角色编码"
          :disabled="isEdit"
          clearable
        />
      </el-form-item>
      <el-form-item label="角色名称" prop="roleName">
        <el-input
          v-model="formData.roleName"
          placeholder="请输入角色名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="父级角色" prop="parentId">
        <el-select v-model="formData.parentId" placeholder="请选择父级角色" clearable style="width: 100%">
          <el-option
            v-for="item in roleOptions"
            :key="item.id"
            :label="item.roleName"
            :value="item.id"
            :disabled="item.id === formData.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
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
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { RoleRow } from '@/api/roleApi'
import { addRoleApi, updateRoleApi, getRoleListPageApi } from '@/api/roleApi'

interface Props {
  modelValue: boolean
  title: string
  isEdit: boolean
  roleData: RoleRow | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  isEdit: false,
  roleData: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const roleOptions = ref<RoleRow[]>([])

const formData = reactive<Partial<RoleRow>>({
  id: undefined,
  roleCode: '',
  roleName: '',
  description: '',
  status: true,
  parentId: undefined
})

const rules: FormRules = {
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '角色编码只能包含字母、数字、下划线和中划线', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

// 加载角色列表（用于父级角色选择）
const loadRoleList = async () => {
  try {
    const res = await getRoleListPageApi({ pageNum: 1, pageSize: 1000 })
    roleOptions.value = res.data?.records || []
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

// 监听对话框打开
watch(() => props.modelValue, async (val) => {
  if (val) {
    await loadRoleList()
    
    if (props.isEdit && props.roleData) {
      Object.assign(formData, props.roleData)
    } else {
      resetForm()
    }
  }
})

// 重置表单
const resetForm = () => {
  formData.id = undefined
  formData.parentId = undefined
  formData.roleCode = ''
  formData.roleName = ''
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
      if (props.isEdit) {
        await updateRoleApi(formData)
        ElMessage.success('修改成功')
      } else {
        await addRoleApi(formData)
        ElMessage.success('新增成功')
      }

      emit('success')
      handleClose()
    } catch (error: any) {
      // ElMessage.error(error?.message || '操作失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
</style>
