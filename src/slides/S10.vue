<!-- 第 10 页：真实调用 1：四种题型的真实输出 -->
<script setup lang="ts">
const P = '/img/playground/'
const tabs = [
  { label: '是非题', tag: 'Noul', views: [{ label: '结果', src: P + 'noul.png' }, { label: 'JSON', src: P + 'noul-json.png' }],
    note: 'is_urgent：<b>91% true</b>（JSON 里是 0.91）。返回的是“是”的概率，不是 true / false，程序自己决定多少算紧急。' },
  { label: '单选题', tag: 'Choice', views: [{ label: '结果', src: P + 'choice.png' }, { label: 'JSON', src: P + 'choice-json.png' }],
    note: 'department：<b>billing 99%</b>，其余选项的概率一并返回，把握度（confidence）0.99。' },
  { label: '打分题', tag: 'Score', views: [{ label: '结果', src: P + 'score.png' }, { label: 'JSON', src: P + 'score-json.png' }],
    note: 'frustration：<b>1.74</b>（0～2），介于“不满但礼貌”和“非常愤怒”之间，把握度 61%（JSON 截图为另一次运行：1.75、0.62）。' },
  { label: '图像题', tag: 'Box · 实验', views: [{ label: '结果', src: P + 'box.png' }, { label: '输入图片', src: P + 'box-image.png' }, { label: 'JSON', src: P + 'box-json.png' }],
    note: '实验功能，这次<b>没找准</b>：“能看到机器人”只有 12%，定位框几乎盖住半张图，把握度 0.02。把握度这么低时，程序应直接丢弃结果。' },
]
</script>

<template>
  <section class="slide demo-slide shots-slide">
<h1>真实调用 1：四种题型的真实输出</h1>
<div class="eyebrow">认识 Jev ③ · 官方 Playground 实测，前三题同一条工单</div>
<ShotTabs :tabs="tabs" />
  </section>
</template>
