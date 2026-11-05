<!-- 第 18 页：同一条客服流程，哪些步骤值得用 Jev？ -->
<template>
  <section class="slide story-slide selection-slide">
<h1>同一条客服流程，哪些步骤值得用 Jev？</h1>
<div class="eyebrow">从具体任务选方案 · 一条工单的四个步骤，各用各的工具</div>
<div class="story-body">
<div class="flow-row"><div class="flow-step "><div class="flow-n">01</div><div class="flow-task">查订单：有没有付款、是否重复扣款</div><div class="flow-tool">数据库 + 业务代码</div><div class="flow-why">有明确事实可查，不让模型去猜</div></div><div class="flow-arrow">→</div><div class="flow-step hot"><div class="flow-n">02</div><div class="flow-task">读玩家描述，判断交给哪个团队</div><div class="flow-tool">Jev / 结构化输出</div><div class="flow-why">要理解语义，但结果只是选一个选项</div></div><div class="flow-arrow">→</div><div class="flow-step "><div class="flow-n">03</div><div class="flow-task">给大量历史反馈打固定标签</div><div class="flow-tool">Jev / 分类模型</div><div class="flow-why">用同一批标注数据比质量和成本</div></div><div class="flow-arrow">→</div><div class="flow-step "><div class="flow-n">04</div><div class="flow-task">解释处理结果，写一段回复</div><div class="flow-tool">回复模板 / 通用大模型</div><div class="flow-why">需要生成文字，承诺仍受规则约束</div></div></div>
<div class="vs-strip">
<div class="vs-q">“便宜模型 + JSON 输出，不也能分类吗？”</div>
<div class="vs-card"><div class="vs-h">通用模型 · JSON 输出</div><code>{"department": "billing"}</code><small>只有答案；要概率得另想办法 · 输出 Token 照常计费</small></div>
<div class="vs-card hot"><div class="vs-h">Jev</div><code>billing 0.90 · technical 0.06 · other 0.04</code><small>答案限定在选项内，附各项概率 · 输出免费</small></div>
</div>
<div class="takeaway">值得先测的是：选项明确、调用量大、用户在等的环节。Jev 接手其中一步，不必替换整条流程。</div>
</div>
  </section>
</template>
