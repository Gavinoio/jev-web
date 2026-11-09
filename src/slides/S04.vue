<!-- 第 04 页：Token 与上下文：模型按片段读、按片段计费 -->
<template>
  <section class="slide">
<h1>Token 与上下文：模型按片段读、按片段计费</h1>
<div class="eyebrow">AI 基础 ② · 一次请求能装多少内容，也按 Token 算</div>
<div class="cols c2 tc-cols">
<div class="card cy tc-card">
<div class="tag">TOKEN · 词元</div>
<h3>模型读的不是“字”，是<b>片段</b></h3>
<p class="tc-sub">计费和长度上限都按 token 算。</p>
<TokenViz />
<ul class="tc-points"><li>中英文切法不同，同一句话的 token 数也不同</li><li>费用 ≈ 输入 token × 输入单价 + 输出 token × 输出单价</li></ul>
</div>
<div class="card pu tc-card">
<div class="tag">CONTEXT WINDOW · 上下文窗口</div>
<h3>一次请求<b>最多能装多少</b>内容</h3>
<p class="tc-sub">上下文窗口 = 单次请求的 token 上限；说明、历史、材料、回答<b>全都算在里面</b>。</p>
<div class="ctx-req">
<div class="ctx-req-h">一次请求实际发给模型的内容<small>数字为示意</small></div>
<div class="ctx-row"><span>系统说明</span><b>200</b></div>
<div class="ctx-row"><span>历史对话（前 10 轮）</span><b>6,000</b></div>
<div class="ctx-row"><span>本次工单 + 题目</span><b>400</b></div>
<div class="ctx-row"><span>留给回答</span><b>500</b></div>
<div class="ctx-total"><span>合计 <b>7,100</b> / 上限 <b>8,000</b> token</span><span class="ctx-meter"><i style="width:89%"></i></span><em>89%</em></div>
</div>
<ul class="tc-points"><li>再多聊几轮就会超出上限：最早的对话会被截掉或压缩</li><li>无关内容不仅占地方，还可能干扰判断——先裁剪，再验证</li></ul>
</div>
</div>
<div class="takeaway">给模型的材料不是越多越好：<b>保留与问题相关的内容，再用实际样本验证效果。</b></div>
  </section>
</template>
