<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="680px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="permission-dialog"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="110px"
      class="permission-form"
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
          class="form-input"
        />
      </el-form-item>

      <el-form-item label="应用编码" prop="appCode">
        <el-select
          v-model="formData.appCode"
          placeholder="请选择应用编码"
          clearable
          :disabled="isEdit"
          class="form-input"
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
            class="form-input"
          />
        </template>
        <template v-else>
          <el-input
            v-model="formData.permissionCodeSuffix"
            placeholder="请输入权限编码后缀"
            clearable
            class="form-input"
          >
            <template #prepend>
              <span class="input-prepend">{{ formData.appCode || '应用编码' }}:</span>
            </template>
          </el-input>
          <div v-if="fullPermissionCode" class="permission-hint">
            <el-icon><InfoFilled /></el-icon>
            <span>完整编码: <code>{{ fullPermissionCode }}</code></span>
          </div>
        </template>
      </el-form-item>

      <el-form-item label="权限名称" prop="permissionName">
        <el-input
          v-model="formData.permissionName"
          placeholder="请输入权限名称"
          clearable
          class="form-input"
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入权限描述"
          clearable
          class="form-input"
          show-word-limit
          maxlength="200"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-switch
          v-model="formData.status"
          active-text="启用"
          inactive-text="禁用"
          :active-value="true"
          :inactive-value="false"
          class="status-switch"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="handleClose">
          <el-icon><Close /></el-icon>
          <span>取消</span>
        </el-button>
        <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
          <el-icon v-if="!loading"><Check /></el-icon>
          <span>{{ loading ? '提交中...' : '确定' }}</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Close, Check, InfoFilled } from '@element-plus/icons-vue'
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
.permission-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f0f0;
    margin: 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
    margin: 0;
  }
}

.permission-form {
  :deep(.el-form-item) {
    margin-bottom: 22px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;

    &::before {
      margin-right: 4px;
    }
  }

  .form-input {
    width: 100%;

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-select__wrapper) {
      border-radius: 6px;
      transition: all 0.3s ease;
      box-shadow: 0 0 0 1px #dcdfe6 inset;

      &:hover {
        box-shadow: 0 0 0 1px #c0c4cc inset;
      }

      &.is-focused {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      }
    }

    :deep(.el-textarea__inner) {
      padding: 8px 12px;
      resize: none;
    }
  }

  .input-prepend {
    font-weight: 500;
    color: #606266;
    background: #f5f7fa;
    padding: 0 4px;
  }

  .permission-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8f4ff 100%);
    border-radius: 6px;
    font-size: 13px;
    color: #606266;
    transition: all 0.3s ease;

    .el-icon {
      color: #409eff;
      font-size: 16px;
      flex-shrink: 0;
    }

    code {
      display: inline-block;
      padding: 2px 8px;
      background: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      color: #409eff;
      font-weight: 600;
      margin-left: 4px;
    }

    &:hover {
      background: linear-gradient(135deg, #e8f4ff 0%, #d9ecff 100%);
      transform: translateX(2px);
    }
  }

  .status-switch {
    :deep(.el-switch__label) {
      font-weight: 500;
    }
  }
}

// 对话框打开动画
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.permission-form {
  animation: slideIn 0.3s ease;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    min-width: 100px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;

    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>
