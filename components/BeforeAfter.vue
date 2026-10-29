<script setup lang="ts">
// 两行对比条：before / after，数值越大条越长（max 取两者较大值）
defineProps<{
  title: string
  before: { label: string; v: number; text: string }
  after: { label: string; v: number; text: string }
  better?: 'low' | 'high'
}>()
</script>
<template>
  <div class="ba">
    <div class="ba-t">{{ title }}</div>
    <div class="ba-row">
      <span class="ba-l">{{ before.label }}</span>
      <span class="ba-bar"><span class="ba-f old" :style="{ width: (before.v / Math.max(before.v, after.v)) * 100 + '%' }" /></span>
      <span class="ba-v">{{ before.text }}</span>
    </div>
    <div class="ba-row">
      <span class="ba-l">{{ after.label }}</span>
      <span class="ba-bar"><span class="ba-f new" :style="{ width: (after.v / Math.max(before.v, after.v)) * 100 + '%' }" /></span>
      <span class="ba-v hot">{{ after.text }}</span>
    </div>
  </div>
</template>
<style>
.ba { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; margin-top: 8px; }
.ba-t { font-family: var(--mono); font-size: 12px; letter-spacing: 1.5px; color: var(--cy); margin-bottom: 6px; }
.ba-row { display: grid; grid-template-columns: 150px 1fr 70px; gap: 8px; align-items: center; margin: 5px 0; font-size: 14px; }
.ba-l { color: var(--tx2); }
.ba-bar { position: relative; height: 14px; background: #0a1426; border-radius: 99px; overflow: hidden; display: block; }
.ba-f { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 99px; display: block; }
.ba-f.old { background: #5b6f8e; }
.ba-f.new { background: linear-gradient(90deg, var(--cy), var(--gn)); }
.ba-v { text-align: right; font-family: var(--mono); color: var(--tx2); font-size: 15px; }
.ba-v.hot { color: var(--gn); font-weight: 700; }
</style>
