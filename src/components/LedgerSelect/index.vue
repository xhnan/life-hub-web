<template>
  <el-select
    v-model="currentLedgerId"
    placeholder="选择账本"
    class="ledger-select"
    :loading="ledgerStore.loading"
    @change="handleChange"
    size="default"
  >
    <el-option
      v-for="item in ledgerStore.ledgerList"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    >
      <span style="float: left">{{ item.name }}</span>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { ledgerStore, initLedgerStore, setLedger } from '@/store/ledger';

const currentLedgerId = computed({
  get: () => ledgerStore.currentLedgerId,
  set: (val) => {
    if (val) setLedger(val);
  }
});

const handleChange = (val: number) => {
  setLedger(val);
};

onMounted(() => {
  if (ledgerStore.ledgerList.length === 0) {
    initLedgerStore();
  }
});
</script>

<style scoped lang="scss">
.ledger-select {
  width: 100%;
}
</style>
