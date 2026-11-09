<!-- 第 15 页：写题规则 ③：把模糊边界写清楚 -->
<template>
  <section class="slide story-slide">
<h1>写题规则 ③：把模糊边界写清楚</h1>
<div class="eyebrow">动手调用 ⑤ · 同一条工单，换个问法，结果更可靠</div>
<div class="story-body">
<div class="question-sample">玩家原话：<b>“充值扣款了，但道具一直没到账。”</b></div>
<div class="qa-compare">
<div class="qa-col bad">
<div class="qa-tag">✗ 模糊的问法</div>
<div class="qa-q">“这属于什么问题？”</div>
<div class="qa-opts"><span>充值</span><span>BUG</span><span>售后</span></div>
<ul class="qa-why"><li>充值和售后重叠：“没到账”两边都说得通</li><li>“BUG”范围太宽，什么都能往里放</li><li>没有出口：信息不够也只能硬选一个</li></ul>
</div>
<div class="qa-arrow">→</div>
<div class="qa-col good">
<div class="qa-tag">✓ 清楚的问法</div>
<div class="qa-q">“这条工单的首接团队是谁？”</div>
<div class="qa-opts def"><span><b>billing</b>支付、扣款、到账、退款</span><span><b>technical</b>与支付无关的登录、功能故障</span><span><b>other</b>以上都不是，或信息不够</span></div>
<ul class="qa-why"><li>只问一件事：交给哪个团队</li><li>每个选项写清边界，“没到账”明确归 billing</li></ul>
</div>
</div>
<div class="qa-checks"><span class="qa-checks-t">写题四检查</span><span><i>1</i>一题只问一件事</span><span><i>2</i>选项不重叠，重叠就写优先级</span><span><i>3</i>留一个“其他”出口</span><span><i>4</i>拿反例测一遍</span></div>
<div class="takeaway">分类标准由业务来定：把边界写进选项说明，模型才有依据可选。</div>
</div>
  </section>
</template>
