<template>
  <div class="quick-tracker">
    <el-tabs v-model="activeTab" class="tracker-tabs" stretch>
      <!-- Tab 1: 支出 -->
      <el-tab-pane name="EXPENSE" label="支出">
        <div class="tab-content">
          <!-- 1. 金额输入 (超大) -->
          <div class="amount-section">
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

          <!-- 2. 分类选择 (Grid) - Target -->
          <div class="category-grid-wrapper">
            <div class="section-label">去向 (分类)</div>
            <div v-if="expenseCategories.length === 0" class="empty-hint">
              暂无支出分类，请先在账户管理中创建
            </div>
            <div v-else class="category-scroll">
              <div v-if="recentExpenseCategories.length > 0" class="recent-section">
                <div class="recent-title">
                  <el-icon><Star /></el-icon>
                  常用
                </div>
                <div class="category-grid">
                  <div
                    v-for="cat in recentExpenseCategories"
                    :key="`recent-expense-${cat.id}`"
                    class="category-item"
                    :class="{ active: expenseForm.categoryId === cat.id }"
                    @click="handleCategorySelect(cat, 'EXPENSE')"
                  >
                    <div class="cat-icon">{{ getIcon(cat.name) }}</div>
                    <div class="cat-name">{{ cat.name }}</div>
                  </div>
                </div>
              </div>

              <div class="group-selector">
                <div
                  v-for="group in expenseCategories"
                  :key="`expense-group-${group.id}`"
                  class="group-pill"
                  :class="{ active: selectedExpenseGroupId === group.id }"
                  @click="selectedExpenseGroupId = group.id"
                >
                  {{ getIcon(group.name) }} {{ group.name }}
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
                  <div class="cat-icon">{{ getIcon(cat.name) }}</div>
                  <div class="cat-name">{{ cat.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 账户选择 (Bottom Bar) - Source -->
          <div class="account-bar-wrapper">
            <div class="section-label">来源 (账户)</div>
            <div v-if="assetAccounts.length === 0" class="empty-hint">
              暂无资产账户，请先在账户管理中创建
            </div>
            <div v-else class="account-grid-scroll">
              <div v-if="recentAssetAccounts.length > 0" class="recent-title">
                <el-icon><Star /></el-icon>
                常用
              </div>
              <div class="account-grid">
                <div
                  v-for="acc in recentAssetAccounts"
                  :key="`recent-asset-${acc.id}`"
                  class="account-card recent"
                  :class="{ active: expenseForm.accountId === acc.id }"
                  @click="handleAccountSelect(acc, 'ASSET')"
                >
                  <div class="acc-icon"><el-icon><Star /></el-icon></div>
                  <div class="acc-name">{{ acc.name }}</div>
                </div>

                <div
                  v-for="acc in flattenedAssetAccounts"
                  :key="`asset-${acc.id}`"
                  class="account-card"
                  :class="{ active: expenseForm.accountId === acc.id }"
                  @click="handleAccountSelect(acc, 'ASSET')"
                >
                  <div class="acc-icon">{{ getIcon(acc.name) }}</div>
                  <div class="acc-name">{{ acc.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="action-bar">
            <el-date-picker
              v-model="expenseForm.date"
              type="date"
              placeholder="今天"
              size="small"
              class="date-picker"
              :clearable="false"
              value-format="YYYY-MM-DD"
            />
            <el-input 
              v-model="expenseForm.memo" 
              placeholder="备注..." 
              size="small" 
              class="memo-input"
            />
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" class="submit-btn" @click="handleExpenseSubmit" :loading="submitting">
              完成
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 收入 -->
      <el-tab-pane name="INCOME" label="收入">
        <div class="tab-content">
          <!-- 1. 金额输入 -->
          <div class="amount-section income-theme">
            <div class="currency-symbol">¥</div>
            <el-input
              v-model="incomeForm.amount"
              class="huge-input"
              placeholder="0.00"
              type="number"
              :min="0"
            />
          </div>

          <!-- 2. 来源选择 (Grid) - Source (收入类别) -->
          <div class="category-grid-wrapper">
            <div class="section-label">来源 (收入)</div>
            <div v-if="incomeCategories.length === 0" class="empty-hint">
              暂无收入分类，请先在账户管理中创建
            </div>
            <div v-else class="category-scroll">
              <div v-if="recentIncomeCategories.length > 0" class="recent-section">
                <div class="recent-title">
                  <el-icon><Star /></el-icon>
                  常用
                </div>
                <div class="category-grid">
                  <div
                    v-for="cat in recentIncomeCategories"
                    :key="`recent-income-${cat.id}`"
                    class="category-item"
                    :class="{ active: incomeForm.categoryId === cat.id }"
                    @click="handleCategorySelect(cat, 'INCOME')"
                  >
                    <div class="cat-icon">{{ getIcon(cat.name) }}</div>
                    <div class="cat-name">{{ cat.name }}</div>
                  </div>
                </div>
              </div>

              <div class="group-selector">
                <div
                  v-for="group in incomeCategories"
                  :key="`income-group-${group.id}`"
                  class="group-pill"
                  :class="{ active: selectedIncomeGroupId === group.id }"
                  @click="selectedIncomeGroupId = group.id"
                >
                  {{ getIcon(group.name) }} {{ group.name }}
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
                  <div class="cat-icon">{{ getIcon(cat.name) }}</div>
                  <div class="cat-name">{{ cat.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 账户选择 (Bottom Bar) - Target (存入账户) -->
          <div class="account-bar-wrapper">
            <div class="section-label">存入 (账户)</div>
            <div class="account-grid-scroll">
              <div v-if="recentAssetAccounts.length > 0" class="recent-title">
                <el-icon><Star /></el-icon>
                常用
              </div>
              <div class="account-grid">
                <div
                  v-for="acc in recentAssetAccounts"
                  :key="`recent-income-asset-${acc.id}`"
                  class="account-card recent"
                  :class="{ active: incomeForm.accountId === acc.id }"
                  @click="handleAccountSelect(acc, 'ASSET')"
                >
                  <div class="acc-icon"><el-icon><Star /></el-icon></div>
                  <div class="acc-name">{{ acc.name }}</div>
                </div>

                <div
                  v-for="acc in flattenedAssetAccounts"
                  :key="`income-asset-${acc.id}`"
                  class="account-card"
                  :class="{ active: incomeForm.accountId === acc.id }"
                  @click="handleAccountSelect(acc, 'ASSET')"
                >
                  <div class="acc-icon">{{ getIcon(acc.name) }}</div>
                  <div class="acc-name">{{ acc.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="action-bar">
            <el-date-picker
              v-model="incomeForm.date"
              type="date"
              placeholder="今天"
              size="small"
              class="date-picker"
              :clearable="false"
              value-format="YYYY-MM-DD"
            />
            <el-input 
              v-model="incomeForm.memo" 
              placeholder="备注..." 
              size="small" 
              class="memo-input"
            />
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="success" class="submit-btn" @click="handleIncomeSubmit" :loading="submitting">
              完成
            </el-button>
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
                  <span style="float: left">{{ getIcon(acc.name) }} {{ acc.name }}</span>
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
                  <span style="float: left">{{ getIcon(acc.name) }} {{ acc.name }}</span>
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
import { Operation, Bottom, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getAccountListApi, type AccountRow } from '@/api/fin/account'
import { addTransactionApi, type TransactionDTO } from '@/api/fin/transaction'
import { ledgerStore } from '@/store/ledger'
import { useStorage } from '@vueuse/core'

const emit = defineEmits(['success', 'cancel'])

// --- 状态 ---
const activeTab = ref('EXPENSE')
const submitting = ref(false)
const allAccounts = ref<AccountRow[]>([])
const selectedExpenseGroupId = ref<string | number>('')
const selectedIncomeGroupId = ref<string | number>('')

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
  memo: ''
})

const incomeForm = reactive({
  amount: '',
  categoryId: undefined as string | number | undefined,
  accountId: undefined as string | number | undefined,
  date: dayjs().format('YYYY-MM-DD'),
  memo: ''
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
  // 账户和分类暂不重置，方便连续记账

  incomeForm.amount = ''
  incomeForm.memo = ''
  incomeForm.date = dayjs().format('YYYY-MM-DD')

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
    selectedIncomeGroupId.value = groups[0].id
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
  
  // 最多保留 5 个
  if (list.value.length > 5) list.value.pop()
}

const handleCategorySelect = (cat: AccountRow, type: 'EXPENSE' | 'INCOME') => {
  if (type === 'EXPENSE') {
    expenseForm.categoryId = cat.id
    updateRecent(cat.id, 'EXPENSE')
  } else {
    incomeForm.categoryId = cat.id
    updateRecent(cat.id, 'INCOME')
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

const getIcon = (name: string) => {
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

function flattenAccounts(nodes: AccountRow[], result: AccountRow[] = []) {
  nodes.forEach(node => {
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

watch(() => ledgerStore.currentLedgerId, loadAccounts)
onMounted(loadAccounts)

// --- 提交逻辑 ---

const toggleSplitMode = () => {
  ElMessage.info('拆分模式即将上线')
}

// 支出提交
const handleExpenseSubmit = async () => {
  if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return ElMessage.warning('请输入有效金额')
  if (!expenseForm.categoryId) return ElMessage.warning('请选择支出分类')
  if (!expenseForm.accountId) return ElMessage.warning('请选择支付账户')

  const dto: TransactionDTO = {
    bookId: ledgerStore.currentLedgerId,
    transDate: dayjs(expenseForm.date).format('YYYY-MM-DD HH:mm:ss'),
    description: expenseForm.memo || `${getAccountName(expenseForm.categoryId)} 支出`,
    entries: [
      { // 借：支出 (增加)
        accountId: expenseForm.categoryId,
        direction: 'DEBIT',
        amount: parseFloat(expenseForm.amount)
      },
      { // 贷：资产 (减少)
        accountId: expenseForm.accountId,
        direction: 'CREDIT',
        amount: parseFloat(expenseForm.amount)
      }
    ]
  }

  await submitTransaction(dto, () => {
    expenseForm.amount = ''
    expenseForm.memo = ''
    // 保留账户和分类选择，方便连续记账
  })
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
    ]
  }

  await submitTransaction(dto, () => {
    incomeForm.amount = ''
    incomeForm.memo = ''
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
    await addTransactionApi(dto)
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
  }
  
  :deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
  }
  
  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.tab-content {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}

// 金额输入区
.amount-section {
  display: flex;
  align-items: center;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
  position: relative;
  
  &.income-theme {
    border-bottom-color: #10B981; // Green for income
    .currency-symbol { color: #10B981; }
    :deep(.el-input__inner) { color: #10B981; }
  }
  
  .currency-symbol {
    font-size: 32px;
    font-weight: 600;
    color: #334155;
    margin-right: 12px;
  }
  
  .huge-input {
    flex: 1;
    font-size: 40px;
    font-weight: bold;
    
    :deep(.el-input__wrapper) {
      box-shadow: none;
      padding: 0;
      background: transparent;
    }
    
    :deep(.el-input__inner) {
      height: 50px;
      line-height: 50px;
      text-align: left;
    }
  }
  
  .split-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
}

// 分类 Grid
.category-grid-wrapper {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.category-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.recent-section {
  margin-bottom: 12px;
}

.recent-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #334155;
  font-size: 13px;
  margin: 4px 4px 8px 4px;
}

.group-selector {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px;
  margin-bottom: 12px;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
}

.group-pill {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  font-size: 13px;
  color: #334155;

  &:hover {
    border-color: #94a3b8;
  }

  &.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #334155;
  font-size: 14px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
  padding: 8px;
  
  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 12px 8px;
    border-radius: 12px;
    transition: all 0.2s;
    
    &:hover {
      background-color: #f1f5f9;
    }
    
    &.active {
      background-color: #e0f2fe;
      .cat-name { color: #0284c7; font-weight: 600; }
    }
    
    .cat-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    .cat-name {
      font-size: 12px;
      color: #64748b;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
  }
}

.account-bar-wrapper {
  flex-shrink: 0;

  .account-grid-scroll {
    max-height: 190px;
    overflow-y: auto;
    padding: 4px;
    border-radius: 10px;
    background: #f8fafc;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
  }

  .account-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
    padding: 4px;
  }

  .account-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #94a3b8;
      background: #f8fafc;
    }

    &.recent {
      border-color: #fde68a;
      background: #fffbeb;
    }

    &.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;

      .acc-name {
        color: #fff;
      }
    }

    .acc-icon {
      width: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .acc-name {
      font-size: 13px;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
  }
}

.section-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-hint {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 40px 20px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}

// 底部操作栏
.action-bar {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  align-items: center;
  
  .date-picker { width: 130px; }
  .memo-input { flex: 1; }
  .submit-btn { width: 100px; }
}

// 转账页样式
.transfer-content {
  justify-content: flex-start;
  
  .transfer-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 400px;
    margin: 0 auto;
    width: 100%;
    padding-top: 40px;
    
    .form-row {
      label {
        display: block;
        margin-bottom: 8px;
        color: #64748b;
        font-size: 14px;
      }
    }
    
    .transfer-arrow {
      display: flex;
      justify-content: center;
      color: #94a3b8;
      font-size: 24px;
    }
    
    .large-input {
      :deep(.el-input__inner) {
        height: 44px;
        font-size: 18px;
      }
    }
    
    .full-width { width: 100%; }
  }
  
  .static-bottom {
    margin-top: auto;
  }
}
</style>
