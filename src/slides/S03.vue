<!-- 第 03 页：大模型的本质：猜下一个词 -->
<template>
  <section class="slide">
<h1>大模型的本质：猜下一个词</h1>
<div class="eyebrow">AI 基础 ① · 逐字生成，所以写得越长越慢</div>
<div class="cols c12" style="align-items:center">
<div class="nw-steps">
<p class="nw-lead"><b>大模型</b>（LLM）回答问题，不是一次想好整段，而是一个字一个字往外写：</p>
<div class="nw-step"><span>01</span><div><b>看前文</b><small>读完已经写出来的全部内容</small></div></div>
<div class="nw-step"><span>02</span><div><b>猜下一个字</b><small>给每个候选打分，挑一个——右边就是这一步</small></div></div>
<div class="nw-step"><span>03</span><div><b>接上再猜</b><small>把新字接到末尾，重复，直到写完</small></div></div>
<p class="nw-note">所以回答像打字机一样逐字出现：<b>写得越长，越慢、越贵</b>。</p>
</div>
<NextWord />
</div>
<div class="takeaway">传统大模型一步步生成回答，而 Jev <b>直接给出判断结果和对应概率</b>。</div>
  </section>
</template>
