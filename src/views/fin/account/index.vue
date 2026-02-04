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
            <el-input 
              v-model="searchForm.name" 
              placeholder="搜索账户..." 
              clearable 
              :prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch" :icon="Search" circle />
          </div>
        </div>

        <!-- 右侧操作按钮 -->
        <div class="action-buttons">
          <el-button @click="handleReset" :icon="Refresh" circle />
          <el-button type="success" @click="handleAdd" :icon="Plus" round class="add-btn">新增账户</el-button>
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
              <el-icon v-if="row.children && row.children.length" class="folder-icon"><Folder /></el-icon>
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
        <el-table-column prop="accountType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.accountType)" effect="light" round size="small">
              {{ getTypeLabel(row.accountType) }}
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
            <div class="status-dot" :class="row.isArchived === 0 ? 'active' : 'archived'"></div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TabsPaneContext, ElTable } from 'element-plus'
import { Money, CreditCard, Wallet, Search, Refresh, Plus, Edit, Delete, Folder, Document } from '@element-plus/icons-vue'

// 类型定义，参考 FinAccounts schema
interface AccountRow {
  id: number
  code?: string
  name: string
  parentId?: number
  accountType: string // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  currencyCode: string
  initialBalance: number
  currentBalance: number // 当前余额
  isArchived: number // 0:启用, 1:归档
  description: string
  isLeaf?: boolean
  createdAt: string
  updatedAt: string
  children?: AccountRow[]
}

const loading = ref(false)
const tableData = ref<AccountRow[]>([])
const activeTab = ref('ALL')
const tableRef = ref<InstanceType<typeof ElTable>>()

const searchForm = reactive({
  name: '',
  accountType: ''
})

// 辅助函数
const getTypeTag = (type: string) => {
  const map: Record<string, string> = {
    ASSET: 'success',
    LIABILITY: 'danger',
    EQUITY: 'warning',
    INCOME: 'primary',
    EXPENSE: 'info'
  }
  return map[type] || 'info'
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    ASSET: '资产',
    LIABILITY: '负债',
    EQUITY: '权益',
    INCOME: '收入',
    EXPENSE: '支出'
  }
  return map[type] || type
}

const getBalanceClass = (amount: number) => {
  if (amount > 0) return 'text-green'
  if (amount < 0) return 'text-red'
  return 'text-gray'
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const toggleRowExpansion = (row: AccountRow) => {
  if (row.children && row.children.length > 0) {
    tableRef.value?.toggleRowExpansion(row)
  }
}

// 模拟数据加载
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    // 生成大量模拟数据以测试滚动条
    const generateChildren = (parentId: number, count: number) => {
      return Array.from({ length: count }).map((_, idx) => ({
        id: parentId * 100 + idx,
        code: `${parentId}${idx}`,
        name: `测试账户 ${parentId}-${idx}`,
        parentId: parentId,
        accountType: 'ASSET',
        initialBalance: Math.random() * 10000,
        currentBalance: Math.random() * 10000,
        currencyCode: 'CNY',
        isArchived: 0,
        description: '自动生成测试数据',
        createdAt: '2023-01-01 12:00:00',
        updatedAt: '2023-10-01 12:00:00'
      }))
    }

    const allData = [
      {
        id: 100,
        code: '1000',
        name: '流动资产',
        accountType: 'ASSET',
        initialBalance: 15230.00,
        currentBalance: 18656.00,
        currencyCode: 'CNY',
        isArchived: 0,
        description: '流动性较强的资产',
        createdAt: '2023-01-01 00:00:00',
        updatedAt: '2023-10-01 12:00:00',
        children: [
           {
            id: 1,
            code: '1001',
            name: '招商银行储蓄卡',
            parentId: 100,
            accountType: 'ASSET',
            initialBalance: 15000.50,
            currentBalance: 18500.00,
            currencyCode: 'CNY',
            isArchived: 0,
            description: '工资卡',
            createdAt: '2023-01-01 12:00:00',
            updatedAt: '2023-10-01 12:00:00'
          },
          {
            id: 3,
            code: '1002',
            name: '支付宝余额',
            parentId: 100,
            accountType: 'ASSET',
            initialBalance: 230.00,
            currentBalance: 156.00,
            currencyCode: 'CNY',
            isArchived: 0,
            description: '零钱',
            createdAt: '2023-01-05 15:20:00',
            updatedAt: '2023-10-05 15:20:00'
          },
          ...generateChildren(100, 5) // 增加一些子节点
        ]
      },
      {
        id: 200,
        code: '2000',
        name: '流动负债',
        accountType: 'LIABILITY',
        initialBalance: -500.00,
        currentBalance: -2500.00,
        currencyCode: 'CNY',
        isArchived: 0,
        description: '短期负债',
        createdAt: '2023-01-01 00:00:00',
        updatedAt: '2023-10-01 12:00:00',
        children: [
          {
            id: 2,
            code: '2001',
            name: '招商银行信用卡',
            parentId: 200,
            accountType: 'LIABILITY',
            initialBalance: -500.00,
            currentBalance: -2500.00,
            currencyCode: 'CNY',
            isArchived: 0,
            description: '日常消费',
            createdAt: '2023-01-02 10:30:00',
            updatedAt: '2023-10-02 10:30:00'
          }
        ]
      },
      {
        id: 4,
        code: '6001',
        name: '工资收入',
        accountType: 'INCOME',
        initialBalance: 0,
        currentBalance: 120000.00,
        currencyCode: 'CNY',
        isArchived: 0,
        description: '每月工资',
        createdAt: '2023-01-01 00:00:00',
        updatedAt: '2023-01-01 00:00:00'
      },
      {
        id: 5,
        code: '5001',
        name: '餐饮支出',
        accountType: 'EXPENSE',
        initialBalance: 0,
        currentBalance: 3500.00,
        currencyCode: 'CNY',
        isArchived: 0,
        description: '一日三餐',
        createdAt: '2023-01-01 00:00:00',
        updatedAt: '2023-01-01 00:00:00'
      },
      // 增加更多根节点以撑开高度
      ...generateChildren(300, 15)
    ]

    // 简单的前端过滤逻辑，实际应由后端处理
    if (activeTab.value !== 'ALL') {
      tableData.value = allData.filter(item => item.accountType === activeTab.value)
    } else {
      tableData.value = allData
    }

    if (searchForm.name) {
       // 简单的搜索逻辑
       tableData.value = tableData.value.filter(item => item.name.includes(searchForm.name))
    }

    loading.value = false
  }, 300)
}

const handleTabClick = (tab: TabsPaneContext) => {
  // 切换Tab时重置搜索名称并重新加载
  // searchForm.name = '' 
  loadData()
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.name = ''
  activeTab.value = 'ALL'
  loadData()
}

const handleAdd = () => {
  ElMessage.info('点击了新增账户，功能待实现')
}

const handleAddChild = (row: AccountRow) => {
  ElMessage.info(`点击了新增子账户，父账户: ${row.name}`)
}

const handleEdit = (row: AccountRow) => {
  ElMessage.info(`点击了编辑账户: ${row.name}，功能待实现`)
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
  ).then(() => {
    ElMessage.success('删除成功 (模拟)')
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
.mb-4 { margin-bottom: 16px; }

</style>
