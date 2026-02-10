<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    size="800px"
    append-to-body
    :with-header="false"
    class="quick-tracker-drawer"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    @close="handleClose"
  >
    <div class="drawer-wrapper">
      <!-- 自定义标题栏 -->
      <div class="drawer-header">
        <div class="header-content">
          <h2 class="drawer-title">快速记账</h2>
          <p class="drawer-subtitle">记录您的每一笔收支</p>
        </div>
        <button
          class="close-btn"
          @click="handleCloseClick"
          aria-label="关闭"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="drawer-body">
        <QuickTracker ref="trackerRef" @success="handleSuccess" @cancel="handleCancel" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import QuickTracker from './QuickTracker.vue'

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'success', 'cancel'])

const internalVisible = ref(false)
const visible = computed({
  get: () => props.modelValue ?? internalVisible.value,
  set: (value: boolean) => {
    if (props.modelValue === undefined) {
      internalVisible.value = value
    }
    emit('update:modelValue', value)
  }
})
const trackerRef = ref<InstanceType<typeof QuickTracker>>()

const open = () => {
  visible.value = true
}

const handleSuccess = () => {
  visible.value = false
  emit('success')
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClose = () => {
  trackerRef.value?.resetForms()
}

const handleCloseClick = () => {
  visible.value = false
  trackerRef.value?.resetForms()
  emit('cancel')
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.drawer-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

// ========== 标题栏 ==========
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.drawer-subtitle {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  &:active {
    transform: scale(0.95);
    background: #e2e8f0;
  }

  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

// ========== 内容区域 ==========
.drawer-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

// 深度选择器优化 QuickTracker 内部样式
:deep(.quick-tracker) {
  box-shadow: none;
  border-radius: 0;
  height: 100%;
  background: transparent;

  // 优化 Tab 标签页
  .tracker-tabs {
    background: transparent;

    :deep(.el-tabs__header) {
      background: transparent;
      border-radius: 0;
      padding: 8px 16px 0;
      margin: 0;
      box-shadow: none;
      border: none;
      border-bottom: 1px solid #e2e8f0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      border-radius: 8px 8px 0 0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      color: #64748b;
      font-weight: 500;
      padding: 0 16px;
      height: 36px;
      line-height: 36px;
      font-size: 14px;

      &:hover {
        color: #0f172a;
      }

      &.is-active {
        color: #3b82f6;
        border-bottom: 2px solid #3b82f6;
      }
    }

    :deep(.el-tabs__active-bar) {
      display: none;
    }
  }

  // 优化分类卡片 - 移除 transform 避免抖动
  .category-item {
    &:hover {
      background: #f1f5f9;
    }

    &.active {
      background: #dbeafe;
      .cat-name { color: #0284c7; font-weight: 600; }
    }
  }

  // 优化账户卡片
  .account-card {
    &:hover {
      border-color: #94a3b8;
      background: #f8fafc;
    }

    &.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;

      .acc-name {
        color: #fff;
      }
    }
  }

  // 优化分组选择器
  .group-pill {
    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    &.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }
  }
}

// ========== 响应式优化 ==========
@media (max-width: 768px) {
  .drawer-header {
    padding: 10px 14px;
  }

  .drawer-title {
    font-size: 16px;
  }

  .close-btn {
    width: 28px;
    height: 28px;

    svg {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
