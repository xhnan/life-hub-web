<template>
  <div class="wrapper">
    <el-row :gutter="20" class="full-height">
      <el-col class="sys-menu-back" :span="8">
       1
      </el-col>
      <el-col class="sys-menu-back" :span="16">
        1
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

/* 最外层容器确保占满视口 */
html, body {
  margin: 0;
  height: 100%;
}

/* 根容器：设置为 100vh */
.wrapper {
  height: 100%;  /* 使用 100% 来继承父容器的高度 */
  display: block; /* 不使用 flex 布局 */
  width: 100%;
}

/* 让 el-row 充满父容器的高度 */
.full-height {
  height: 100%;  /* el-row 高度为父容器的 100% */
  flex-wrap: nowrap !important; /* 防止换行 */
}

/* el-col 高度填满 el-row */
.sys-menu-back {
  background-color: $primary-background-color;
  min-height: 100%;  /* 用 min-height 确保撑满 */
}
</style>
