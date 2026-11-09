<!-- 第 13 页：写题规则 ①：哪些固定，哪些自己定义 -->
<template>
  <section class="slide story-slide field-slide">
<h1>写题规则 ①：哪些固定，哪些自己定义</h1>
<div class="eyebrow">动手调用 ③ · 蓝紫照文档写，黄绿按业务写</div>
<div class="story-body">
<div class="fg">
  <div class="fg-code">
<pre>{
  <span class="fx">"model"</span>: <span class="tv">"jev-latest"</span>,
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
  </div>
  <div class="fg-rows">
    <div class="fg-row cy">
      <div class="fg-hd"><b>固定字段</b><em>不能改</em></div>
      <div class="fg-ex"><i>model</i><i>state</i><i>questions</i><i>type</i><i>instructions</i><i>criteria</i></div>
      <p>接口规定的名字，照抄即可；要不要 criteria 看题型。</p>
    </div>
    <div class="fg-row pu">
      <div class="fg-hd"><b>规定的值</b><em>只能选</em></div>
      <div class="fg-ex"><i>noul</i><i>choice</i><i>score</i><i>box · 实验</i><i>jev-latest</i></div>
      <p>type 不能自创题型；model 填服务支持的模型名。</p>
    </div>
    <div class="fg-row am">
      <div class="fg-hd"><b>自己命名</b><em>随便起</em></div>
      <div class="fg-ex"><i>department</i><i>billing</i><i>technical</i><i>other</i></div>
      <p>题名改成 category，读取时就用 answers.category。</p>
    </div>
    <div class="fg-row gn">
      <div class="fg-hd"><b>自己填写</b><em>业务来写</em></div>
      <div class="fg-ex"><span>材料 state</span><span>题干 instructions</span><span>选项说明</span></div>
      <p>写得越清楚，判断越准；怎么写清楚见第 15 页。</p>
    </div>
  </div>
</div>
<div class="takeaway"><code>other</code> 也是自己起的选项名，不是保留字段：除了蓝色和紫色，其余都可以按业务来写。</div>
</div>
  </section>
</template>
