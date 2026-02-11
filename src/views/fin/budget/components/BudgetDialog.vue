<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="520px"
    destroy-on-close
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      status-icon
    >
      <el-form-item label="预算名称" prop="name">
        <el-input v-model="form.name" placeholder="如：餐饮预算、交通预算" maxlength="30" show-word-limit />
      </el-form-item>

      <el-form-item label="预算金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0"
          :precision="2"
          :step="100"
          placeholder="0.00"
          style="width: 100%"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="预算周期" prop="period">
        <el-select v-model="form.period" placeholder="请选择周期" style="width: 100%">
          <el-option label="月度" value="MONTHLY" />
          <el-option label="年度" value="YEARLY" />
          <el-option label="自定义" value="CUSTOM" />
        </el-select>
      </el-form-item>

      <el-form-item label="起止日期" prop="startDate" v-if="form.period === 'CUSTOM'">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="关联科目" prop="accountId">
        <el-select
          v-model="form.accountId"
          placeholder="可选，关联支出科目"
          clearable
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="acc in accountList"
            :key="acc.id"
            :label="acc.name"
            :value="acc.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息（可选）" maxlength="100" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { addBudgetApi, updateBudgetApi, type BudgetRow } from '@/api/fin/budget'
import { getAccountListApi, type AccountRow } from '@/api/fin/account'
import { ledgerStore } from '@/store/ledger'

const emit = defineEmits(['success'])

const visible = ref(false)
const title = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const accountList = ref<AccountRow[]>([])
const dateRange = ref<[string, string] | null>(null)

const form = reactive<Partial<BudgetRow>>({
  id: undefined,
  name: '',
  amount: undefined,
  period: 'MONTHLY',
  accountId: undefined,
  startDate: undefined,
  endDate: undefined,
  remark: ''
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入预算名称', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入预算金额', trigger: 'blur' }],
  period: [{ required: true, message: '请选择预算周期', trigger: 'change' }]
})

watch(dateRange, (val) => {
  if (val) {
    form.startDate = val[0]
    form.endDate = val[1]
  } else {
    form.startDate = undefined
    form.endDate = undefined
  }
})

const loadAccounts = async () => {
  if (!ledgerStore.currentLedgerId) return
  try {
    const res = await getAccountListApi(ledgerStore.currentLedgerId)
    if (res.data) {
      // 只展示支出类科目
      accountList.value = res.data.filter(a => a.expense || a.accountType === 'EXPENSE')
    }
  } catch (e) {
    console.error(e)
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.id = undefined
  form.name = ''
  form.amount = undefined
  form.period = 'MONTHLY'
  form.accountId = undefined
  form.startDate = undefined
  form.endDate = undefined
  form.remark = ''
  dateRange.value = null
}

const open = (type: 'add' | 'edit', row?: BudgetRow) => {
  resetForm()
  loadAccounts()
  if (type === 'add') {
    title.value = '新增预算'
  } else if (type === 'edit' && row) {
    title.value = '编辑预算'
    form.id = row.id
    form.name = row.name || ''
    form.amount = row.amount
    form.period = row.period || 'MONTHLY'
    form.accountId = row.accountId
    form.remark = row.remark || ''
    if (row.startDate && row.endDate) {
      dateRange.value = [row.startDate, row.endDate]
    }
  }
  visible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const data = { ...form, bookId: ledgerStore.currentLedgerId ?? undefined }
      if (form.id) {
        await updateBudgetApi(data)
        ElMessage.success('更新成功')
      } else {
        await addBudgetApi(data)
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
