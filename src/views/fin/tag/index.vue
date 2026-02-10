<template>
  <div class="tag-page">
    <!-- 操作栏 -->
    <el-card shadow="never" class="search-card mb-4">
      <div class="search-bar">
        <div class="left-section">
          <el-input
            v-model="searchName"
            placeholder="搜索标签..."
            clearable
            :prefix-icon="Search"
            class="search-input"
            @keyup.enter="loadData"
          />
          <el-button :icon="Search" circle @click="loadData" />
          <el-button :icon="Refresh" circle @click="handleReset" />
        </div>
        <el-button type="primary" :icon="Plus" round @click="handleAdd">新增标签</el-button>
      </div>
    </el-card>

    <!-- 标签卡片列表 -->
    <el-card shadow="never" class="content-card">
      <div v-loading="loading" class="tag-grid">
        <div v-if="tagList.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无标签，点击右上角新增" />
        </div>

        <div
          v-for="tag in tagList"
          :key="tag.id"
          class="tag-card"
          :style="cardBorderStyle(tag.color)"
        >
          <div class="tag-card-header">
            <div class="tag-icon-name">
              <div class="tag-icon-box" :style="iconBoxStyle(tag.color)">
                <ReIcon v-if="tag.icon && isIconifyIcon(tag.icon)" :icon="tag.icon" />
                <el-icon v-else><PriceTag /></el-icon>
              </div>
              <div class="tag-info">
                <span class="tag-name">{{ tag.tagName }}</span>
              </div>
            </div>
            <div class="tag-actions">
              <el-button type="primary" link :icon="Edit" circle size="small" @click="handleEdit(tag)" />
              <el-button type="danger" link :icon="Delete" circle size="small" @click="handleDelete(tag)" />
            </div>
          </div>
          <div class="tag-card-footer">
            <el-tag
              :color="tag.color"
              effect="dark"
              size="small"
              round
              style="border: none; color: #fff;"
            >
              {{ tag.tagName }}
            </el-tag>
            <span class="tag-date" v-if="tag.createdAt">{{ formatDate(tag.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          size="small"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <TagDialog ref="dialogRef" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, PriceTag } from '@element-plus/icons-vue'
import { getTagPageApi, deleteTagApi, type TagRow } from '@/api/fin/tag'
import TagDialog from './components/TagDialog.vue'
import ReIcon from '@/components/ReIcon/index.vue'
import dayjs from 'dayjs'

const loading = ref(false)
const tagList = ref<TagRow[]>([])
const searchName = ref('')
const pageNum = ref(1)
const pageSize = ref(50)
const total = ref(0)
const dialogRef = ref<InstanceType<typeof TagDialog>>()

const isIconifyIcon = (icon?: string) => {
  return !!icon && (icon.includes(':') || icon.includes('/'))
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const cardBorderStyle = (color?: string) => {
  return color ? { borderLeft: `3px solid ${color}` } : {}
}

const iconBoxStyle = (color?: string) => {
  if (!color) return {}
  return { backgroundColor: color + '18', color }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getTagPageApi({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      name: searchName.value || undefined
    })
    if (res.data) {
      tagList.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchName.value = ''
  pageNum.value = 1
  loadData()
}

const handleAdd = () => {
  dialogRef.value?.open('add')
}

const handleEdit = (row: TagRow) => {
  dialogRef.value?.open('edit', row)
}

const handleDelete = (row: TagRow) => {
  ElMessageBox.confirm(
    `确定要删除标签「${row.tagName}」吗？`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await deleteTagApi(row.id!)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      // 错误已由拦截器处理
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
$primary-color: #F59E0B;
$text-main: #0F172A;
$text-secondary: #64748B;
$border-color: #e2e8f0;

.tag-page {
  padding: 16px;
  background-color: #F8FAFC;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-card {
  flex-shrink: 0;
  border-radius: 16px;
  border: 1px solid $border-color;

  :deep(.el-card__body) {
    padding: 12px 24px;
  }
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    &:hover, &.is-focus {
      box-shadow: 0 0 0 1px $primary-color inset;
    }
  }
}

.content-card {
  flex: 1;
  border-radius: 16px;
  border: 1px solid $border-color;
  overflow: hidden;

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
  }
}

.tag-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-content: start;
  overflow-y: auto;
  padding: 4px;

  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.tag-card {
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s;
  cursor: default;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
}

.tag-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tag-icon-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.tag-icon-box {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #f1f5f9;
  color: $text-secondary;
}

.tag-info {
  display: flex;
  flex-direction: column;
  min-width: 0;

  .tag-name {
    font-size: 15px;
    font-weight: 600;
    color: $text-main;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.tag-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;

  .tag-card:hover & {
    opacity: 1;
  }
}

.tag-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .tag-date {
    font-size: 11px;
    color: #94a3b8;
  }
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.mb-4 { margin-bottom: 16px; }
</style>
