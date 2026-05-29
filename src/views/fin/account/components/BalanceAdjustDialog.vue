<template>
  <el-dialog
    v-model="visible"
    title="余额调整"
    width="500px"
    destroy-on-close
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      status-icon
    >
      <el-form-item label="调整科目" prop="accountId">
        <el-tree-select
          v-model="form.accountId"
          :data="accountTreeData"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          placeholder="选择要调整的科目"
          check-strictly
          style="width: 100%"
          filterable
          @change="handleAccountChange"
        />
      </el-form-item>

      <el-form-item label="当前余额">
        <div class="balance-display">
          <span class="balance-value" :class="getBalanceClass(currentBalance)">
            ¥ {{ formatCurrency(currentBalance) }}
          </span>
          <el-tag v-if="selectedAccount" :type="getTypeTag(selectedAccount.accountTypeEnum)" size="small" class="ml-2">
            {{ selectedAccount?.accountTypeEnum }}
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item label="目标余额" prop="targetBalance">
        <el-input-number
          v-model="form.targetBalance"
          :precision="2"
          :step="100"
          :min="-999999999"
          :max="999999999"
          style="width: 100%"
          placeholder="请输入目标余额"
        />
      </el-form-item>

      <el-alert
        v-if="diffAmount !== 0"
        :title="`调整金额：${diffAmount > 0 ? '+' : ''}${formatCurrency(diffAmount)}`"
        :type="diffAmount > 0 ? 'success' : 'warning'"
        :closable="false"
        show-icon
        class="mb-4"
      />

      <el-form-item label="调整说明" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入调整说明（可选）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="权益科目" prop="equityAccountId">
        <el-select
          v-model="form.equityAccountId"
          placeholder="不选择则自动查找'余额调整'科目"
          clearable
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="item in equityAccounts"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定调整
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { adjustBalanceApi, type AccountRow } from '@/api/fin/account'
import { ledgerStore } from '@/store/ledger'

const props = defineProps<{
  accountTreeData: AccountRow[]
}>()

const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const selectedAccount = ref<AccountRow | null>(null)
const currentBalance = ref(0)

const form = reactive({
  accountId: undefined as number | string | undefined,
  targetBalance: 0,
  description: '余额调整',
  equityAccountId: undefined as number | undefined
})

const rules = reactive<FormRules>({
  accountId: [{ required: true, message: '请选择调整科目', trigger: 'change' }],
  targetBalance: [
    { required: true, message: '请输入目标余额', trigger: 'blur' },
    { type: 'number', message: '请输入有效的数字', trigger: 'blur' }
  ]
})

// 计算调整金额
const diffAmount = computed(() => {
  return form.targetBalance - currentBalance.value
})

// 过滤出权益类科目
const equityAccounts = computed(() => {
  const filterEquity = (accounts: AccountRow[]): AccountRow[] => {
    const result: AccountRow[] = []
    accounts.forEach(account => {
      if (account.accountType === 'EQUITY' || account.accountTypeEnum === '权益') {
        result.push(account)
      }
      if (account.children && account.children.length > 0) {
        result.push(...filterEquity(account.children))
      }
    })
    return result
  }
  return filterEquity(props.accountTreeData)
})

const getTypeTag = (type: string) => {
  const map: Record<string, string> = {
    '资产': 'success',
    '负债': 'danger',
    '权益': 'warning',
    '收入': 'primary',
    '支出': 'info'
  }
  return map[type] || 'info'
}

const getBalanceClass = (amount: number) => {
  if (amount > 0) return 'text-green'
  if (amount < 0) return 'text-red'
  return 'text-gray'
}

const formatCurrency = (amount: number) => {
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

// 查找账户详情
const findAccountById = (accounts: AccountRow[], id: number | string): AccountRow | null => {
  for (const account of accounts) {
    if (account.id === id) {
      return account
    }
    if (account.children && account.children.length > 0) {
      const found = findAccountById(account.children, id)
      if (found) return found
    }
  }
  return null
}

const handleAccountChange = (value: number | string) => {
  const account = findAccountById(props.accountTreeData, value)
  if (account) {
    selectedAccount.value = account
    currentBalance.value = account.currentBalance || 0
    form.targetBalance = account.currentBalance || 0
  }
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  form.accountId = undefined
  form.targetBalance = 0
  form.description = '余额调整'
  form.equityAccountId = undefined
  selectedAccount.value = null
  currentBalance.value = 0
}

const open = () => {
  resetForm()
  visible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await adjustBalanceApi({
          accountId: form.accountId!,
          targetBalance: form.targetBalance,
          description: form.description,
          equityAccountId: form.equityAccountId
        })
        ElMessage.success('余额调整成功')
        visible.value = false
        emit('success')
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

defineExpose({
  open
})
</script>

<style scoped lang="scss">
.balance-display {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;

  .balance-value {
    font-size: 18px;
    font-weight: 600;
    font-family: 'Fira Sans', sans-serif;
  }
}

.text-green { color: #10B981; }
.text-red { color: #EF4444; }
.text-gray { color: #94A3B8; }

.ml-2 { margin-left: 8px; }
.mb-4 { margin-bottom: 16px; }
</style>
