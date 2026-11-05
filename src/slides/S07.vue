<!-- 第 07 页：MCP、Skill 与 Harness -->
<template>
  <section class="slide toolchain-slide">
<h1>MCP、Skill 与 Harness</h1>
<div class="eyebrow">先备知识 · AI Agent 的工具与运行机制</div>
<div class="toolchain-body">
<div class="cols c3 compact toolchain-cards">
  <div class="card cy toolchain-card">
    <div class="tag">MCP · 管连接</div>
    <h3>AI 的「USB-C 接口」</h3>
    <div class="toolchain-subtitle">Model Context Protocol · 模型上下文协议</div>
    <dl class="toolchain-facts"><div><dt>是什么</dt><dd>一套开放协议，规定 AI 应用怎样连接外部工具和数据。工具方写一次 MCP Server，所有支持 MCP 的 AI 都能接。</dd></div><div><dt>谁定的</dt><dd>Anthropic 2024 年 11 月提出并开源；2025 年 12 月捐给 Linux 基金会旗下的 Agentic AI Foundation 中立维护。</dd></div><div><dt>能提供</dt><dd>工具（Tools）· 资料（Resources）· 提示模板（Prompts）</dd></div></dl>
    <div class="toolchain-example toolchain-example--cy">
      <div>举个例子</div>
      <p>接入 GitHub 的 MCP Server，AI 就能直接读 Issue、提 PR。</p>
    </div>
  </div>
  <div class="card pu toolchain-card">
    <div class="tag">SKILL · 管方法</div>
    <h3>AI 的「操作手册」</h3>
    <div class="toolchain-subtitle">Agent Skills · 可复用的技能包</div>
    <dl class="toolchain-facts"><div><dt>是什么</dt><dd>一个文件夹：<code>SKILL.md</code> 写明名称、什么时候用、怎么做，可附脚本和参考资料。</dd></div><div><dt>谁定的</dt><dd>Anthropic 2025 年 10 月推出，随后公开为开放规范（agentskills.io），多家 Agent 工具都已支持。</dd></div><div><dt>省在哪</dt><dd>平时只读一行描述，任务匹配时才加载全文，不白占上下文。</dd></div></dl>
    <div class="toolchain-example toolchain-example--pu">
      <div>举个例子</div>
      <p>把团队代码规范做成 Skill，AI 审查代码时自动照着做。</p>
    </div>
  </div>
  <div class="card gn toolchain-card">
    <div class="tag">HARNESS · 管运行</div>
    <h3>AI 的「运行系统」</h3>
    <div class="toolchain-subtitle">Agent Harness · 套在模型外面的那层程序</div>
    <dl class="toolchain-facts"><div><dt>是什么</dt><dd>模型本身只会“读输入、出文字”；Harness 负责循环调用模型、执行工具、整理上下文。</dd></div><div><dt>谁定的</dt><dd>不是某个标准，而是一类工程做法的统称，常说 <b>Agent = 模型 + Harness</b>。</dd></div><div><dt>管什么</dt><dd>任务循环 · 工具执行 · 上下文压缩 · 权限确认</dd></div></dl>
    <div class="toolchain-example toolchain-example--gn">
      <div>举个例子</div>
      <p>Claude Code、Codex CLI：读代码 → 修改 → 跑测试 → 看结果再改。</p>
    </div>
  </div>
</div>
<div class="takeaway toolchain-takeaway">MCP 负责连接工具，Skill 告诉 AI 怎么做，Harness 负责让整个任务跑起来。<br/><span style="color:var(--gn)">而 Agent 每一步都要先判断“下一步做什么”——这个判断环节，正是 Jev 可以接手的地方。</span></div>
</div>
  </section>
</template>
