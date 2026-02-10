<template>
  <el-drawer
    v-model="visible"
    title="快速记账"
    direction="rtl"
    size="720px"
    append-to-body
    :with-header="false"
    class="quick-tracker-drawer"
    @close="handleClose"
  >
    <div class="drawer-content">
      <QuickTracker ref="trackerRef" @success="handleSuccess" @cancel="handleCancel" />
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

defineExpose({ open })
</script>

<style scoped lang="scss">
.drawer-content {
  height: 100%;
  padding: 0;
  
  :deep(.quick-tracker) {
    box-shadow: none;
    border-radius: 0;
    height: 100%;
  }
}
</style>
