<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="650px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="应用名称" prop="appName">
        <el-input v-model="formData.appName" placeholder="请输入应用名称" />
      </el-form-item>
      <el-form-item label="企业ID" prop="corpId">
        <el-input v-model="formData.corpId" placeholder="请输入企业微信企业ID" />
      </el-form-item>
      <el-form-item label="应用密钥" prop="corpSecret">
        <el-input
          v-model="formData.corpSecret"
          type="password"
          placeholder="请输入企业微信应用密钥"
          show-password
        />
      </el-form-item>
      <el-form-item label="AgentId" prop="agentId">
        <el-input-number v-model="formData.agentId" :min="0" :max="999999999" controls-position="right" style="width: 100%" placeholder="请输入AgentId" />
      </el-form-item>
      <el-form-item label="回调Token" prop="token">
        <el-input v-model="formData.token" placeholder="请输入回调验证Token" />
      </el-form-item>
      <el-form-item label="加密密钥" prop="encodingAesKey">
        <el-input
          v-model="formData.encodingAesKey"
          type="textarea"
          :rows="2"
          placeholder="请输入消息加密密钥(EncodingAESKey)"
        />
      </el-form-item>
      <el-form-item label="消息处理器" prop="handlerBeanName">
        <el-input
          v-model="formData.handlerBeanName"
          placeholder="请输入消息处理器Bean名称（完整类名）"
        />
        <div class="form-tip">例如：com.example.handler.WechatMessageHandler</div>
      </el-form-item>
      <el-form-item label="状态" prop="isEnabled">
        <el-radio-group v-model="formData.isEnabled">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">停用</el-radio>
        </el-radio-group>
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
import { addWeworkAppApi, updateWeworkAppApi, type WeworkAppRow } from '@/api/weworkAppApi'

const props = defineProps<{
  modelValue: boolean
  title: string
  isEdit: boolean
  appData: WeworkAppRow | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  success: []
}>()

const visible = ref(false)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const formData = reactive({
  id: undefined as number | undefined,
  appName: '',
  corpId: '',
  corpSecret: '',
  agentId: undefined as number | undefined,
  token: '',
  encodingAesKey: '',
  handlerBeanName: '',
  isEnabled: 1
})

const rules: FormRules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  corpId: [{ required: true, message: '请输入企业ID', trigger: 'blur' }],
  corpSecret: [{ required: true, message: '请输入应用密钥', trigger: 'blur' }],
  agentId: [{ required: true, message: '请输入AgentId', trigger: 'blur' }]
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    if (props.isEdit && props.appData) {
      Object.assign(formData, {
        id: props.appData.id,
        appName: props.appData.appName || '',
        corpId: props.appData.corpId || '',
        corpSecret: props.appData.corpSecret || '',
        agentId: props.appData.agentId,
        token: props.appData.token || '',
        encodingAesKey: props.appData.encodingAesKey || '',
        handlerBeanName: props.appData.handlerBeanName || '',
        isEnabled: props.appData.isEnabled ?? 1
      })
    } else {
      Object.assign(formData, {
        id: undefined,
        appName: '',
        corpId: '',
        corpSecret: '',
        agentId: undefined,
        token: '',
        encodingAesKey: '',
        handlerBeanName: '',
        isEnabled: 1
      })
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
      await updateWeworkAppApi(formData)
      ElMessage.success('修改成功')
    } else {
      await addWeworkAppApi(formData)
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

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
