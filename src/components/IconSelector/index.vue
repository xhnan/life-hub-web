<template>
  <el-popover
    placement="bottom-start"
    :width="320"
    trigger="click"
    popper-class="icon-selector-popper"
  >
    <template #reference>
      <el-input
        v-model="currentValue"
        placeholder="点击选择图标"
        readonly
        clearable
        @clear="handleClear"
        class="icon-input"
      >
        <template #prefix>
          <el-icon v-if="currentValue && icons[currentValue]" class="el-input__icon">
            <component :is="icons[currentValue]" />
          </el-icon>
          <el-icon v-else class="el-input__icon">
            <Search />
          </el-icon>
        </template>
      </el-input>
    </template>
    
    <div class="icon-selector-container">
      <el-input
        v-model="searchText"
        placeholder="搜索图标"
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
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Cast to any to access by index/key
const icons = ElementPlusIconsVue as any
const currentValue = ref(props.modelValue)
const searchText = ref('')

// Get all icon names, excluding internal exports if any
const iconNames = Object.keys(ElementPlusIconsVue).filter(key => typeof (ElementPlusIconsVue as any)[key] === 'object')

const filteredIcons = computed(() => {
  if (!searchText.value) return iconNames
  return iconNames.filter(name => 
    name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

watch(() => props.modelValue, (val) => {
  currentValue.value = val
})

const selectIcon = (name: string) => {
  currentValue.value = name
  emit('update:modelValue', name)
  emit('change', name)
}

const handleClear = () => {
  currentValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
}
</script>

<style scoped lang="scss">
.icon-selector-container {
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
