<!-- 第 26 页：带走三句话：模型判断，代码计算，用户确认 -->
<template>
  <section class="slide story-slide recap-slide">
<h1>带走三句话：模型判断，代码计算，用户确认</h1>
<div class="eyebrow">总结 · 全场的工单和输入框，都是这三步</div>
<div class="story-body">
<div class="s3">
  <div class="s3-col cy">
    <div class="s3-top"><span>01</span><em>模型判断</em></div>
    <div class="s3-big">让模型做选择题，<br/>别让它写作文</div>
    <p>只要一个答案，就给它选项，让它返回概率。</p>
    <div class="s3-ex"><div><b>工单</b>交给 billing，把握度 0.90</div><div><b>输入框</b>识别出你想记一笔账</div></div>
  </div>
  <div class="s3-col pu">
    <div class="s3-top"><span>02</span><em>代码计算</em></div>
    <div class="s3-big">能算准的，<br/>交给代码</div>
    <p>日期、金额、查订单，代码算，每次结果都一样。</p>
    <div class="s3-ex"><div><b>工单</b>查订单，确认是否重复扣款</div><div><b>输入框</b>解析出金额和日期</div></div>
  </div>
  <div class="s3-col gn">
    <div class="s3-top"><span>03</span><em>用户确认</em></div>
    <div class="s3-big">拿不准的，<br/>交给人</div>
    <p>把握度低就复核；退款、删除这类操作必须有人确认。</p>
    <div class="s3-ex"><div><b>工单</b>低于 0.6 或要退款，转人工</div><div><b>输入框</b>生成卡片，由你点确认</div></div>
  </div>
</div>
<div class="s3-ask">下次调用大模型之前，先问一句：这里要的是<b>一段回答</b>，还是<b>一个判断</b>？</div>
</div>
  </section>
</template>
