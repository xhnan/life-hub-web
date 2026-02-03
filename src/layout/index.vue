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
<style scoped lang="scss">
@use "@/styles/variables" as *;



.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.navbar {
  flex: 0 0 240px;
  height: 100%;
  background: $menu-background-color;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.content {
  flex: 1;
  height: 100vh;
  overflow: hidden;
  background: $center-background-color;
  color: #000000;
  padding: 16px;
  box-sizing: border-box;
}
</style>
