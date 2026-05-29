<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="560px"
    @close="handleClose"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="90px"
      label-position="right"
      class="role-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="角色编码" prop="roleCode">
            <el-input
              v-model="formData.roleCode"
              placeholder="如 ADMIN"
              :disabled="isEdit"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="角色名称" prop="roleName">
            <el-input
              v-model="formData.roleName"
              placeholder="请输入角色名称"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="角色排序" prop="sortOrder">
            <el-input-number
              v-model="formData.sortOrder"
              :min="0"
              :max="9999"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-switch
              v-model="formData.status"
              inline-prompt
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="数据范围" prop="dataScope">
        <el-radio-group v-model="formData.dataScope">
          <el-radio-button :value="1">全部</el-radio-button>
          <el-radio-button :value="2">指定部门</el-radio-button>
          <el-radio-button :value="3">本部门</el-radio-button>
          <el-radio-button :value="4">本部门及以下</el-radio-button>
          <el-radio-button :value="5">仅本人</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述（可选）"
          :maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { RoleRow } from '@/api/roleApi'
import { addRoleApi, updateRoleApi } from '@/api/roleApi'

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

const formData = reactive<Partial<RoleRow>>({
  id: undefined,
  roleCode: '',
  roleName: '',
  sortOrder: 0,
  dataScope: 1,
  description: '',
  status: true
})

const rules: FormRules = {
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '建议使用大写字母+下划线格式', trigger: 'blur' }
  ],
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.isEdit && props.roleData) {
      Object.assign(formData, props.roleData)
    } else {
      resetForm()
    }
  }
})

const resetForm = () => {
  formData.id = undefined
  formData.roleCode = ''
  formData.roleName = ''
  formData.sortOrder = 0
  formData.dataScope = 1
  formData.description = ''
  formData.status = true
  formRef.value?.clearValidate()
}

const handleClose = () => {
  emit('update:modelValue', false)
}

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
      // handled by http interceptor
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.role-form {
  padding: 8px 0;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
