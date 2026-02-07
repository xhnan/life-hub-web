<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="账本名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入账本名称" />
      </el-form-item>
      <el-form-item label="币种" prop="defaultCurrency">
        <el-select v-model="form.defaultCurrency" placeholder="请选择币种" style="width: 100%">
          <el-option label="CNY - 人民币" value="CNY" />
          <el-option label="USD - 美元" value="USD" />
          <el-option label="EUR - 欧元" value="EUR" />
          <el-option label="HKD - 港币" value="HKD" />
          <el-option label="JPY - 日元" value="JPY" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="请输入描述"
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { addLedgerApi, updateLedgerApi, getLedgerDetailApi, type LedgerRow } from '@/api/fin/ledger'

const emit = defineEmits(['success'])

const visible = ref(false)
const title = ref('')
const loading = ref(false)
const formRef = ref<FormInstance>()
const mode = ref<'add' | 'edit'>('add')

const form = reactive<Partial<LedgerRow>>({
  name: '',
  description: '',
  defaultCurrency: 'CNY'
})

const rules = {
  name: [{ required: true, message: '请输入账本名称', trigger: 'blur' }],
  defaultCurrency: [{ required: true, message: '请选择币种', trigger: 'change' }]
}

const open = async (type: 'add' | 'edit', row?: LedgerRow) => {
  mode.value = type
  title.value = type === 'add' ? '新增账本' : '编辑账本'
  visible.value = true
  
  if (type === 'edit' && row) {
    Object.assign(form, row)
    
    // 获取详情 (虽然现在字段都在row里，但保持一致性)
    try {
      const res = await getLedgerDetailApi(row.id!)
      if (res.data) {
        Object.assign(form, res.data)
      }
    } catch (e) {
      console.error(e)
    }
  } else {
    form.id = undefined
    form.name = ''
    form.description = ''
    form.defaultCurrency = 'CNY'
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  visible.value = false
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (mode.value === 'add') {
          await addLedgerApi(form)
          ElMessage.success('新增成功')
        } else {
          await updateLedgerApi(form)
          ElMessage.success('修改成功')
        }
        visible.value = false
        emit('success')
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

defineExpose({
  open
})
</script>

<style scoped>
.ml-2 { margin-left: 8px; }
.text-gray-400 { color: #9ca3af; }
.text-xs { font-size: 12px; }
</style>
