<!-- 第 24 页：应用方向：8 个可以先试的场景 -->
<script setup lang="ts">
const rows = [
  { label: '常见用法', note: '已有产品或案例在用', color: 'gn', items: [
    { n: '01', t: '内容初审', type: 'noul', q: '这条评论要人工复核吗？', a: '是 0.87' },
    { n: '02', t: '工单分流', type: 'choice', q: '这条工单交给哪个团队？', a: 'billing' },
    { n: '03', t: '浏览器 Agent', type: 'choice', q: '下一步点页面上哪个元素？', a: '#12 搜索按钮' },
    { n: '04', t: 'AI 功能路由', type: 'choice', q: '交给规则、小模型还是大模型？', a: '小模型' },
  ] },
  { label: '值得一试', note: '设想 · 待验证', color: 'pu', items: [
    { n: '05', t: '搜索意图', type: 'choice', q: '“找最近充值失败的订单”', a: '订单筛选' },
    { n: '06', t: '告警分级', type: 'score', q: '这条报错有多严重？', a: '2 · 紧急' },
    { n: '07', t: '自适应 UI', type: 'choice', q: '用户想记账、建日程还是记笔记？', a: '记账卡片' },
    { n: '08', t: '研发标签', type: 'choice', q: '这个改动属于哪一类？', a: 'Bug 修复' },
  ] },
]
</script>

<template>
  <section class="slide story-slide uses-slide">
<h1>应用方向：8 个可以先试的场景</h1>
<div class="eyebrow">用在哪里 ⑤ · “读一段内容，选一个答案”的环节都适合</div>
<div class="story-body">
<div class="uses">
  <div v-for="r in rows" :key="r.label" class="uses-row" :class="r.color">
    <div class="uses-label"><b>{{ r.label }}</b><small>{{ r.note }}</small></div>
    <div class="uses-grid">
      <div v-for="it in r.items" :key="it.n" class="use">
        <div class="use-hd"><i>{{ it.n }}</i><b>{{ it.t }}</b><span class="use-type">{{ it.type }}</span></div>
        <p>{{ it.q }}</p>
        <div class="use-a">→ {{ it.a }}</div>
      </div>
    </div>
  </div>
</div>
<div class="takeaway"><b>游戏平台可以先从这三处试起：</b>评论 / 聊天初审 · 充值和封号工单分流 · 玩家反馈打标签。</div>
</div>
  </section>
</template>
