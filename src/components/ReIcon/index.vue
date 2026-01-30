<template>
  <component :is="elementIconComponent" v-if="isElementIcon" />
  <Icon :icon="icon" v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  icon: {
    type: String,
    required: true
  }
});

const isElementIcon = computed(() => {
  if (!props.icon) return false;
  // 如果包含 : 或 / 或 -，通常是 Iconify 图标 (例如 ep:user, fa-solid:home)
  // Element Plus 图标通常是 PascalCase (例如 User, HomeFilled)
  // 但为了保险，我们检查它是否在 ElementPlusIconsVue 中存在
  return !props.icon.includes(':') && !props.icon.includes('/') && props.icon in ElementPlusIconsVue;
});

const elementIconComponent = computed(() => {
  if (isElementIcon.value) {
    return (ElementPlusIconsVue as any)[props.icon];
  }
  return null;
});

defineOptions({
  name: 'ReIcon'
});
</script>
