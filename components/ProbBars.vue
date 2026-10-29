<script setup lang="ts">
defineProps<{ items: { label: string; p: number }[]; top?: string }>()
</script>
<template>
  <div class="pbars">
    <div v-for="it in items" :key="it.label" class="prow" :class="{ top: it.label === top }">
      <span class="pl">{{ it.label }}</span>
      <span class="pt"><span class="pf" :style="{ width: Math.round(it.p * 100) + '%' }" /></span>
      <span class="pv">{{ Math.round(it.p * 100) }}%</span>
    </div>
  </div>
</template>
