<!-- 第 24 页：写题规则 ②：题型决定 criteria 和返回值 -->
<template>
  <section class="slide story-slide type-rules-slide">
<h1>写题规则 ②：题型决定 criteria 和返回值</h1>
<div class="eyebrow">上手 ③ · 题型不是随便起名；choice 用对象，score 用有序数组</div>
<div class="story-body">
<div class="type-rule-table" tabindex="0" role="region" aria-label="四种题型的填写规则与返回字段对照表">
<table class="t">
<colgroup><col style="width:13%"/><col style="width:19%"/><col style="width:31%"/><col style="width:37%"/></colgroup>
<thead><tr><th scope="col">type / 用途</th><th scope="col">criteria 格式</th><th scope="col">填写示例</th><th scope="col">返回字段 / 注意事项</th></tr></thead>
<tbody>
<tr><th scope="row"><code>noul</code><span class="rule-description">是非判断</span></th><td><b>不需要</b><span class="rule-description">在 instructions 中写判断条件</span></td><td><code>instructions:</code><br/><code>'是否要求马上处理？'</code></td><td><code>noul</code>：0～1 的“是”的概率。<span class="rule-description">返回的是概率，不是 true / false。</span></td></tr>
<tr><th scope="row"><code>choice</code><span class="rule-description">从选项中选一个</span></th><td><b>对象 { }</b><span class="rule-description">选项标识 → 选项说明</span></td><td><code>criteria: {</code><br/><code>  billing: '账单问题',</code><br/><code>  other: '其他' }</code></td><td><code>choice</code>：选中的自定义标识。<br/><code>probabilities</code>：各项概率。<br/><code>confidence</code>：把握度。<span class="rule-description">不要把选项对象写成数组。</span></td></tr>
<tr><th scope="row"><code>score</code><span class="rule-description">按等级打分</span></th><td><b>有序数组 [ ]</b><span class="rule-description">等级说明从低到高排列</span></td><td><code>criteria: [</code><br/><code>  '冷静', '不满但礼貌',</code><br/><code>  '非常愤怒' ]</code></td><td><code>score</code>：评分，可为小数。<br/><code>probabilities</code>、<code>confidence</code>。<span class="rule-description">示例的三个等级对应 0、1、2；不是选项对象。</span></td></tr>
<tr><th scope="row"><code>box</code><span class="rule-description">图像定位 · 实验</span></th><td><b>不需要</b><span class="rule-description">另需图片资产与目标描述</span></td><td><code>instructions:</code><br/><code>'图片中搜索栏的位置'</code><span class="rule-description">需同时提供图片，不能只传文字。</span></td><td><code>box</code>：top / bottom / left / right，0～1 比例；<code>confidence</code>：把握度。<span class="rule-description">图片格式与实验请求头要求以当前文档为准。</span></td></tr>
</tbody>
</table>
</div>
<div class="takeaway">同一材料可同时提多题：<code>department</code> 用 choice，<code>is_urgent</code> 用 noul，<code>frustration</code> 用 score。</div>
</div>
  </section>
</template>
