<template>
  <div class="account-page">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card asset-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总资产</div>
              <div class="stat-value text-green">¥ 138,656.00</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card liability-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><CreditCard /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总负债</div>
              <div class="stat-value text-red">¥ -2,500.00</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card net-worth-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">净资产</div>
              <div class="stat-value text-blue">¥ 136,156.00</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索与操作栏 -->
    <el-card shadow="never" class="search-card mb-4 glass-effect">
      <div class="search-bar">
        <!-- 左侧搜索与Tab -->
        <div class="filter-section">
          <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="account-tabs">
            <el-tab-pane label="全部" name="ALL" />
            <el-tab-pane label="资产" name="ASSET" />
            <el-tab-pane label="负债" name="LIABILITY" />
            <el-tab-pane label="权益" name="EQUITY" />
            <el-tab-pane label="收入" name="INCOME" />
            <el-tab-pane label="支出" name="EXPENSE" />
          </el-tabs>
          
          <div class="search-input-wrapper">
            <div class="ledger-wrapper">
              <LedgerSelect />
            </div>
            <el-input 
              v-model="searchForm.name" 
              placeholder="搜索账户..." 
              clearable 
              :prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch" :icon="Search" circle />
            
            <!-- 操作按钮移到这里 -->
            <div class="action-buttons ml-4">
              <el-tooltip content="初始化默认账户" placement="top">
                <el-button @click="handleInit" :icon="MagicStick" circle size="default" type="warning" plain />
              </el-tooltip>
              <el-button @click="handleReset" :icon="Refresh" circle size="default" />
              <el-button type="success" @click="handleAdd" :icon="Plus" round size="default" class="add-btn">新增账户</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 账户表格 -->
    <el-card shadow="never" class="table-card glass-effect" :body-style="{ padding: '0', height: '100%' }">
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        class="custom-table"
        :header-cell-style="{ background: 'transparent', color: '#606266' }"
        :row-style="{ background: 'transparent' }"
        height="100%"
      >
        <el-table-column prop="name" label="账户名称" min-width="240">
          <template #default="{ row }">
            <div class="account-name-cell cursor-pointer" @click="toggleRowExpansion(row)">
              <ReIcon v-if="row.icon" :icon="row.icon" class="account-icon" />
              <el-icon v-else-if="row.children && row.children.length" class="folder-icon"><Folder /></el-icon>
              <el-icon v-else class="file-icon"><Document /></el-icon>
              <span class="ml-2 font-medium">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="Code" width="100">
          <template #default="{ row }">
            <span class="code-tag">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="accountTypeEnum" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.accountTypeEnum)" effect="light" round size="small">
              {{ getTypeLabel(row.accountTypeEnum) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="initialBalance" label="期初余额" width="150" align="right">
          <template #default="{ row }">
            <span :class="getBalanceClass(row.initialBalance)">
              {{ formatCurrency(row.initialBalance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="currentBalance" label="当前余额" width="150" align="right">
          <template #default="{ row }">
            <span :class="getBalanceClass(row.currentBalance)" class="font-bold">
              {{ formatCurrency(row.currentBalance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="currencyCode" label="币种" width="80" align="center" />
        <el-table-column prop="isArchived" label="状态" width="80" align="center">
          <template #default="{ row }">
            <div class="status-dot" :class="!row.isArchived ? 'active' : 'archived'"></div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="operation-group">
              <el-tooltip content="新增子账户" placement="top">
                <el-button type="primary" link :icon="Plus" circle @click="handleAddChild(row)" />
              </el-tooltip>
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" link :icon="Edit" circle @click="handleEdit(row)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" link :icon="Delete" circle @click="handleDelete(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <AccountDialog 
      ref="dialogRef" 
      :all-data="allData" 
      @success="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TabsPaneContext, ElTable } from 'element-plus'
import { Money, CreditCard, Wallet, Search, Refresh, Plus, Edit, Delete, Folder, Document, MagicStick } from '@element-plus/icons-vue'
import { 
  getAccountTreeApi, 
  deleteAccountApi, 
  initAccountsApi,
  type AccountRow 
} from '@/api/fin/account'
import AccountDialog from './components/AccountDialog.vue'
import { ledgerStore } from '@/store/ledger'
import LedgerSelect from "@/components/LedgerSelect/index.vue"
import ReIcon from "@/components/ReIcon/index.vue"

const loading = ref(false)
const tableData = ref<AccountRow[]>([])
const allData = ref<AccountRow[]>([]) // 存储原始数据用于前端过滤
const activeTab = ref('ALL')
const tableRef = ref<InstanceType<typeof ElTable>>()

const searchForm = reactive({
  name: '',
  accountType: ''
})

const dialogRef = ref<InstanceType<typeof AccountDialog>>()


// 辅助函数
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

const getTypeLabel = (type: string) => {
  // 后端已经返回中文描述，直接展示即可
  return type
}

const getBalanceClass = (amount: number) => {
  if (amount > 0) return 'text-green'
  if (amount < 0) return 'text-red'
  return 'text-gray'
}

const formatCurrency = (amount: number) => {
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

const toggleRowExpansion = (row: AccountRow) => {
  tableRef.value?.toggleRowExpansion(row)
}

// 递归过滤树形数据
const filterTree = (nodes: AccountRow[], keyword: string, type: string): AccountRow[] => {
  // 后端返回的枚举值为中文描述，需要映射
  const typeMap: Record<string, string> = {
    'ASSET': '资产',
    'LIABILITY': '负债',
    'EQUITY': '权益',
    'INCOME': '收入',
    'EXPENSE': '支出'
  }
  const targetType = type === 'ALL' ? 'ALL' : (typeMap[type] || type)

  return nodes.filter(node => {
    // 类型匹配（如果是ALL则不校验类型）
    const typeMatch = targetType === 'ALL' || node.accountTypeEnum === targetType
    
    // 名称或Code匹配
    const nameMatch = !keyword || 
      node.name.toLowerCase().includes(keyword.toLowerCase()) || 
      node.code.toLowerCase().includes(keyword.toLowerCase())
    
    // 如果有子节点，递归过滤
    let childrenMatch = false
    let filteredChildren: AccountRow[] = []
    
    if (node.children && node.children.length > 0) {
      filteredChildren = filterTree(node.children, keyword, type)
      if (filteredChildren.length > 0) {
        childrenMatch = true
      }
    }

    // 匹配逻辑：
    // 1. 如果有子节点匹配 (childrenMatch)，则当前节点必须保留，且仅保留匹配的子节点
    if (childrenMatch) {
      return { ...node, children: filteredChildren }
    }
    
    // 2. 如果子节点都不匹配，检查当前节点是否匹配 (typeMatch && nameMatch)
    // 注意：如果是类型过滤，只有当当前节点匹配时才保留（叶子节点或无匹配子节点的父节点）
    if (typeMatch && nameMatch) {
      // 这里的逻辑稍微复杂：如果只是类型过滤，我们希望保留该类型的所有节点
      // 如果当前节点符合类型，我们保留它（此时它没有匹配的子节点，或者子节点被过滤空了）
      // 但是要小心，如果当前节点匹配，但我们想看它的子结构（即使子结构类型不同？通常类型是一致的）
      return { ...node, children: [] }
    }

    return null
  }).filter(Boolean) as AccountRow[]
}

// 更简单的搜索逻辑：仅对顶层或扁平化数据有效，树形搜索较复杂。
// 鉴于后端API返回全量树，我们在前端做简单的展示过滤
const applyFilter = () => {
  let result = [...allData.value]
  
  // 1. 类型过滤
  // 既然已经从后端获取了对应类型的数据，这里不需要再根据类型过滤了
  // 除非 activeTab 和 loadData 的参数不一致（目前是一致的）
  
  // 2. 名称搜索 (前端搜索)
  if (searchForm.name) {
    result = filterTree(result, searchForm.name, 'ALL')
  }
  
  tableData.value = result
}

const loadData = async (type: string = activeTab.value) => {
  if (!ledgerStore.currentLedgerId) {
    tableData.value = []
    allData.value = []
    return
  }
  loading.value = true
  try {
    const res = await getAccountTreeApi({ 
      accountType: type !== 'ALL' ? type : undefined,
      bookId: ledgerStore.currentLedgerId
    })
    if (res.data) {
      allData.value = res.data
      tableData.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(() => ledgerStore.currentLedgerId, () => {
  loadData()
})

const handleTabClick = (tab: TabsPaneContext) => {
  // 直接使用当前点击的 tab.paneName 作为参数，避免 v-model 异步更新时序问题
  loadData(tab.paneName as string)
}

const handleSearch = () => {
  applyFilter()
}

const handleReset = () => {
  searchForm.name = ''
  activeTab.value = 'ALL'
  loadData()
}

const handleInit = () => {
  if (!ledgerStore.currentLedgerId) {
    ElMessage.warning('请先选择账本')
    return
  }
  ElMessageBox.confirm(
    '确定要初始化默认账户吗？如果已经存在账户，可能会跳过或重复创建。',
    '初始化确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await initAccountsApi(ledgerStore.currentLedgerId!)
      ElMessage.success('初始化成功')
      loadData()
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

const handleAdd = () => {
  dialogRef.value?.open('add')
}

const handleAddChild = (row: AccountRow) => {
  dialogRef.value?.open('addChild', row)
}

const handleEdit = (row: AccountRow) => {
  dialogRef.value?.open('edit', row)
}

const handleDelete = (row: AccountRow) => {
  ElMessageBox.confirm(
    `确定要删除账户「${row.name}」吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteAccountApi(row.id)
      ElMessage.success('删除成功')
      loadData() // 重新加载数据
    } catch (error) {
      // 错误已由拦截器处理
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
// 颜色变量
$primary-color: #F59E0B; // Gold
$secondary-color: #FBBF24;
$success-color: #10B981;
$danger-color: #EF4444;
$text-main: #0F172A;
$text-secondary: #64748B;
$bg-glass: #ffffff; // 移除半透明，改用纯白背景以提升性能
$border-glass: #e2e8f0;
$shadow-glass: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

.account-page {
  padding: 16px;
  background-color: #F8FAFC;
  height: calc(100vh - 84px); // 减去顶部导航栏高度，确保整体不出现滚动条
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止页面滚动
}

// 统计卡片样式
.stat-card {
  border: none;
  border-radius: 16px;
  background: white; // 移除渐变和模糊，优化性能
  box-shadow: $shadow-glass;
  transition: transform 0.2s ease; // 缩短动画时间
  cursor: pointer;
  flex-shrink: 0; // 防止被压缩

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .stat-content {
    display: flex;
    align-items: center;
    padding: 12px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin-right: 16px;
    
    // 不同卡片的图标背景色
    .el-icon {
      color: white;
    }
  }

  &.asset-card .stat-icon {
    background: linear-gradient(135deg, #10B981, #34D399);
  }
  
  &.liability-card .stat-icon {
    background: linear-gradient(135deg, #EF4444, #F87171);
  }
  
  &.net-worth-card .stat-icon {
    background: linear-gradient(135deg, #3B82F6, #60A5FA);
  }

  .stat-info {
    .stat-label {
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      font-family: 'Fira Sans', sans-serif;
    }
  }
}

// 通用卡片样式 (移除 glass-effect)
.glass-effect {
  background: $bg-glass !important;
  border: 1px solid $border-glass;
  border-radius: 16px;
  box-shadow: $shadow-glass;
  // 移除 backdrop-filter: blur(12px); 解决卡顿
}

// 搜索栏样式
.search-card {
  flex-shrink: 0; // 防止被压缩
  :deep(.el-card__body) {
    padding: 12px 24px;
  }

  .search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .filter-section {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
  }
  
  .account-tabs {
    :deep(.el-tabs__nav-wrap::after) {
      display: none; // 移除底部灰线
    }
    :deep(.el-tabs__item) {
      font-size: 15px;
      font-weight: 500;
      color: $text-secondary;
      &.is-active {
        color: $primary-color;
        font-weight: 600;
      }
    }
    :deep(.el-tabs__active-bar) {
      background-color: $primary-color;
      height: 3px;
      border-radius: 3px;
    }
    :deep(.el-tabs__header) {
      margin: 0;
    }
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ledger-wrapper {
    width: 180px;
    :deep(.el-input__wrapper) {
      background-color: white;
      border: 1px solid #e2e8f0;
      box-shadow: none !important;
      border-radius: 20px;
      .el-input__inner {
        color: #606266;
      }
    }
  }

  .search-input {
    width: 220px;
    :deep(.el-input__wrapper) {
      border-radius: 20px;
      box-shadow: 0 0 0 1px #e2e8f0 inset;
      &:hover, &.is-focus {
        box-shadow: 0 0 0 1px $primary-color inset;
      }
    }
  }
}

// 表格样式优化
.table-card {
  border-radius: 16px;
  overflow: hidden;
  flex: 1; // 占据剩余空间
  min-height: 0; // 关键：允许 flex 子项缩小，从而显示滚动条
  display: flex;
  flex-direction: column;
  
  .custom-table {
    background: transparent;
    
    :deep(th.el-table__cell) {
      background-color: #F8FAFC !important;
      font-weight: 600;
      color: $text-secondary;
      height: 50px;
    }

    :deep(td.el-table__cell) {
      border-bottom: 1px solid #F1F5F9;
      padding: 12px 0;
    }

    :deep(.el-table__row:hover > td) {
      background-color: #F8FAFC !important;
    }

    // 修复树形展开箭头垂直对齐问题
    :deep(.el-table__expand-icon) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 24px; // 匹配行高
      margin-top: -2px; // 微调垂直位置
    }
  }

  .account-name-cell {
    display: inline-flex; // 改为 inline-flex 避免独占一行
    align-items: center;
    vertical-align: middle; // 确保垂直对齐
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 0.8;
    }

    .account-icon {
      font-size: 18px;
      color: #F59E0B;
    }

    .folder-icon {
      color: #F59E0B;
      font-size: 18px;
    }
    
    .file-icon {
      color: #94A3B8;
      font-size: 16px;
    }
  }

  // 增加手型光标样式
  .cursor-pointer {
    cursor: pointer;
    user-select: none;
  }

  .code-tag {
    font-family: 'Fira Code', monospace;
    color: $text-secondary;
    background: #F1F5F9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin: 0 auto;
    
    &.active {
      background-color: $success-color;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    
    &.archived {
      background-color: #CBD5E1;
    }
  }
}

// 文字颜色辅助类
.text-green { color: $success-color; }
.text-red { color: $danger-color; }
.text-blue { color: #3B82F6; }
.text-gray { color: #94A3B8; }
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.ml-2 { margin-left: 8px; }
.ml-4 { margin-left: 16px; }
.mb-4 { margin-bottom: 16px; }

</style>