<!-- 第 14 页：写题规则 ②：题型决定 criteria 和返回值 -->
<template>
  <section class="slide story-slide type-rules-slide">
<h1>写题规则 ②：题型决定 criteria 和返回值</h1>
<div class="eyebrow">动手调用 ④ · 选项用对象，等级用有序数组</div>
<div class="story-body">
<div class="tr-table">
  <div class="tr-hd"><span>题型</span><span>criteria 怎么写</span><span></span><span>返回什么</span></div>

  <div class="tr-row cy">
    <div class="tr-type"><code>noul</code><span>是非判断</span></div>
    <div class="tr-crit"><span class="tr-none">不需要</span><small>判断条件直接写在 instructions 里</small></div>
    <div class="tr-arrow">→</div>
    <div class="tr-out">
      <div class="viz viz-noul"><div class="vb"><i style="width:91%"></i></div><div class="vl"><span>否</span><span>是</span></div></div>
      <div class="tr-val"><code>"noul": 0.91</code><small>“是”的概率，不是 true / false</small></div>
    </div>
  </div>

  <div class="tr-row pu">
    <div class="tr-type"><code>choice</code><span>单选</span></div>
    <div class="tr-crit"><pre>{ <b>"billing"</b>: "付款、扣费…",
  <b>"other"</b>: "以上都不是" }</pre><small>对象：选项标识 → 选项说明</small></div>
    <div class="tr-arrow">→</div>
    <div class="tr-out">
      <div class="viz viz-choice">
        <div><span>billing</span><i style="width:99%"></i></div>
        <div><span>technical</span><i style="width:3%"></i></div>
        <div><span>other</span><i style="width:0"></i></div>
      </div>
      <div class="tr-val"><code>"choice": "billing"</code><small>附各项概率和把握度 0.99</small></div>
    </div>
  </div>

  <div class="tr-row gn">
    <div class="tr-type"><code>score</code><span>打分</span></div>
    <div class="tr-crit"><pre>[ "冷静陈述", "不满但礼貌",
  "非常愤怒" ]</pre><small>有序数组：从低到高，依次是 0、1、2</small></div>
    <div class="tr-arrow">→</div>
    <div class="tr-out">
      <div class="viz viz-score"><div class="vt"><i></i><i></i><i></i><b style="left:87.5%"></b></div><div class="vl"><span>0</span><span>1</span><span>2</span></div></div>
      <div class="tr-val"><code>"score": 1.75</code><small>可以是小数；顺序写反，分数就反了</small></div>
    </div>
  </div>

  <div class="tr-row am">
    <div class="tr-type"><code>box</code><span>图像定位 <em>实验</em></span></div>
    <div class="tr-crit"><span class="tr-none">不需要</span><small>另传图片，在 instructions 里描述目标</small></div>
    <div class="tr-arrow">→</div>
    <div class="tr-out">
      <div class="viz viz-box"><i style="top:4%;bottom:4%;left:4%;right:45%"></i></div>
      <div class="tr-val"><code>"box": { top, left, … }</code><small>上下左右四条边，都是 0～1 的比例</small></div>
    </div>
  </div>
</div>
<div class="takeaway">同一条材料可以一次提多道题：<code>is_urgent</code> 用 noul，<code>department</code> 用 choice，<code>frustration</code> 用 score，一次请求全部返回。</div>
</div>
  </section>
</template>
