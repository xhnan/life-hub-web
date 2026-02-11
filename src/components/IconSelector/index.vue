<template>
  <el-popover
    placement="bottom-start"
    :width="320"
    trigger="click"
    popper-class="icon-selector-popper"
  >
    <template #reference>
      <el-input
        v-model="inputValue"
        placeholder="点击选择或输入图标"
        class="icon-select-input"
        @input="handleInput"
        clearable
        @clear="handleClear"
      >
        <template #prefix>
          <div v-if="inputValue" class="icon-preview-wrapper">
            <ReIcon :icon="inputValue" class="icon-preview" />
          </div>
          <el-icon v-else class="el-input__icon">
            <Search />
          </el-icon>
        </template>
      </el-input>
    </template>
    
    <div class="icon-selector-container">
      <!-- Iconify 提示 -->
      <div class="iconify-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>支持输入 Iconify 图标代码，如 <code>mdi:home</code></span>
      </div>

      <el-input
        v-model="searchText"
        placeholder="搜索 Element Plus 图标"
        prefix-icon="Search"
        clearable
        class="search-input"
      />
      
      <el-scrollbar height="250px">
        <div class="icon-list">
          <div
            v-for="name in filteredIcons"
            :key="name"
            class="icon-item"
            :class="{ active: currentValue === name }"
            @click="selectIcon(name)"
            :title="name"
          >
            <el-icon>
              <component :is="icons[name]" />
            </el-icon>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Search, InfoFilled } from '@element-plus/icons-vue'
import ReIcon from '@/components/ReIcon/index.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const icons = ElementPlusIconsVue as any
const currentValue = ref(props.modelValue)
const searchText = ref('')
const inputValue = ref(props.modelValue || '')

watch(() => props.modelValue, (val) => {
  currentValue.value = val
  inputValue.value = val || ''
})

const handleInput = (val: string) => {
  currentValue.value = val
  emit('update:modelValue', val)
  emit('change', val)
}

const iconNames = Object.keys(ElementPlusIconsVue).filter(
  key => typeof (ElementPlusIconsVue as any)[key] === 'object'
)

const filteredIcons = computed(() => {
  if (!searchText.value) return iconNames
  return iconNames.filter(name => 
    name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const selectIcon = (name: string) => {
  currentValue.value = name
  inputValue.value = name
  emit('update:modelValue', name)
  emit('change', name)
}

const handleClear = () => {
  currentValue.value = ''
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
}
</script>

<style scoped lang="scss">
.icon-preview-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #409eff;
}

.icon-selector-container {
  .iconify-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    margin-bottom: 10px;
    background: #f0f9ff;
    border-radius: 6px;
    font-size: 12px;
    color: #64748b;

    .el-icon {
      color: #3b82f6;
      font-size: 14px;
    }

    code {
      background: #e0f2fe;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 11px;
      color: #0369a1;
    }
  }

  .search-input {
    margin-bottom: 12px;
  }

  .icon-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
    gap: 8px;
    padding: 2px;

    .icon-item {
      height: 36px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      transition: all 0.2s;
      color: #606266;

      &:hover {
        border-color: #409eff;
        color: #409eff;
        background-color: #ecf5ff;
        transform: translateY(-1px);
      }

      &.active {
        border-color: #409eff;
        background-color: #409eff;
        color: #fff;
      }
      
      .el-icon {
        font-size: 18px;
      }
    }
  }
}
</style>
