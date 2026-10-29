<script setup lang="ts">
// 对数刻度条形图：items 的 v 为数值，log 映射到宽度
const props = defineProps<{ items: { label: string; v: number; fmt: string; hot?: boolean }[]; min: number; max: number }>()
const w = (v: number) => {
  const a = Math.log10(props.min), b = Math.log10(props.max)
  return Math.max(4, Math.min(100, ((Math.log10(v) - a) / (b - a)) * 100))
}
</script>
<template>
  <div>
    <div v-for="it in items" :key="it.label" class="pbars">
      <div class="prow" :class="{ top: it.hot }" style="grid-template-columns:150px 1fr 90px">
        <span class="pl" style="font-size:13px">{{ it.label }}</span>
        <span class="pt"><span class="pf" :style="{ width: w(it.v) + '%' }" /></span>
        <span class="pv">{{ it.fmt }}</span>
      </div>
    </div>
    <div class="note">对数刻度</div>
  </div>
</template>
