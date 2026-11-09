<!-- 第 19 页：真实调用 2：两条工单，按把握度分流 -->
<script setup lang="ts">
const tabs = [
  { label: '明确工单', tag: '礼包扣款', views: [{ label: '结果', src: '/img/playground/ticket-clear.png' }, { label: 'JSON', src: '/img/playground/ticket-clear-json.png' }],
    note: '紧急 90% · <b>billing 99%（把握度 0.99）</b> · 情绪 1.76 → 把握度高于 0.85，<b style="color:var(--gn)">直接分配给账单团队</b>。' },
  { label: '含糊工单', tag: '礼包异常', views: [{ label: '结果', src: '/img/playground/ticket-vague.png' }, { label: 'JSON', src: '/img/playground/ticket-vague-json.png' }],
    note: '紧急 38% · <b>sales 64%（把握度 0.52）</b> · 情绪 0.81 → 把握度低于 0.6，<b style="color:var(--am)">转人工确认</b>。' },
]
</script>

<template>
  <section class="slide demo-slide shots-slide">
<h1>真实调用 2：两条工单，按把握度分流</h1>
<div class="eyebrow">为什么选 Jev ④ · 官方 Playground 实测，分界线沿用上一页</div>
<ShotTabs :tabs="tabs" />
  </section>
</template>
