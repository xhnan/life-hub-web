<template>
  <div>
    hello world
  </div>
</template>
<script setup lang="ts">


import {onMounted} from "vue";
import {testUserApi} from "@/api/userApi.ts";
import {ElMessage} from "element-plus";


const test=()=>{
  testUserApi().then(()=>{
    ElMessage.success("API调用成功")
  })
}



onMounted(()=>{
  test()
})


</script>
<style scoped>

</style>