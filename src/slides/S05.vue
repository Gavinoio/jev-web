<!-- 第 05 页：Prompt 与幻觉：问法决定答案，答案未必是真的 -->
<template>
  <section class="slide prompt-slide">
<div class="prompt-page">
  <h1>Prompt 与幻觉：问法决定答案，答案未必是真的</h1>
  <div class="eyebrow">AI 基础 ③ · 写清任务能减少乱编，但不能杜绝</div>
  <div class="prompt-layout">
  <div class="prompt-grid">
    <section class="prompt-card prompt-card--blue">
      <div class="prompt-label">PROMPT · 提示词</div>
      <h2>写给 AI 的「任务说明书」</h2>
      <p>Prompt 就是我们给 AI 的指令，告诉它要做什么、按照什么规则做，以及希望得到什么结果。</p>
      <p>就像给同事安排工作，需求描述得越清楚，AI 越容易给出符合预期的回答。</p>
      <div class="prompt-example">
        <div class="prompt-subtitle">举个例子</div>
        <p>「请判断这条用户评论是好评、中评还是差评，只返回判断结果。」</p>
      </div>
      <div class="prompt-in-jev">
        <div class="prompt-subtitle">在 Jev 中</div>
        <p>Prompt 主要用来描述判断任务、判断标准和可选答案。</p>
      </div>
    </section>
    <section class="prompt-card prompt-card--pink">
      <div class="prompt-label">HALLUCINATION · 幻觉</div>
      <h2>AI 一本正经地「胡说八道」</h2>
      <p>幻觉是指 AI 生成了看似合理、实际上却不正确的内容，例如编造事实、数据或不存在的引用。</p>
      <p>因为回答流畅、语气肯定，并不代表内容真实可靠。</p>
      <div class="prompt-example prompt-example--pink">
        <div class="prompt-subtitle">举个例子</div>
        <p>让 AI 推荐三篇学术论文，它却编造了一篇根本不存在的论文，还附上作者和发表年份。</p>
      </div>
      <div class="prompt-in-jev">
        <div class="prompt-subtitle">在 Jev 中</div>
        <p>结果被限制在预设选项内，减少自由编造的空间，但仍有可能判断错误。</p>
      </div>
    </section>
  </div>
  <div class="prompt-takeaway">AI 说得有道理，不代表一定正确；Jev 限制了答案范围，也不代表一定选对。</div>
  </div>
</div>
  </section>
</template>
