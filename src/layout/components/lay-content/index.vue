<template>
  <div class="lay-content">
    <router-view />
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: 'LayContent'
})
</script>
<style scoped>
.lay-content {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
</style>