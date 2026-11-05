<!-- 第 06 页：Agent（智能体）：大模型 + 工具 + 循环 -->
<template>
  <section class="slide agent-slide">
<h1>Agent（智能体）：大模型 + 工具 + 循环</h1>
<div class="eyebrow">先备知识 · Agent</div>
<div class="agent-page">
  <div class="agent-flow-panel">
    <div class="agent-flow">
      <div class="agent-flow-step agent-cy"><strong>想</strong><span>决定下一步</span></div>
      <span class="agent-arrow">→</span>
      <div class="agent-flow-step agent-pu"><strong>做</strong><span>调用工具</span></div>
      <span class="agent-arrow">→</span>
      <div class="agent-flow-step agent-gn"><strong>看</strong><span>检查结果</span></div>
    </div>
    <div class="agent-loop">↻　循环执行，直到任务完成</div>
  </div>
  <div class="agent-content">
    <section class="agent-card agent-definition">
      <h2>Agent 是什么？</h2>
      <p>Agent（智能体）是一种能根据任务目标，自主决定下一步行动，并调用工具完成任务的 AI 系统。</p>
      <hr />
      <h2>它是怎么工作的？</h2>
      <p>大模型负责判断和选择，工具负责实际执行；执行一步后，再根据结果决定下一步。</p>
    </section>
    <section class="agent-card agent-example">
      <h2>举个例子</h2>
      <p class="agent-quote">「帮我找下周五去上海的机票」</p>
      <div class="agent-task-list">
        <div class="agent-task-step"><span>01</span><div><strong>搜索航班</strong><small>查询有哪些航班</small></div></div>
        <div class="agent-task-step"><span>02</span><div><strong>比较筛选</strong><small>对比价格、时间和中转情况</small></div></div>
        <div class="agent-task-step"><span>03</span><div><strong>给出推荐</strong><small>推荐合适航班，确认后再预订</small></div></div>
      </div>
    </section>
  </div>
  <div class="agent-why">
    <div class="agent-why-title"><span>◷</span><strong>为什么 Agent 执行任务可能比较慢？</strong></div>
    <p>复杂任务需要反复判断、调用工具和检查结果，步骤越多，通常耗时越长。</p>
  </div>
</div>
  </section>
</template>
