<template>
  <el-dialog
    v-model="visible"
    :title="title"
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
      <el-form-item label="父级账户" prop="parentId" v-if="form.parentId">
         <el-tree-select
            v-model="form.parentId"
            :data="allData"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="选择父级账户"
            check-strictly
            style="width: 100%"
            disabled
         />
      </el-form-item>
      
      <el-form-item label="图标" prop="icon">
        <div class="icon-field">
          <div class="icon-preview-box" :class="{ 'has-icon': form.icon }">
            <ReIcon v-if="form.icon" :icon="form.icon" />
            <el-icon v-else><PictureRounded /></el-icon>
          </div>
          <el-input v-model="form.icon" placeholder="输入 Iconify 图标编码，如 mdi:bank" clearable class="icon-input" />
        </div>
      </el-form-item>

      <el-form-item label="账户名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入账户名称" />
      </el-form-item>
      
      <el-form-item label="账户代码" prop="code">
        <el-input v-model="form.code" placeholder="请输入账户代码">
          <template #prepend v-if="parentCode">
            {{ parentCode }}
          </template>
        </el-input>
      </el-form-item>
      
      <el-form-item label="账户类型" prop="accountTypeEnum">
        <el-select 
          v-model="form.accountTypeEnum" 
          placeholder="请选择账户类型" 
          style="width: 100%" 
          :disabled="!!form.parentId"
        >
          <el-option label="资产" value="资产" />
          <el-option label="负债" value="负债" />
          <el-option label="权益" value="权益" />
          <el-option label="收入" value="收入" />
          <el-option label="支出" value="支出" />
        </el-select>
      </el-form-item>
      
      <!-- 移除手动选择借贷方向 -->
      
      <el-form-item label="期初余额" prop="initialBalance">
        <el-input-number 
          v-model="form.initialBalance" 
          :precision="2" 
          :step="100" 
          style="width: 100%" 
          placeholder="0.00"
        />
      </el-form-item>
      
      <el-form-item label="币种" prop="currencyCode">
        <el-select v-model="form.currencyCode" style="width: 100%">
          <el-option label="CNY - 人民币" value="CNY" />
          <el-option label="USD - 美元" value="USD" />
        </el-select>
      </el-form-item>

      <el-form-item label="备注" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入备注信息" />
      </el-form-item>
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { addAccountApi, updateAccountApi, type AccountRow } from '@/api/fin/account'
import { ledgerStore } from '@/store/ledger'
import { PictureRounded } from '@element-plus/icons-vue'
import ReIcon from '@/components/ReIcon/index.vue'

const props = defineProps<{
  allData: AccountRow[]
}>()

const emit = defineEmits(['success'])

const visible = ref(false)
const title = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const parentCode = ref('')

const form = reactive<Partial<AccountRow>>({
  id: undefined,
  parentId: null,
  bookId: undefined,
  name: '',
  code: '',
  icon: '',
  accountTypeEnum: undefined,
  initialBalance: 0,
  currencyCode: 'CNY',
  description: '',
  isArchived: false
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账户代码', trigger: 'blur' }],
  accountTypeEnum: [{ required: true, message: '请选择账户类型', trigger: 'change' }],
  currencyCode: [{ required: true, message: '请选择币种', trigger: 'change' }]
})

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  form.id = undefined
  form.parentId = null
  form.bookId = ledgerStore.currentLedgerId || undefined
  form.name = ''
  form.code = ''
  form.icon = ''
  form.accountTypeEnum = undefined
  form.initialBalance = 0
  form.currencyCode = 'CNY'
  form.description = ''
  form.isArchived = false
  parentCode.value = ''
}

const open = (type: 'add' | 'edit' | 'addChild', row?: AccountRow) => {
  resetForm()
  if (type === 'add') {
    title.value = '新增账户'
  } else if (type === 'addChild' && row) {
    title.value = '新增子账户'
    form.parentId = row.id
    form.bookId = row.bookId || ledgerStore.currentLedgerId || undefined
    // 设置父账户代码前缀
    parentCode.value = row.code ? `${row.code}` : ''
    form.accountTypeEnum = row.accountTypeEnum
  } else if (type === 'edit' && row) {
    title.value = '编辑账户'
    // 仅复制需要的字段
    form.id = row.id
    form.parentId = row.parentId
    form.bookId = row.bookId || ledgerStore.currentLedgerId || undefined
    form.name = row.name
    // 编辑时如果存在父节点，尝试提取前缀（简单处理：如果是子账户，通常不建议修改前缀，这里暂不特殊处理前缀显示，直接显示完整code）
    // 或者为了体验一致，也可以尝试解析。这里简单起见，编辑时直接显示完整code，不使用前缀槽
    form.code = row.code
    form.icon = row.icon || ''
    form.accountTypeEnum = row.accountTypeEnum
    form.initialBalance = row.initialBalance
    form.currencyCode = row.currencyCode
    form.description = row.description
    form.isArchived = row.isArchived
  }
  visible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 提交前组合完整代码
        const submitData = { ...form }
        if (parentCode.value && !form.id) {
          submitData.code = parentCode.value + form.code
        }

        if (submitData.id) {
          await updateAccountApi(submitData)
          ElMessage.success('更新成功')
        } else {
          await addAccountApi(submitData)
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

defineExpose({
  open
})
</script>

<style scoped lang="scss">
.icon-field {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.icon-preview-box {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #c0c4cc;
  background: #f5f7fa;
  transition: all 0.2s;

  &.has-icon {
    border-color: #F59E0B;
    color: #F59E0B;
    background: #fffbeb;
  }
}

.icon-input {
  flex: 1;
}
</style>