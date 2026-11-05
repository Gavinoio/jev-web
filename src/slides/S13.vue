<!-- 第 13 页：为什么可控：判断之后，还能安排复核 -->
<template>
  <section class="slide story-slide confidence-slide">
<h1>为什么可控：判断之后，还能安排复核</h1>
<div class="eyebrow">为什么值得比较 · 可控</div>
<div class="ctl">
<div class="ctl-top">
<div class="ctl-ticket"><span>礼包工单</span>“买礼包扣了两次钱，道具还没到账！”</div>
<div class="ctl-arrow">→</div>
<div class="ctl-model"><span>模型建议</span><b>billing</b> 账单团队 · 把握度 <b>0.90</b></div>
</div>
<div class="ctl-q">收到建议后，程序按把握度分流：</div>
<div class="ctl-scale">
<div class="ctl-bar"><i class="z am"></i><i class="z pu"></i><i class="z gn"></i><span class="ctl-mark" style="left:90%"><em>这条工单 0.90</em></span></div>
<div class="ctl-ticks"><span style="left:0">0</span><span style="left:60%">0.6</span><span style="left:85%">0.85</span><span style="left:100%">1</span></div>
</div>
<div class="ctl-zones">
<div class="ctl-zone am"><h3>交给人工</h3><p>把握度低、材料不足；或涉及退款、封号等重要操作——<b>分数再高也要审核</b>。</p></div>
<div class="ctl-zone pu"><h3>再检查一次</h3><p>交给规则或另一个模型核对，仍拿不准就转人工。</p></div>
<div class="ctl-zone gn"><h3>直接分配</h3><p>只分配给对应团队，<b>不会自动退款</b>。</p></div>
</div>
<div class="ctl-note">0.6、0.85 只是示例：先用历史工单看“不同分数下实际错了多少”，再决定分界线画在哪。</div>
<div class="takeaway">模型给出建议和把握度；分界线画在哪、哪些操作必须人工，由程序和业务决定。</div>
</div>
  </section>
</template>
