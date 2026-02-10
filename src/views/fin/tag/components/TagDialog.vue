<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="460px"
    destroy-on-close
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      status-icon
    >
      <el-form-item label="标签名称" prop="tagName">
        <el-input v-model="form.tagName" placeholder="请输入标签名称" maxlength="20" show-word-limit />
      </el-form-item>

      <el-form-item label="颜色" prop="color">
        <div class="color-picker-row">
          <div
            v-for="c in presetColors"
            :key="c"
            class="color-dot"
            :class="{ active: form.color === c }"
            :style="{ backgroundColor: c }"
            @click="form.color = c"
          />
          <el-color-picker v-model="form.color" size="small" />
        </div>
      </el-form-item>

      <el-form-item label="图标" prop="icon">
        <div class="icon-field">
          <div class="icon-preview-box" :class="{ 'has-icon': form.icon }" :style="iconPreviewStyle">
            <ReIcon v-if="form.icon" :icon="form.icon" />
            <el-icon v-else><PriceTag /></el-icon>
          </div>
          <el-input v-model="form.icon" placeholder="Iconify 编码，如 mdi:tag" clearable style="flex:1" />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { PriceTag } from '@element-plus/icons-vue'
import { addTagApi, updateTagApi, type TagRow } from '@/api/fin/tag'
import ReIcon from '@/components/ReIcon/index.vue'

const emit = defineEmits(['success'])

const visible = ref(false)
const title = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const presetColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

const form = reactive<Partial<TagRow>>({
  id: undefined,
  tagName: '',
  color: '#3B82F6',
  icon: ''
})

const rules = reactive<FormRules>({
  tagName: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
})

const iconPreviewStyle = computed(() => {
  if (form.color) {
    return { borderColor: form.color, color: form.color, backgroundColor: form.color + '18' }
  }
  return {}
})

const resetForm = () => {
  formRef.value?.resetFields()
  form.id = undefined
  form.tagName = ''
  form.color = '#3B82F6'
  form.icon = ''
}

const open = (type: 'add' | 'edit', row?: TagRow) => {
  resetForm()
  if (type === 'add') {
    title.value = '新增标签'
  } else if (type === 'edit' && row) {
    title.value = '编辑标签'
    form.id = row.id
    form.tagName = row.tagName || ''
    form.color = row.color || '#3B82F6'
    form.icon = row.icon || ''
  }
  visible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (form.id) {
        await updateTagApi(form)
        ElMessage.success('更新成功')
      } else {
        await addTagApi({ ...form })
        ElMessage.success('新增成功')
      }
      visible.value = false
      emit('success')
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  })
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.15);
  }

  &.active {
    border-color: #0f172a;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
}

.icon-field {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.icon-preview-box {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #c0c4cc;
  background: #f5f7fa;
  transition: all 0.2s;

  &.has-icon {
    border-style: solid;
  }
}
</style>
