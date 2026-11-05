<!-- 第 23 页：写题规则 ①：哪些固定，哪些自己定义？ -->
<template>
  <section class="slide story-slide">
<h1>写题规则 ①：哪些固定，哪些自己定义？</h1>
<div class="eyebrow">上手 ② · 字段名、规定类型、自己命名、自己填写，分开看</div>
<div class="story-body">
<div class="cols c2 api-example field-guide">
<div class="card cy">
<div class="tag">沿用刚才的工单 · 颜色区分四种内容</div>
<pre class="jv">{
  <span class="fx">"model"</span>: <span class="tx">"jev-latest"</span>,
  <span class="fx">"state"</span>: <span class="tx">"充值扣款了，但道具一直没到账。"</span>,
  <span class="fx">"questions"</span>: {
    <span class="nm">"department"</span>: {
      <span class="fx">"type"</span>: <span class="tv">"choice"</span>,
      <span class="fx">"instructions"</span>: <span class="tx">"这条工单的首接团队是谁？"</span>,
      <span class="fx">"criteria"</span>: {
        <span class="nm">"billing"</span>: <span class="tx">"支付、扣款、到账、退款问题"</span>,
        <span class="nm">"technical"</span>: <span class="tx">"与支付无关的登录或功能故障"</span>,
        <span class="nm">"other"</span>: <span class="tx">"其他或信息不足"</span>
      }
    }
  }
}</pre>
<div class="legend"><span class="fx">■ 固定字段</span>　<span class="tv">■ 规定类型</span><br/><span class="nm">■ 自己命名</span>　<span class="tx">■ 自己填写</span></div>
</div>
<div class="api-notes">
<div class="card"><div class="tag fx">蓝色 · 接口规定的字段名</div><p><code>model</code>、<code>state</code>、<code>questions</code>、<code>type</code>、<code>instructions</code>、<code>criteria</code> 不能随意改名；是否需要 <code>criteria</code> 取决于题型。</p></div>
<div class="card pu"><div class="tag">紫色 · 规定的类型值</div><p><code>type</code> 按支持的题型填写：<code>noul</code>、<code>choice</code>、<code>score</code>、实验性 <code>box</code>，不能自创类型。</p></div>
<div class="card"><div class="tag nm">黄色 · 题名和选项标识自己起</div><p><code>department</code> 可改成 <code>category</code>；<code>billing</code> 等标识也可自定。改题名后，读取路径同步改为 <code>answers.category</code>。</p></div>
<div class="card gn"><div class="tag">绿色 · 内容自己填，模型选受支持版本</div><p>材料、题干和选项说明由你填写；<code>model</code> 的值须是服务支持的模型名，不是随意起名。</p></div>
</div>
</div>
<div class="takeaway">固定的是字段名与类型约定；自定义的是题名、选项标识和判断内容。<code>other</code> 也是自定义选项，不是保留字段。</div>
</div>
  </section>
</template>
