<template>
  <div class="quick-tracker">
    <el-tabs v-model="activeTab" class="tracker-tabs" stretch>
      <!-- Tab 1: 支出 -->
      <el-tab-pane name="EXPENSE" label="支出">
        <div class="tab-content split-layout">
          <!-- 左侧：分类选择 (Flex 1) -->
          <div class="left-panel">
            <div class="section-header">
              <span class="label">选择分类</span>
              <span class="sub-label" v-if="expenseForm.categoryId">
                已选: {{ getAccountName(expenseForm.categoryId) }}
              </span>
            </div>
            
            <div v-if="expenseCategories.length === 0" class="empty-hint">
              暂无支出分类，请先在账户管理中创建
            </div>
            <div v-else class="category-scroll">
              <div v-if="recentExpenseCategories.length > 0" class="recent-section">
                <div class="section-title">常用分类</div>
                <div class="category-grid">
                  <div
                    v-for="cat in recentExpenseCategories"
                    :key="`recent-expense-${cat.id}`"
                    class="category-item"
                    :class="{ active: expenseForm.categoryId === cat.id }"
                    @click="handleCategorySelect(cat, 'EXPENSE')"
                  >
                    <div class="icon-wrapper">
                      <div class="cat-icon">
                        <ReIcon v-if="isIconifyIcon(cat.icon)" :icon="cat.icon!" />
                        <template v-else>{{ getIcon(cat.name, cat.icon) }}</template>
                      </div>
                    </div>
                    <div class="cat-name">{{ cat.name }}</div>
                  </div>
                </div>
              </div>

              <div class="group-section">
                <div class="section-title">分类组</div>
                <div class="group-selector">
                  <div
                    v-for="group in expenseCategories"
                    :key="`expense-group-${group.id}`"
                    class="group-pill"
                    :class="{ active: selectedExpenseGroupId === group.id }"
                    @click="selectedExpenseGroupId = group.id"
                  >
                    <ReIcon v-if="isIconifyIcon(group.icon)" :icon="group.icon!" class="group-pill-icon" />
                    <template v-else>{{ getIcon(group.name, group.icon) }}</template>
                    {{ group.name }}
                  </div>
                </div>
              </div>

              <div class="category-grid">
                <div
                  v-for="cat in selectedExpenseCategories"
                  :key="`expense-cat-${cat.id}`"
                  class="category-item"
                  :class="{ active: expenseForm.categoryId === cat.id }"
                  @click="handleCategorySelect(cat, 'EXPENSE')"
                >
                  <div class="icon-wrapper">
                    <div class="cat-icon">
                      <ReIcon v-if="isIconifyIcon(cat.icon)" :icon="cat.icon!" />
                      <template v-else>{{ getIcon(cat.name, cat.icon) }}</template>
                    </div>
                  </div>
                  <div class="cat-name">{{ cat.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：金额/账户/操作 (Fixed Width) -->
          <div class="right-panel">
            <!-- 1. 金额输入 -->
            <div class="panel-section">
              <!-- 普通模式 -->
              <div v-if="!splitMode" class="amount-card">
                <div class="currency-symbol">¥</div>
                <el-input
                  v-model="expenseForm.amount"
                  class="huge-input"
                  placeholder="0.00"
                  type="number"
                  :min="0"
                  @keyup.enter="handleExpenseSubmit"
                />
                <el-button 
                  class="split-btn" 
                  type="primary" 
                  link 
                  @click="toggleSplitMode"
                  title="拆分模式"
                >
                  <el-icon :size="20"><Operation /></el-icon>
                </el-button>
              </div>

              <!-- 拆分模式 -->
              <div v-else class="split-card">
                <div class="split-header">
                  <span class="split-title">拆分记账</span>
                  <div class="split-actions">
                    <span class="split-total">合计 ¥{{ splitTotal.toFixed(2) }}</span>
                    <el-button type="primary" link size="small" @click="addSplitItem">+ 添加</el-button>
                    <el-button type="info" link size="small" @click="toggleSplitMode">退出拆分</el-button>
                  </div>
                </div>
                <div class="split-list">
                  <div v-for="(item, idx) in splitItems" :key="idx" class="split-row">
                    <div class="split-category" :class="{ 'has-value': item.categoryId }">
                      {{ item.categoryId ? getAccountName(item.categoryId) : '点左侧选分类' }}
                    </div>
                    <div class="split-amount-wrap">
                      <span class="split-currency">¥</span>
                      <el-input
                        v-model="item.amount"
                        class="split-amount-input"
                        placeholder="0.00"
                        type="number"
                        :min="0"
                      />
                    </div>
                    <el-button
                      v-if="splitItems.length > 2"
                      type="danger"
                      link
                      size="small"
                      class="split-remove"
                      @click="removeSplitItem(idx)"
                    >✕</el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. 账户选择 -->
            <div class="panel-section flex-1">
              <div class="section-header">
                <span class="label">支付账户</span>
                <span class="sub-label" v-if="expenseForm.accountId">
                  已选: {{ getAccountName(expenseForm.accountId) }}
                </span>
              </div>
              <div v-if="assetAccounts.length === 0" class="empty-hint">
                暂无资产账户
              </div>
              <div v-else class="account-list-scroll">
                <div class="account-list">
                  <!-- 所有账户 -->
                  <div
                    v-for="acc in flattenedAssetAccounts"
                    :key="`asset-${acc.id}`"
                    class="account-card-mini"
                    :class="{ active: expenseForm.accountId === acc.id }"
                    @click="handleAccountSelect(acc, 'ASSET')"
                  >
                    <div class="acc-icon-box">
                      <ReIcon v-if="isIconifyIcon(acc.icon)" :icon="acc.icon!" />
                      <template v-else>{{ getIcon(acc.name, acc.icon) }}</template>
                    </div>
                    <div class="acc-info">
                      <div class="acc-name">{{ acc.name }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. 操作区 -->
            <div class="panel-section action-area">
              <el-date-picker
                v-model="expenseForm.date"
                type="date"
                placeholder="今天"
                class="full-width-date"
                :clearable="false"
                value-format="YYYY-MM-DD"
              />
              
              <!-- 标签选择 -->
              <div class="tag-selector">
                <div class="tag-selector-header">
                  <span class="tag-label">标签</span>
                  <div class="quick-add-tag">
                    <el-input
                      v-model="newTagName"
                      placeholder="新标签"
                      size="small"
                      class="new-tag-input"
                      @keyup.enter="handleQuickCreateTag('expense')"
                    />
                    <el-button
                      type="primary"
                      :icon="Plus"
                      size="small"
                      circle
                      :loading="creatingTag"
                      @click="handleQuickCreateTag('expense')"
                    />
                  </div>
                </div>
                <div class="tag-list">
                  <el-tag
                    v-for="tag in allTags"
                    :key="tag.id"
                    :color="expenseForm.tagIds.includes(tag.id as number) ? tag.color : undefined"
                    :effect="expenseForm.tagIds.includes(tag.id as number) ? 'dark' : 'plain'"
                    class="tag-item"
                    :class="{ active: expenseForm.tagIds.includes(tag.id as number) }"
                    @click="toggleTag(tag.id as number, 'expense')"
                  >
                    <ReIcon v-if="tag.icon" :icon="tag.icon" class="tag-icon" />
                    {{ tag.tagName }}
                  </el-tag>
                  <span v-if="allTags.length === 0" class="no-tags">暂无标签</span>
                </div>
              </div>

              <el-input 
                v-model="expenseForm.memo" 
                placeholder="添加备注..." 
                type="textarea"
                :rows="2"
                resize="none"
                class="memo-input"
              />
              <div class="btn-group">
                <el-button @click="handleCancel" class="cancel-btn">取消</el-button>
                <el-button type="primary" class="submit-btn" @click="handleExpenseSubmit" :loading="submitting">
                  完成
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 收入 -->
      <el-tab-pane name="INCOME" label="收入">
        <div class="tab-content split-layout">
          <!-- 左侧：分类选择 -->
          <div class="left-panel">
            <div class="section-header">
              <span class="label">选择来源</span>
              <span class="sub-label" v-if="incomeForm.categoryId">
                已选: {{ getAccountName(incomeForm.categoryId) }}
              </span>
            </div>
            
            <div v-if="incomeCategories.length === 0" class="empty-hint">
              暂无收入分类，请先在账户管理中创建
            </div>
            <div v-else class="category-scroll">
              <div v-if="recentIncomeCategories.length > 0" class="recent-section">
                <div class="section-title">常用分类</div>
                <div class="category-grid">
                  <div
                    v-for="cat in recentIncomeCategories"
                    :key="`recent-income-${cat.id}`"
                    class="category-item"
                    :class="{ active: incomeForm.categoryId === cat.id }"
                    @click="handleCategorySelect(cat, 'INCOME')"
                  >
                    <div class="icon-wrapper">
                      <div class="cat-icon">
                        <ReIcon v-if="isIconifyIcon(cat.icon)" :icon="cat.icon!" />
                        <template v-else>{{ getIcon(cat.name, cat.icon) }}</template>
                      </div>
                    </div>
                    <div class="cat-name">{{ cat.name }}</div>
                  </div>
                </div>
              </div>

              <div class="group-section">
                <div class="section-title">分类组</div>
                <div class="group-selector">
                  <div
                    v-for="group in incomeCategories"
                    :key="`income-group-${group.id}`"
                    class="group-pill"
                    :class="{ active: selectedIncomeGroupId === group.id }"
                    @click="selectedIncomeGroupId = group.id"
                  >
                    <ReIcon v-if="isIconifyIcon(group.icon)" :icon="group.icon!" class="group-pill-icon" />
                    <template v-else>{{ getIcon(group.name, group.icon) }}</template>
                    {{ group.name }}
                  </div>
                </div>
              </div>

              <div class="category-grid">
                <div
                  v-for="cat in selectedIncomeCategories"
                  :key="`income-cat-${cat.id}`"
                  class="category-item"
                  :class="{ active: incomeForm.categoryId === cat.id }"
                  @click="handleCategorySelect(cat, 'INCOME')"
                >
                  <div class="icon-wrapper">
                    <div class="cat-icon">
                      <ReIcon v-if="isIconifyIcon(cat.icon)" :icon="cat.icon!" />
                      <template v-else>{{ getIcon(cat.name, cat.icon) }}</template>
                    </div>
                  </div>
                  <div class="cat-name">{{ cat.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：金额/账户/操作 -->
          <div class="right-panel">
            <!-- 1. 金额输入 -->
            <div class="panel-section">
              <div class="amount-card income-mode">
                <div class="currency-symbol">¥</div>
                <el-input
                  v-model="incomeForm.amount"
                  class="huge-input"
                  placeholder="0.00"
                  type="number"
                  :min="0"
                />
              </div>
            </div>

            <!-- 2. 账户选择 -->
            <div class="panel-section flex-1">
              <div class="section-header">
                <span class="label">存入账户</span>
                <span class="sub-label" v-if="incomeForm.accountId">
                  已选: {{ getAccountName(incomeForm.accountId) }}
                </span>
              </div>
              <div class="account-list-scroll">
                <div class="account-list">
                  <div
                    v-for="acc in recentAssetAccounts"
                    :key="`recent-income-asset-${acc.id}`"
                    class="account-card-mini recent"
                    :class="{ active: incomeForm.accountId === acc.id }"
                    @click="handleAccountSelect(acc, 'ASSET')"
                  >
                    <div class="acc-icon-box"><el-icon><Star /></el-icon></div>
                    <div class="acc-name">{{ acc.name }}</div>
                  </div>

                  <div
                    v-for="acc in flattenedAssetAccounts"
                    :key="`income-asset-${acc.id}`"
                    class="account-card-mini"
                    :class="{ active: incomeForm.accountId === acc.id }"
                    @click="handleAccountSelect(acc, 'ASSET')"
                  >
                    <div class="acc-icon-box">
                      <ReIcon v-if="isIconifyIcon(acc.icon)" :icon="acc.icon!" />
                      <template v-else>{{ getIcon(acc.name, acc.icon) }}</template>
                    </div>
                    <div class="acc-name">{{ acc.name }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. 操作区 -->
            <div class="panel-section action-area">
              <el-date-picker
                v-model="incomeForm.date"
                type="date"
                placeholder="今天"
                class="full-width-date"
                :clearable="false"
                value-format="YYYY-MM-DD"
              />
              
              <!-- 标签选择 -->
              <div class="tag-selector">
                <div class="tag-selector-header">
                  <span class="tag-label">标签</span>
                  <div class="quick-add-tag">
                    <el-input
                      v-model="newTagName"
                      placeholder="新标签"
                      size="small"
                      class="new-tag-input"
                      @keyup.enter="handleQuickCreateTag('income')"
                    />
                    <el-button
                      type="primary"
                      :icon="Plus"
                      size="small"
                      circle
                      :loading="creatingTag"
                      @click="handleQuickCreateTag('income')"
                    />
                  </div>
                </div>
                <div class="tag-list">
                  <el-tag
                    v-for="tag in allTags"
                    :key="tag.id"
                    :color="incomeForm.tagIds.includes(tag.id as number) ? tag.color : undefined"
                    :effect="incomeForm.tagIds.includes(tag.id as number) ? 'dark' : 'plain'"
                    class="tag-item"
                    :class="{ active: incomeForm.tagIds.includes(tag.id as number) }"
                    @click="toggleTag(tag.id as number, 'income')"
                  >
                    <ReIcon v-if="tag.icon" :icon="tag.icon" class="tag-icon" />
                    {{ tag.tagName }}
                  </el-tag>
                  <span v-if="allTags.length === 0" class="no-tags">暂无标签</span>
                </div>
              </div>

              <el-input 
                v-model="incomeForm.memo" 
                placeholder="添加备注..." 
                type="textarea"
                :rows="2"
                resize="none"
                class="memo-input"
              />
              <div class="btn-group">
                <el-button @click="handleCancel" class="cancel-btn">取消</el-button>
                <el-button type="success" class="submit-btn" @click="handleIncomeSubmit" :loading="submitting">
                  完成
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 转账 -->
      <el-tab-pane name="TRANSFER" label="转账">
        <div class="tab-content transfer-content">
          <div class="transfer-form">
            <div class="form-row">
              <label>金额</label>
              <el-input
                v-model="transferForm.amount"
                class="large-input"
                placeholder="0.00"
                type="number"
                :min="0"
              >
                <template #prefix>¥</template>
              </el-input>
            </div>

            <div class="transfer-arrow">
              <el-icon><Bottom /></el-icon>
            </div>

            <div class="form-row">
              <label>转出账户 (Source)</label>
              <el-select v-model="transferForm.sourceId" placeholder="选择转出账户" class="full-width" size="large">
                <el-option
                  v-for="acc in assetAccounts"
                  :key="acc.id"
                  :label="acc.name"
                  :value="acc.id"
                >
                  <span style="float: left; display: flex; align-items: center; gap: 4px;">
                    <ReIcon v-if="isIconifyIcon(acc.icon)" :icon="acc.icon!" />
                    <template v-else>{{ getIcon(acc.name, acc.icon) }}</template>
                    {{ acc.name }}
                  </span>
                </el-option>
              </el-select>
            </div>

            <div class="form-row">
              <label>转入账户 (Target)</label>
              <el-select v-model="transferForm.targetId" placeholder="选择转入账户" class="full-width" size="large">
                <el-option
                  v-for="acc in assetAccounts"
                  :key="acc.id"
                  :label="acc.name"
                  :value="acc.id"
                >
                  <span style="float: left; display: flex; align-items: center; gap: 4px;">
                    <ReIcon v-if="isIconifyIcon(acc.icon)" :icon="acc.icon!" />
                    <template v-else>{{ getIcon(acc.name, acc.icon) }}</template>
                    {{ acc.name }}
                  </span>
                </el-option>
              </el-select>
            </div>

            <div class="form-row">
              <label>手续费 (选填)</label>
              <el-input
                v-model="transferForm.fee"
                placeholder="0.00"
                type="number"
                :min="0"
              >
                <template #prefix>¥</template>
              </el-input>
            </div>
            
            <div class="form-row">
              <label>日期</label>
              <el-date-picker
                v-model="transferForm.date"
                type="date"
                placeholder="今天"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </div>
          </div>

          <div class="action-bar static-bottom">
            <el-button class="submit-btn" style="flex: 1" @click="handleCancel">取消</el-button>
            <el-button type="primary" class="submit-btn" style="flex: 2" @click="handleTransferSubmit" :loading="submitting">
              确认转账
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { Operation, Bottom, Star, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getAccountListApi, type AccountRow } from '@/api/fin/account'
import { addTransactionWithEntriesApi, type TransactionDTO } from '@/api/fin/transaction'
import { getTagListApi, addTagApi, type TagRow } from '@/api/fin/tag'
import { ledgerStore } from '@/store/ledger'
import { useStorage } from '@vueuse/core'
import ReIcon from '@/components/ReIcon/index.vue'

const emit = defineEmits(['success', 'cancel'])

// --- 状态 ---
const activeTab = ref('EXPENSE')
const submitting = ref(false)
const allAccounts = ref<AccountRow[]>([])
const selectedExpenseGroupId = ref<string | number>('')
const selectedIncomeGroupId = ref<string | number>('')
const splitMode = ref(false)

// 标签相关状态
const allTags = ref<TagRow[]>([])
const newTagName = ref('')
const creatingTag = ref(false)

interface SplitItem {
  categoryId: string | number | undefined
  amount: string
}
const splitItems = ref<SplitItem[]>([
  { categoryId: undefined, amount: '' },
  { categoryId: undefined, amount: '' }
])

// --- 本地存储 (Recent) ---
// 存储 ID 列表: [1, 2, 3]
const recentExpenseIds = useStorage<number[]>('lifehub_recent_expense_cats', [])
const recentIncomeIds = useStorage<number[]>('lifehub_recent_income_cats', [])
const recentAssetIds = useStorage<number[]>('lifehub_recent_asset_accs', [])

// --- 表单数据 ---
const expenseForm = reactive({
  amount: '',
  categoryId: undefined as string | number | undefined,
  accountId: undefined as string | number | undefined,
  date: dayjs().format('YYYY-MM-DD'),
  memo: '',
  tagIds: [] as number[]
})

const incomeForm = reactive({
  amount: '',
  categoryId: undefined as string | number | undefined,
  accountId: undefined as string | number | undefined,
  date: dayjs().format('YYYY-MM-DD'),
  memo: '',
  tagIds: [] as number[]
})

const transferForm = reactive({
  amount: '',
  sourceId: undefined as string | number | undefined,
  targetId: undefined as string | number | undefined,
  fee: '',
  date: dayjs().format('YYYY-MM-DD')
})

const resetForms = () => {
  expenseForm.amount = ''
  expenseForm.memo = ''
  expenseForm.date = dayjs().format('YYYY-MM-DD')
  expenseForm.tagIds = []
  splitMode.value = false
  splitItems.value = [{ categoryId: undefined, amount: '' }, { categoryId: undefined, amount: '' }]
  // 账户和分类暂不重置，方便连续记账

  incomeForm.amount = ''
  incomeForm.memo = ''
  incomeForm.date = dayjs().format('YYYY-MM-DD')
  incomeForm.tagIds = []

  transferForm.amount = ''
  transferForm.fee = ''
  transferForm.date = dayjs().format('YYYY-MM-DD')
}

// 暴露 reset 方法供父组件调用
defineExpose({ resetForms })

const handleCancel = () => {
  emit('cancel')
}


// --- 计算属性 ---

// 扁平化账户列表（用于查找详情）
const flattenedAllAccounts = computed(() => flattenAccounts(allAccounts.value))

const normalizeTree = (data: AccountRow[]) => {
  const hasChildren = data.some(n => Array.isArray(n.children) && n.children.length > 0)
  if (hasChildren) return data

  const map = new Map<string | number, AccountRow>()
  data.forEach(n => map.set(n.id, { ...n, children: [] }))

  const roots: AccountRow[] = []
  map.forEach(n => {
    const pid = n.parentId
    if (pid === null || pid === undefined || pid === 0 || pid === '0') {
      roots.push(n)
      return
    }
    const p = map.get(pid)
    if (p) {
      p.children = p.children || []
      p.children.push(n)
    } else {
      roots.push(n)
    }
  })
  return roots
}

const isRootNode = (n: AccountRow) =>
  n.parentId === null || n.parentId === undefined || n.parentId === 0 || n.parentId === '0'

const getTypeEnum = (n: AccountRow) => {
  if (n.accountType) return n.accountType
  if (n.asset) return 'ASSET'
  if (n.expense) return 'EXPENSE'
  if (n.income) return 'INCOME'
  if (n.liability) return 'LIABILITY'
  if (n.equity) return 'EQUITY'
  if (n.accountTypeEnum) {
    const s = String(n.accountTypeEnum)
    if (s.includes('资产')) return 'ASSET'
    if (s.includes('支出')) return 'EXPENSE'
    if (s.includes('收入')) return 'INCOME'
    if (s.includes('负债')) return 'LIABILITY'
    if (s.includes('权益')) return 'EQUITY'
    return n.accountTypeEnum
  }
  return undefined
}

const findTypeRoot = (typeEnum: 'EXPENSE' | 'INCOME' | 'ASSET') => {
  return flattenedAllAccounts.value.find(a => getTypeEnum(a) === typeEnum && isRootNode(a))
}

const buildCategoryGroups = (typeEnum: 'EXPENSE' | 'INCOME') => {
  const flat = flattenedAllAccounts.value
  const typeRoot = findTypeRoot(typeEnum)
  const typeRootId = typeRoot?.id

  const leafNodes = flat.filter(n => getTypeEnum(n) === typeEnum && (!n.children || n.children.length === 0))
  const groupsMap = new Map<number | string, { id: number | string, name: string, children: AccountRow[] }>()

  leafNodes.forEach(leaf => {
    let groupKey: number | string = 'other'
    let groupName = '其他'
    const parent = leaf.parentId ? flat.find(n => n.id === leaf.parentId) : undefined

    if (typeRootId && leaf.parentId === typeRootId) {
      groupKey = 'other'
      groupName = '其他'
    } else if (parent) {
      groupKey = parent.id
      groupName = parent.name
    }

    const group = groupsMap.get(groupKey) || { id: groupKey, name: groupName, children: [] }
    group.children.push(leaf)
    groupsMap.set(groupKey, group)
  })

  const groups = Array.from(groupsMap.values())
    .filter(g => g.children.length > 0)
    .map(g => ({
      id: g.id as any,
      name: g.name,
      children: g.children
    })) as unknown as AccountRow[]

  groups.sort((a: any, b: any) => {
    if (a.id === 'other') return 1
    if (b.id === 'other') return -1
    return String(a.name).localeCompare(String(b.name), 'zh-CN')
  })
  return groups
}

const expenseCategories = computed(() => buildCategoryGroups('EXPENSE'))
const incomeCategories = computed(() => buildCategoryGroups('INCOME'))

// 资产账户（扁平化，用于底部滚动选择）
// 这里其实也可以做分组，但底部空间有限，保持扁平化 + 常用置顶比较好
const flattenedAssetAccounts = computed(() => {
  const flat = flattenedAllAccounts.value
  return flat.filter(a =>
    getTypeEnum(a) === 'ASSET' &&
    (!a.children || a.children.length === 0)
  )
})

const assetAccounts = computed(() => flattenedAssetAccounts.value)

// --- 常用数据计算 ---
const recentExpenseCategories = computed(() => {
  return recentExpenseIds.value
    .map(id => flattenedAllAccounts.value.find(a => a.id === id))
    .filter(Boolean) as AccountRow[]
})

const recentIncomeCategories = computed(() => {
  return recentIncomeIds.value
    .map(id => flattenedAllAccounts.value.find(a => a.id === id))
    .filter(Boolean) as AccountRow[]
})

const recentAssetAccounts = computed(() => {
  return recentAssetIds.value
    .map(id => flattenedAllAccounts.value.find(a => a.id === id))
    .filter(Boolean) as AccountRow[]
})

const selectedExpenseCategories = computed(() => {
  const groups = expenseCategories.value
  if (groups.length === 0) return []
  const group = groups.find(g => g.id === selectedExpenseGroupId.value) || groups[0]
  return group.children || []
})

const selectedIncomeCategories = computed(() => {
  const groups = incomeCategories.value
  if (groups.length === 0) return []
  const group = groups.find(g => g.id === selectedIncomeGroupId.value) || groups[0]
  return group.children || []
})

watch(expenseCategories, (groups) => {
  if (groups.length === 0) {
    selectedExpenseGroupId.value = ''
    return
  }
  if (!groups.some(g => g.id === selectedExpenseGroupId.value)) {
    selectedExpenseGroupId.value = groups[0].id
  }
}, { immediate: true })

watch(incomeCategories, (groups) => {
  if (groups.length === 0) {
    selectedIncomeGroupId.value = ''
    return
  }
  if (!groups.some(g => g.id === selectedIncomeGroupId.value)) {
    // 优先选"主动收入"分组
    const preferred = groups.find(g => g.name.includes('主动'))
    selectedIncomeGroupId.value = (preferred || groups[0]).id
  }
}, { immediate: true })

// --- 辅助函数 ---
const updateRecent = (id: number, type: 'EXPENSE' | 'INCOME' | 'ASSET') => {
  const list = type === 'EXPENSE' ? recentExpenseIds 
             : type === 'INCOME' ? recentIncomeIds 
             : recentAssetIds
  
  // 移除旧的，添加到头部
  const idx = list.value.indexOf(id)
  if (idx > -1) list.value.splice(idx, 1)
  list.value.unshift(id)
  
  // 最多保留 3 个
  if (list.value.length > 3) list.value.pop()
}

const handleCategorySelect = (cat: AccountRow, type: 'EXPENSE' | 'INCOME') => {
  if (type === 'EXPENSE') {
    if (splitMode.value) {
      handleSplitCategorySelect(cat)
    } else {
      expenseForm.categoryId = cat.id
      updateRecent(cat.id as number, 'EXPENSE')
    }
  } else {
    incomeForm.categoryId = cat.id
    updateRecent(cat.id as number, 'INCOME')
  }
}

const handleAccountSelect = (acc: AccountRow, type: 'ASSET') => {
  if (type === 'ASSET') {
    // 同时更新两个表单的账户选择，保持同步体验
    expenseForm.accountId = acc.id
    incomeForm.accountId = acc.id
    updateRecent(acc.id, 'ASSET')
  }
}

const iconMap: Record<string, string> = {
  '餐饮': '🍔', '吃饭': '🍚', '美食': '🍜', '外卖': '🥡',
  '交通': '🚗', '打车': '🚕', '公交': '🚌', '地铁': '🚇', '加油': '⛽',
  '购物': '🛍️', '超市': '🛒', '服饰': '👕', '衣服': '👗',
  '日用': '🧻', '生活': '🧴',
  '娱乐': '🎮', '电影': '🎬', '游戏': '🕹️',
  '医疗': '💊', '医院': '🏥', '药': '💊',
  '住房': '🏠', '房租': '🔑', '水电': '💡',
  '工资': '💰', '薪水': '💴',
  '奖金': '🏆', '红包': '🧧',
  '理财': '📈', '股票': '📊', '基金': '📉',
  '利息': '💹',
  '转账': '💸', '还款': '💳',
  '微信': '💚', '支付宝': '💙', '银行': '🏦', '现金': '💵'
}

const getIcon = (name: string, icon?: string) => {
  // 0. 优先使用后端返回的 icon 字段（如果是 Iconify 编码则由模板用 ReIcon 渲染）
  if (icon) return icon

  if (!name) return '📝'
  
  // 1. 尝试直接提取 Emoji
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const match = name.match(emojiRegex);
  if (match) return match[0];

  // 2. 关键词匹配
  for (const key in iconMap) {
    if (name.includes(key)) return iconMap[key]
  }

  // 3. 取首字
  return name.charAt(0)
}

// 判断是否为 Iconify 图标编码（包含 : 或 /，如 mdi:cash, fa-solid/home）
const isIconifyIcon = (icon?: string) => {
  return !!icon && (icon.includes(':') || icon.includes('/'))
}

// 排序函数：优先 sort 字段 (升序)，其次按 id (升序)
// 使用 function 声明以确保提升，避免 flattenAccounts 调用时 TDZ 报错
function sortAccounts(list: AccountRow[]) {
  return list.sort((a, b) => {
    const sortA = a.sort ?? 9999
    const sortB = b.sort ?? 9999
    if (sortA !== sortB) return sortA - sortB
    return String(a.id).localeCompare(String(b.id))
  })
}

function flattenAccounts(nodes: AccountRow[], result: AccountRow[] = []) {
  // 先对当前层级进行排序
  const sortedNodes = sortAccounts([...nodes])
  
  sortedNodes.forEach(node => {
    result.push(node)
    if (node.children && node.children.length > 0) {
      flattenAccounts(node.children, result)
    }
  })
  return result
}

// --- 数据加载 ---
const loadAccounts = async () => {
  if (!ledgerStore.currentLedgerId) {
    return
  }
  try {
    const res = await getAccountListApi(ledgerStore.currentLedgerId)
    if (res.data) {
      allAccounts.value = normalizeTree(res.data)

      // 恢复上次使用的账户 (这里简单 mock，取第一个)
      if (flattenedAssetAccounts.value.length > 0) {
        if (!expenseForm.accountId) expenseForm.accountId = flattenedAssetAccounts.value[0].id
        if (!incomeForm.accountId) incomeForm.accountId = flattenedAssetAccounts.value[0].id
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const loadTags = async () => {
  try {
    const res = await getTagListApi()
    if (res.data) {
      allTags.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

// 快速创建标签
const handleQuickCreateTag = async (formType: 'expense' | 'income') => {
  const name = newTagName.value.trim()
  if (!name) return
  
  creatingTag.value = true
  try {
    await addTagApi({ tagName: name, color: getRandomColor() })
    ElMessage.success('标签创建成功')
    newTagName.value = ''
    await loadTags()
    // 自动选中新创建的标签
    const newTag = allTags.value.find(t => t.tagName === name)
    if (newTag && newTag.id) {
      if (formType === 'expense') {
        expenseForm.tagIds.push(newTag.id as number)
      } else {
        incomeForm.tagIds.push(newTag.id as number)
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    creatingTag.value = false
  }
}

const getRandomColor = () => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  return colors[Math.floor(Math.random() * colors.length)]
}

const toggleTag = (tagId: number, formType: 'expense' | 'income') => {
  const form = formType === 'expense' ? expenseForm : incomeForm
  const idx = form.tagIds.indexOf(tagId)
  if (idx > -1) {
    form.tagIds.splice(idx, 1)
  } else {
    form.tagIds.push(tagId)
  }
}

watch(() => ledgerStore.currentLedgerId, loadAccounts)
onMounted(() => {
  loadAccounts()
  loadTags()
})

// --- 提交逻辑 ---

const toggleSplitMode = () => {
  splitMode.value = !splitMode.value
  if (splitMode.value) {
    // 进入拆分模式时，如果已选了分类和金额，把它作为第一项
    const items: SplitItem[] = []
    if (expenseForm.categoryId && expenseForm.amount) {
      items.push({ categoryId: expenseForm.categoryId, amount: expenseForm.amount })
      items.push({ categoryId: undefined, amount: '' })
    } else {
      items.push({ categoryId: undefined, amount: '' }, { categoryId: undefined, amount: '' })
    }
    splitItems.value = items
    expenseForm.amount = ''
    expenseForm.categoryId = undefined
  } else {
    // 退出拆分模式，如果只有一项有值就回填
    const filled = splitItems.value.filter(i => i.categoryId && i.amount)
    if (filled.length === 1) {
      expenseForm.categoryId = filled[0].categoryId
      expenseForm.amount = filled[0].amount
    }
    splitItems.value = [{ categoryId: undefined, amount: '' }, { categoryId: undefined, amount: '' }]
  }
}

const addSplitItem = () => {
  splitItems.value.push({ categoryId: undefined, amount: '' })
}

const removeSplitItem = (index: number) => {
  if (splitItems.value.length > 2) {
    splitItems.value.splice(index, 1)
  }
}

const splitTotal = computed(() => {
  return splitItems.value.reduce((sum, item) => {
    const val = parseFloat(item.amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
})

// 拆分模式下点击分类时，自动填入第一个空的拆分项
const handleSplitCategorySelect = (cat: AccountRow) => {
  const emptyItem = splitItems.value.find(i => !i.categoryId)
  if (emptyItem) {
    emptyItem.categoryId = cat.id
  }
  updateRecent(cat.id as number, 'EXPENSE')
}

// 支出提交
const handleExpenseSubmit = async () => {
  if (!expenseForm.accountId) return ElMessage.warning('请选择支付账户')

  if (splitMode.value) {
    // 拆分模式提交
    const validItems = splitItems.value.filter(i => i.categoryId && i.amount && parseFloat(i.amount) > 0)
    if (validItems.length === 0) return ElMessage.warning('请至少填写一项拆分')
    
    const totalAmount = validItems.reduce((sum, i) => sum + parseFloat(i.amount), 0)
    const entries: any[] = validItems.map(item => ({
      accountId: item.categoryId,
      direction: 'DEBIT',
      amount: parseFloat(item.amount)
    }))
    entries.push({
      accountId: expenseForm.accountId,
      direction: 'CREDIT',
      amount: totalAmount
    })

    const categoryNames = validItems.map(i => getAccountName(i.categoryId)).join('+')
    const dto: TransactionDTO = {
      bookId: ledgerStore.currentLedgerId,
      transDate: dayjs(expenseForm.date).format('YYYY-MM-DD HH:mm:ss'),
      description: expenseForm.memo || `${categoryNames} 支出`,
      entries,
      tagIds: expenseForm.tagIds.length > 0 ? expenseForm.tagIds : undefined
    }

    await submitTransaction(dto, () => {
      expenseForm.memo = ''
      expenseForm.tagIds = []
      splitItems.value = [{ categoryId: undefined, amount: '' }, { categoryId: undefined, amount: '' }]
    })
  } else {
    // 普通模式提交
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return ElMessage.warning('请输入有效金额')
    if (!expenseForm.categoryId) return ElMessage.warning('请选择支出分类')

    const dto: TransactionDTO = {
      bookId: ledgerStore.currentLedgerId,
      transDate: dayjs(expenseForm.date).format('YYYY-MM-DD HH:mm:ss'),
      description: expenseForm.memo || `${getAccountName(expenseForm.categoryId)} 支出`,
      entries: [
        {
          accountId: expenseForm.categoryId,
          direction: 'DEBIT',
          amount: parseFloat(expenseForm.amount)
        },
        {
          accountId: expenseForm.accountId,
          direction: 'CREDIT',
          amount: parseFloat(expenseForm.amount)
        }
      ],
      tagIds: expenseForm.tagIds.length > 0 ? expenseForm.tagIds : undefined
    }

    await submitTransaction(dto, () => {
      expenseForm.amount = ''
      expenseForm.memo = ''
      expenseForm.tagIds = []
    })
  }
}

// 收入提交
const handleIncomeSubmit = async () => {
  if (!incomeForm.amount || parseFloat(incomeForm.amount) <= 0) return ElMessage.warning('请输入有效金额')
  if (!incomeForm.categoryId) return ElMessage.warning('请选择收入来源')
  if (!incomeForm.accountId) return ElMessage.warning('请选择存入账户')

  const dto: TransactionDTO = {
    bookId: ledgerStore.currentLedgerId,
    transDate: dayjs(incomeForm.date).format('YYYY-MM-DD HH:mm:ss'),
    description: incomeForm.memo || `${getAccountName(incomeForm.categoryId)} 收入`,
    entries: [
      { // 借：资产 (增加)
        accountId: incomeForm.accountId,
        direction: 'DEBIT',
        amount: parseFloat(incomeForm.amount)
      },
      { // 贷：收入 (增加)
        accountId: incomeForm.categoryId,
        direction: 'CREDIT',
        amount: parseFloat(incomeForm.amount)
      }
    ],
    tagIds: incomeForm.tagIds.length > 0 ? incomeForm.tagIds : undefined
  }

  await submitTransaction(dto, () => {
    incomeForm.amount = ''
    incomeForm.memo = ''
    incomeForm.tagIds = []
  })
}

// 转账提交
const handleTransferSubmit = async () => {
  if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) return ElMessage.warning('请输入有效金额')
  if (!transferForm.sourceId) return ElMessage.warning('请选择转出账户')
  if (!transferForm.targetId) return ElMessage.warning('请选择转入账户')
  if (transferForm.sourceId === transferForm.targetId) return ElMessage.warning('转出转入账户不能相同')

  const amount = parseFloat(transferForm.amount)
  const fee = transferForm.fee ? parseFloat(transferForm.fee) : 0
  const date = dayjs(transferForm.date).format('YYYY-MM-DD HH:mm:ss')
  
  const entries = [
    { // 贷：转出账户 (减少) - 含手续费？通常转出总额 = 到账 + 手续费，或者 手续费单独扣
      // 这里简化模型：转出账户扣除 (amount + fee)，转入账户增加 amount，手续费记为支出
      accountId: transferForm.sourceId,
      direction: 'CREDIT',
      amount: amount + fee
    },
    { // 借：转入账户 (增加)
      accountId: transferForm.targetId,
      direction: 'DEBIT',
      amount: amount
    }
  ]

  if (fee > 0) {
    // 还需要一个手续费支出科目，这里暂时没有默认的，先忽略或提示用户
    // 为了健壮性，这里暂时把手续费加到转出里，但借方不平衡。
    // 实际上应该让用户选手续费科目。这里暂且假设手续费直接从转出账户扣除，且没有对应的支出科目（这会导致不平衡）。
    // 修正：简单起见，转账暂不支持手续费记账，或者自动找一个 '手续费' 科目。
    // 为避免报错，暂时只支持无手续费转账，或者把手续费忽略。
    // 如果必须支持，需要查找一个 EXPENSE 类型的科目。
    const feeAccount = flattenedAllAccounts.value.find(c =>
      getTypeEnum(c) === 'EXPENSE' && (c.name.includes('手续费') || c.name.includes('服务费'))
    )
    if (feeAccount) {
        entries.push({
            accountId: feeAccount.id,
            direction: 'DEBIT',
            amount: fee
        })
    } else {
        // 如果找不到手续费科目，就警告一下，或者归到“其他支出”？
        // 暂时不支持自动记手续费科目，让用户在备注说明
        ElMessage.warning('未找到“手续费”科目，请手动添加或在描述中备注')
        // 为保持平衡，把手续费去掉
        entries[0].amount = amount
    }
  }

  const dto: TransactionDTO = {
    bookId: ledgerStore.currentLedgerId,
    transDate: date,
    description: `转账: ${getAccountName(transferForm.sourceId)} -> ${getAccountName(transferForm.targetId)}`,
    entries: entries as any
  }

  await submitTransaction(dto, () => {
    transferForm.amount = ''
    transferForm.fee = ''
  })
}

const submitTransaction = async (dto: TransactionDTO, onSuccess: () => void) => {
  submitting.value = true
  try {
    await addTransactionWithEntriesApi(dto)
    ElMessage.success('记账成功')
    onSuccess()
    emit('success')
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const getAccountName = (id?: string | number) => {
  if (!id) return ''
  return flattenedAllAccounts.value.find(a => a.id === id)?.name || ''
}

</script>

<style scoped lang="scss">
.quick-tracker {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tracker-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
  }
}

.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;

  &.split-layout {
    flex-direction: row;
    padding: 0; // 分栏模式下不需要外层 padding
  }
}

// 左侧面板
.left-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f5f9;
  background: #fff;
  padding: 16px;
  height: 100%;
  overflow: hidden;
}

// 右侧面板
.right-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  padding: 16px;
  height: 100%;
  overflow: hidden;
  gap: 12px;
}

.panel-section {
  display: flex;
  flex-direction: column;
  
  &.flex-1 {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  &.action-area {
    flex-shrink: 0;
    gap: 8px;
    background: #fff;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
}

// Section Header
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 4px;

  .label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .sub-label {
    font-size: 11px;
    color: #3b82f6;
    background: #eff6ff;
    padding: 2px 6px;
    border-radius: 4px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin: 12px 4px 8px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// 金额卡片
.amount-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  padding: 8px 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);

  &:focus-within {
    background: #fff;
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  }

  &.income-mode {
    &:focus-within {
      border-color: #10b981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
    }
    .currency-symbol { color: #10b981; }
    :deep(.el-input__inner) { color: #10b981; }
  }

  .currency-symbol {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin-right: 8px;
  }

  .huge-input {
    flex: 1;
    font-size: 28px;
    font-weight: 800;

    :deep(.el-input__wrapper) {
      box-shadow: none;
      padding: 0;
      padding-right: 32px;
      background: transparent;
    }

    :deep(.el-input__inner) {
      height: 40px;
      line-height: 40px;
      text-align: left;
      color: #1e293b;
      font-family: monospace;

      // 隐藏 number 输入框自带的上下箭头
      -moz-appearance: textfield;
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }
  }

  .split-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
    
    &:hover { opacity: 1; }
  }
}

// 拆分模式卡片
.split-card {
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);

  .split-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;

    .split-title {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }

    .split-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .split-total {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      font-family: monospace;
    }
  }

  .split-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 160px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .split-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    transition: border-color 0.2s;

    &:focus-within {
      border-color: #3b82f6;
    }
  }

  .split-category {
    flex: 1;
    font-size: 12px;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;

    &.has-value {
      color: #334155;
      font-weight: 500;
    }
  }

  .split-amount-wrap {
    display: flex;
    align-items: center;
    gap: 2px;
    width: 110px;
    flex-shrink: 0;

    .split-currency {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
    }
  }

  .split-amount-input {
    :deep(.el-input__wrapper) {
      box-shadow: none;
      padding: 0 4px;
      background: transparent;
    }
    :deep(.el-input__inner) {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      font-family: monospace;
      text-align: right;
    }
  }

  .split-remove {
    flex-shrink: 0;
    font-size: 12px;
    padding: 2px;
  }
}

// 分类 Grid
.category-grid-wrapper {
  // 兼容旧代码，但在新布局中不再作为主要容器名，保留以防万一
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 8px;
}

.category-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 4px;
  
  // 隐藏滚动条但保持功能
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
  }
}

.recent-section {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.group-section {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.group-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 2px;
}

.group-pill {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f1f5f9;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #e2e8f0;
  }

  &.active {
    background: #3b82f6;
    color: #fff;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
  padding: 4px;

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 8px 4px;
    border-radius: 12px;
    transition: all 0.2s;
    position: relative;

    &:hover {
      background-color: #f8fafc;
      transform: translateY(-2px);
    }

    &.active {
      .icon-wrapper {
        background: #3b82f6;
        color: #fff;
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.25);
      }
      .cat-name { 
        color: #1e293b; 
        font-weight: 600; 
      }
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      .cat-icon {
        font-size: 24px;
        line-height: 1;
      }
    }

    .cat-name {
      font-size: 12px;
      color: #64748b;
      text-align: center;
      width: 100%;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      word-break: break-word;
    }
  }
}

// 账户列表 (右侧)
.account-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;
  
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-card-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
    transform: translateX(2px);
  }

  &.recent {
    background: #fffbeb;
    border-color: #fef3c7;
    
    &.active {
      background: #f59e0b;
      border-color: #f59e0b;
      .acc-name, .acc-type { color: #fff; }
      .acc-icon-box { background: rgba(255,255,255,0.2); color: #fff; }
    }
  }

  &.active:not(.recent) {
    background: #1e293b;
    border-color: #1e293b;
    .acc-name { color: #fff; }
    .acc-icon-box { background: rgba(255,255,255,0.2); color: #fff; }
  }

  .acc-icon-box {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .acc-info {
    flex: 1;
    min-width: 0;
    
    .acc-name {
      font-size: 13px;
      font-weight: 500;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .acc-type {
      font-size: 10px;
      color: #94a3b8;
    }
  }
}

// 底部操作区
.action-area {
  .full-width-date {
    width: 100% !important;
    margin-bottom: 0;
    
    :deep(.el-input__wrapper) {
      box-shadow: none;
      background: #f1f5f9;
    }
  }

  // 标签选择器
  .tag-selector {
    .tag-selector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .tag-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .quick-add-tag {
        display: flex;
        align-items: center;
        gap: 4px;

        .new-tag-input {
          width: 80px;
          
          :deep(.el-input__wrapper) {
            box-shadow: none;
            background: #f1f5f9;
            padding: 0 8px;
          }
        }
      }
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 60px;
      overflow-y: auto;
      padding: 2px;

      .tag-item {
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 12px;
        font-size: 12px;

        &:hover {
          transform: scale(1.05);
        }

        &.active {
          color: #fff;
          border-color: transparent;
        }

        .tag-icon {
          margin-right: 2px;
          font-size: 12px;
        }
      }

      .no-tags {
        font-size: 12px;
        color: #94a3b8;
      }
    }
  }

  .memo-input {
    :deep(.el-textarea__inner) {
      box-shadow: none;
      background: #f1f5f9;
      padding: 8px;
      font-size: 13px;
      
      &:focus {
        background: #fff;
        box-shadow: 0 0 0 1px #3b82f6;
      }
    }
  }

  .btn-group {
    display: flex;
    gap: 10px;
    margin-top: 4px;
    
    .cancel-btn {
      flex: 1;
    }
    
    .submit-btn {
      flex: 2;
    }
  }
}

// 兼容转账页的旧样式（如果需要）
.transfer-content {
  // ...
}

// 转账页样式
.transfer-content {
  justify-content: flex-start;

  .transfer-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 400px;
    margin: 0 auto;
    width: 100%;
    padding-top: 20px;

    .form-row {
      label {
        display: block;
        margin-bottom: 6px;
        color: #64748b;
        font-size: 13px;
      }
    }

    .transfer-arrow {
      display: flex;
      justify-content: center;
      color: #94a3b8;
      font-size: 20px;
    }

    .large-input {
      :deep(.el-input__inner) {
        height: 40px;
        font-size: 16px;
      }
    }

    .full-width { width: 100%; }
  }

  .static-bottom {
    margin-top: auto;
  }
}
</style>
