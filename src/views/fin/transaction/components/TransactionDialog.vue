<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="900px"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <!-- 交易主信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="交易日期" prop="transDate">
            <el-date-picker
              v-model="form.transDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input v-model="form.description" placeholder="请输入交易描述" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 分录明细 -->
      <div class="entries-section mt-4">
        <div class="section-header mb-2">
          <span class="font-bold">分录明细</span>
          <el-button type="primary" link :icon="Plus" @click="handleAddEntry">添加分录</el-button>
        </div>
        
        <el-table :data="form.entries" border style="width: 100%" size="small">
          <el-table-column label="科目" min-width="200" required>
            <template #default="{ row, $index }">
              <el-form-item
                :prop="'entries.' + $index + '.accountId'"
                :rules="{ required: true, message: '请选择科目', trigger: 'change' }"
                label-width="0"
                class="mb-0"
              >
                <el-tree-select
                  v-model="row.accountId"
                  :data="accountTree"
                  :props="{ label: 'name', value: 'id', children: 'children' }"
                  placeholder="选择科目"
                  check-strictly
                  filterable
                  style="width: 100%"
                  @change="(val) => handleAccountChange(val, row)"
                />
              </el-form-item>
            </template>
          </el-table-column>

          <el-table-column label="借贷方向" width="100">
             <template #default="{ row }">
               <el-select v-model="row.direction" disabled>
                 <el-option label="借" value="DEBIT" />
                 <el-option label="贷" value="CREDIT" />
               </el-select>
             </template>
          </el-table-column>

          <el-table-column label="金额" width="150">
            <template #default="{ row, $index }">
              <el-form-item
                :prop="'entries.' + $index + '.amount'"
                :rules="{ required: true, message: '请输入金额', trigger: 'blur' }"
                label-width="0"
                class="mb-0"
              >
                <el-input-number 
                  v-model="row.amount" 
                  :precision="2" 
                  :min="0" 
                  :controls="false"
                  style="width: 100%" 
                />
              </el-form-item>
            </template>
          </el-table-column>

          <el-table-column label="备注" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.memo" placeholder="备注" />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="60" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link :icon="Delete" @click="handleRemoveEntry($index)" />
            </template>
          </el-table-column>
        </el-table>

        <!-- 借贷平衡检查 -->
        <div class="balance-check mt-2 flex justify-end gap-4 text-sm">
          <span :class="totalDebit === totalCredit ? 'text-green-500' : 'text-red-500'">
            借方总计: {{ totalDebit.toFixed(2) }}
          </span>
          <span :class="totalDebit === totalCredit ? 'text-green-500' : 'text-red-500'">
            贷方总计: {{ totalCredit.toFixed(2) }}
          </span>
          <span v-if="totalDebit !== totalCredit" class="text-red-500 font-bold">
            差额: {{ Math.abs(totalDebit - totalCredit).toFixed(2) }}
          </span>
        </div>
      </div>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { addTransactionApi, updateTransactionApi, type TransactionRow, type TransactionDTO } from '@/api/fin/transaction'
import type { EntryRow } from '@/api/fin/entry'
import { getAccountTreeApi, type AccountRow } from '@/api/fin/account'
import dayjs from 'dayjs'
import { ledgerStore } from '@/store/ledger'

const emit = defineEmits(['success'])

const visible = ref(false)
const title = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const accountTree = ref<AccountRow[]>([])

// 扁平化账户列表，用于快速查找属性
const accountMap = ref<Record<number, AccountRow>>({})

const form = reactive<TransactionDTO>({
  id: undefined,
  bookId: undefined,
  transDate: '',
  description: '',
  entries: []
})

const rules = reactive<FormRules>({
  transDate: [{ required: true, message: '请选择交易日期', trigger: 'change' }],
  description: [{ required: true, message: '请输入交易描述', trigger: 'blur' }]
})

// 计算借贷总额
const totalDebit = computed(() => {
  return (form.entries || [])
    .filter(e => e.direction === 'DEBIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
})

const totalCredit = computed(() => {
  return (form.entries || [])
    .filter(e => e.direction === 'CREDIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
})

const loadAccounts = async () => {
  if (!ledgerStore.currentLedgerId) return
  try {
    const res = await getAccountTreeApi({ bookId: ledgerStore.currentLedgerId })
    if (res.data) {
      accountTree.value = res.data
      flattenAccounts(res.data)
    }
  } catch (error) {
    console.error(error)
  }
}

const flattenAccounts = (nodes: AccountRow[]) => {
  nodes.forEach(node => {
    accountMap.value[node.id] = node
    if (node.children) {
      flattenAccounts(node.children)
    }
  })
}

const handleAccountChange = (accountId: number, row: Partial<EntryRow>) => {
  const account = accountMap.value[accountId]
  if (account) {
    // 根据科目类型自动设置默认借贷方向
    // 资产/支出 -> 借，负债/权益/收入 -> 贷
    if (['ASSET', 'EXPENSE'].includes(account.accountTypeEnum)) {
      row.direction = 'DEBIT'
    } else {
      row.direction = 'CREDIT'
    }
  }
}

const handleAddEntry = () => {
  if (!form.entries) form.entries = []
  form.entries.push({
    accountId: undefined,
    direction: 'DEBIT',
    amount: 0,
    memo: ''
  })
}

const handleRemoveEntry = (index: number) => {
  form.entries?.splice(index, 1)
}

const open = (type: 'add' | 'edit', row?: TransactionRow) => {
  visible.value = true
  loadAccounts()
  
  if (formRef.value) formRef.value.resetFields()
  
  if (type === 'add') {
    title.value = '新增交易'
    form.id = undefined
    form.bookId = ledgerStore.currentLedgerId || undefined
    form.transDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
    form.description = ''
    form.entries = [
      { direction: 'DEBIT', amount: 0 },
      { direction: 'CREDIT', amount: 0 }
    ]
  } else if (type === 'edit' && row) {
    title.value = '编辑交易'
    form.id = row.id
    form.bookId = row.bookId
    form.transDate = row.transDate
    form.description = row.description
    // TODO: 编辑时需要回显分录，这里暂时无法获取分录，需要调用详情接口
    // 目前仅支持新增
    form.entries = []
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 检查借贷平衡
      if (Math.abs(totalDebit.value - totalCredit.value) > 0.01) {
        ElMessage.error('借贷不平衡，请检查金额')
        return
      }
      
      submitting.value = true
      try {
        if (form.id) {
          await updateTransactionApi(form)
          ElMessage.success('更新成功')
        } else {
          await addTransactionApi(form)
          ElMessage.success('新增成功')
        }
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

defineExpose({ open })
</script>

<style scoped lang="scss">
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.mb-0 { margin-bottom: 0 !important; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.flex { display: flex; }
.justify-end { justify-content: flex-end; }
.gap-4 { gap: 16px; }
.text-sm { font-size: 14px; }
.font-bold { font-weight: 700; }
.text-green-500 { color: #10B981; }
.text-red-500 { color: #EF4444; }
</style>
