<template>
  <div class="layout">
    <div class="navbar">
      <LayNavbar/>
    </div>
    <div class="content">
      <LayContent/>
    </div>
  </div>
</template>
<script setup lang="ts">
import LayContent from "@/layout/components/lay-content/index.vue";
import LayNavbar from "@/layout/components/lay-navbar/index.vue";
</script>
<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.navbar {
  flex: 0 0 240px;
  height: 100%;
  background: rgba(0, 0, 0, 0);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.content {
  flex: 1;
  height: 100%;
  overflow: auto;
  background: #0f172a;
  color: #e5e7eb;
  padding: 16px;
  box-sizing: border-box;
}
</style>
