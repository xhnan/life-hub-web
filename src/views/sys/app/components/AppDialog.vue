<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="应用名称" prop="appName">
        <el-input v-model="formData.appName" placeholder="请输入应用名称" />
      </el-form-item>
      <el-form-item label="应用编码" prop="appCode">
        <el-input v-model="formData.appCode" placeholder="请输入应用编码" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-switch v-model="formData.status" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { addAppApi, updateAppApi, type AppRow } from '@/api/appApi'

const props = defineProps<{
  modelValue: boolean
  title: string
  isEdit: boolean
  appData: AppRow | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  success: []
}>()

const visible = ref(false)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const formData = reactive({
  id: '' as string | number,
  appName: '',
  appCode: '',
  description: '',
  status: true
})

const rules: FormRules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appCode: [{ required: true, message: '请输入应用编码', trigger: 'blur' }]
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    if (props.isEdit && props.appData) {
      Object.assign(formData, {
        id: props.appData.id,
        appName: props.appData.appName,
        appCode: props.appData.appCode,
        description: props.appData.description || '',
        status: props.appData.status ?? true
      })
    } else {
      Object.assign(formData, { id: '', appName: '', appCode: '', description: '', status: true })
    }
    formRef.value?.clearValidate()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (props.isEdit) {
      await updateAppApi(formData)
      ElMessage.success('修改成功')
    } else {
      await addAppApi(formData)
      ElMessage.success('新增成功')
    }
    visible.value = false
    emit('success')
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>
