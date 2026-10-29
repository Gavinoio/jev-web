---
theme: default
title: Jev：给程序做判断的模型
info: 内部技术分享
colorSchema: dark
aspectRatio: 16/9
canvasWidth: 1120
fonts:
  sans: Microsoft YaHei
  mono: Consolas
transition: fade
mdc: true
---

<div class="cv">
<div class="cv-left">
<div class="eyebrow">INTERNAL TECH TALK · JEV · SYSTEM ONE MODEL</div>
<h1>一个不写字的 AI</h1>
<div class="sub">Jev：给程序做判断的模型</div>
<div class="takeaway">ChatGPT 给人写答案，<br/>Jev 给程序做<b>判断</b>。</div>
<div class="presenter"><span class="lb">分享人</span><span class="nm">黄冠豪</span><span class="dp">研发中心 / 游戏平台项目部</span></div>
</div>
<div class="cv-right">
<img class="shot" src="/img/machine.jpeg" />
<div class="cap">示意图（含百分比仅为插画）· Choice · Score · Yes/No</div>
</div>
</div>

<!--
开场 30 秒。先别讲名词，先给结论：今天讲的这个模型不生成文字，最近有不少开发者开始讨论它。问大家一个问题：你们代码里调大模型的地方，有多少其实只是在让它"选一个"？带着这个问题听。
-->

---
class: agenda-slide
---

# 今天的路线

<div class="agenda-page">
  <div class="agenda-subtitle">AGENDA · 从了解 Jev 到实际应用</div>

  <div class="agenda-grid">
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>01</span><h2>先备知识</h2></div>
      <p>了解 AI 基础概念</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>02</span><h2>认识 Jev</h2></div>
      <p>是什么 · 怎么工作</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>03</span><h2>核心优势</h2></div>
      <p>快 · 省 · 准</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>04</span><h2>真实案例</h2></div>
      <p>看看实际表现</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>05</span><h2>应用场景</h2></div>
      <p>适合解决什么问题</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>06</span><h2>上手与落地</h2></div>
      <p>实际操作与使用边界</p>
    </article>
  </div>

  <div class="agenda-highlights">
    <article class="agenda-highlight agenda-highlight--demo">
      <div class="agenda-label"><span class="agenda-icon" aria-hidden="true">▶</span>LIVE DEMO ×5</div>
      <h2>现场演示</h2>
      <p>通过工单分流、即时判断、批量分类等案例，直观体验 Jev 的能力。</p>
    </article>
    <article class="agenda-highlight agenda-highlight--point">
      <div class="agenda-label"><span class="agenda-icon" aria-hidden="true">✦</span>THE POINT</div>
      <h2>一个核心问题</h2>
      <p>日常 AI 应用中，有多少任务其实只需要模型做一个判断或选择？</p>
    </article>
    <article class="agenda-highlight agenda-highlight--reality">
      <div class="agenda-label"><span class="agenda-icon" aria-hidden="true">⚖</span>REALITY CHECK</div>
      <h2>客观看待</h2>
      <p>结合公开资料与实际测试，看看 Jev 的优势、局限和适用场景。</p>
    </article>
  </div>

  <div class="agenda-takeaway">今天不只介绍 Jev 是什么，更重要的是弄清楚：它能解决什么问题，什么时候值得用。</div>
</div>

<!--
按六个主题带过议程。强调三件事：会看到 5 个现场演示；全程围绕“哪些任务只需要模型判断或选择”这个问题；优劣与适用边界会结合公开资料和实际测试说明。
-->

---

# 大模型的本质：猜下一个词

<div class="eyebrow">先备知识 · 大模型（LLM）</div>

<div class="cols c12" style="align-items:center">
<div>

- **大模型**（Large Language Model）回答问题时，并不是一次想好整段答案，而是根据前面的内容，一步步预测接下来该写什么
- 每生成一点内容，就接着预测后面的内容，直到形成完整回答。这个过程叫作 自回归生成
- 回答像打字机一样逐渐出现（流式输出），内容越长，通常越慢、越贵

</div>
<NextWord />
</div>

<div class="takeaway">传统大模型一步步生成回答，而 Jev <b>直接给出判断结果和对应概率</b>。</div>

<!--
类比：输入法联想。你打"今天天气真"，输入法给你一排候选，大模型就是把这件事一个字一个字重复几百次。
点一下候选词演示"采样"。关键句：Jev 只做第一步——打概率，然后就停。
-->

---

# Token 与上下文

<div class="eyebrow">先备知识 · Token 与上下文</div>

<div class="cols c2" style="align-items:center">
<TokenViz />
<div>

### Token（词元）= 模型的"计费字节"
- 模型读的不是"字"，是**片段**；费用和长度限制都按 token 计算
- 不同语言切分方式不同；具体费用看模型的输入、输出单价

### 上下文（Context Window，上下文窗口）= 一块"白板"
- 一次请求能带多少材料，受上下文长度限制
- 对话要保持上下文时，通常会把相关历史一并放进请求
- 过长或无关内容可能影响判断，先裁剪并用样本验证

</div>
</div>

<div class="takeaway">给模型的材料不是越多越好：<b>保留与问题相关的内容，再用实际样本验证效果。</b></div>

<!--
类比：token 就像按字节计费的流量，上下文就像会议室白板，写满只能擦掉最早的。
埋伏笔：后面讲"省"，省的就是输出 token。
-->

---
class: prompt-slide
---

<div class="prompt-page">
  <h1>Prompt 与幻觉</h1>
  <div class="eyebrow">先备知识 · Prompt 与幻觉</div>
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
  <div class="prompt-takeaway">记住这句话：AI 说得有道理，不代表一定正确；Jev 限制了答案范围，也不代表一定选对。</div>
  </div>
</div>

<!--
先看左边：Prompt 就是任务说明，告诉模型要判断什么、按什么标准判断、可以返回哪些答案。举例读一遍就够。
再看右边：模型说得流畅不代表事实真实，可能连论文和引用都是编的。
落到 Jev：结果被限定在预设选项里，能减少自由编造，但它仍可能在选项里选错。强调“范围受限不等于判断正确”。
-->

---
class: agent-slide
---

# Agent（智能体）：大模型 + 工具 + 循环

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

<!--
先看顶部：Agent 会“想、做、看”，根据结果循环决定下一步。
左侧解释概念：模型判断下一步，工具由程序执行；右侧用找机票的例子，展示搜索、筛选、推荐这几步。
再看底部：多步任务需要反复调用模型和工具，所以通常更慢。Agent 负责把任务跑完，而 Jev 可以负责其中适合快速结构化判断的步骤。
-->

---
class: toolchain-slide
---

# MCP、Skill 与 Harness

<div class="eyebrow">先备知识 · AI Agent 的工具与运行机制</div>
<div class="toolchain-body">
<div class="cols c3 compact toolchain-cards">
  <div class="card cy toolchain-card">
    <div class="tag">MCP · 管连接</div>
    <h3>AI 的「通用接口」</h3>
    <div class="toolchain-subtitle">Model Context Protocol</div>
    <p>让 AI 通过统一标准连接外部工具和资料，例如文件、数据库、搜索服务等。</p>
    <div class="toolchain-example toolchain-example--cy">
      <div>举个例子</div>
      <p>让 AI 读取 GitHub 项目中的 Issue。</p>
    </div>
  </div>
  <div class="card pu toolchain-card">
    <div class="tag">SKILL · 管方法</div>
    <h3>AI 的「操作手册」</h3>
    <div class="toolchain-subtitle">可复用的技能包</div>
    <p>把任务步骤、规范和示例整理成技能，按需提供给 AI，减少重复说明。</p>
    <div class="toolchain-example toolchain-example--pu">
      <div>举个例子</div>
      <p>让 AI 按团队规范自动审查代码。</p>
    </div>
  </div>
  <div class="card gn toolchain-card">
    <div class="tag">HARNESS · 管运行</div>
    <h3>AI 的「运行系统」</h3>
    <div class="toolchain-subtitle">Agent Harness</div>
    <p>组织任务步骤、调度工具并管理上下文，让 AI 能连续执行任务。</p>
    <div class="toolchain-example toolchain-example--gn">
      <div>举个例子</div>
      <p>Claude Code 读取代码、修改、测试并反馈。</p>
    </div>
  </div>
</div>
<div class="takeaway toolchain-takeaway">一句话记住：MCP 负责连接工具，Skill 告诉 AI 怎么做，Harness 负责让整个任务跑起来。</div>
</div>

<!--
按顺序指三张卡：MCP 解决连接，例子是读取 GitHub Issue；Skill 整理可复用的任务方法，例子是按团队规范审查代码；Harness 负责把多步任务、工具调用和上下文组织起来，Claude Code 是例子。
收尾念底部一句话，然后过渡到 Jev：有了 Agent 和工具链的背景，我们来看一个专门负责判断的模型。
-->

---

# Jev 是什么：专门做判断的 AI

<div class="eyebrow">认识 Jev · 它是什么</div>

<div class="cols c2" style="align-items:center">
<div>
<img class="shot" src="/img/compare.jpg" />
</div>
<div class="jev-definition-cards">
<section class="card">
  <div class="tag">01 · 它是什么?</div>
  <h3>专门做快速判断的 AI 模型</h3>
  <p>Jev 是 TypeSafe AI 推出的 System One 模型，不需要生成长篇回答，而是直接返回程序能够使用的判断结果。</p>
</section>
<section class="card">
  <div class="tag">02 · 它能做什么?</div>
  <h3>选择、评分、判断概率</h3>
  <p>比如给工单分类、评估风险高低，或者判断某个条件是否成立。</p>
</section>
<section class="card">
  <div class="tag">03 · 它不能做什么?</div>
  <h3>不负责聊天和创作</h3>
  <p>它不用于写文章、生成代码或自由对话，更适合有明确判断目标的任务。</p>
</section>
</div>
</div>

<div class="takeaway">ChatGPT 擅长生成内容，Jev 擅长直接做判断。它不是要取代 ChatGPT，而是专注做好其中一类任务。</div>

<!--
按顺序讲三张卡：Jev 是 TypeSafe AI 推出的 System One，负责提供程序可用的判断结果；它适合做选择、评分和概率判断，不负责聊天与创作。最后用底部一句话收束。
-->

---

# 题型：是非、单选、打分、图像（实验）

<div class="eyebrow">认识 Jev · 题型</div>

<div class="cols c2" style="align-items:center">
<div>
<img class="shot" src="/img/types.jpg" />
</div>
<div class="type-grid">
<div class="card type-card type-card--noul">
  <div class="tag">01　NOUL · 是非题</div>
  <p><b>判断一件事是否成立，返回「是」的概率（0～1）。</b><br/><span class="type-example">例：工单是否紧急？→ 0.94</span></p>
</div>
<div class="card type-card type-card--choice">
  <div class="tag">02　CHOICE · 单选题</div>
  <p><b>从预设选项中选择一个，并给出各选项的概率。</b><br/><span class="type-example">例：哪个部门处理？→ billing</span></p>
</div>
<div class="card type-card type-card--score">
  <div class="tag">03　SCORE · 打分题</div>
  <p><b>根据设定的等级进行评分，结果可以是小数。</b><br/><span class="type-example">例：客户有多不满？→ 1.7 / 2</span></p>
</div>
<div class="card type-card type-card--box">
  <div class="tag">04　BOX · 图像定位（实验）</div>
  <p><b>在图片中找到指定目标，并返回它所在的位置。</b><br/><span class="type-example">例：商品在哪里？→ 返回四个边界坐标</span></p>
</div>
</div>
</div>

<div class="takeaway">同一份材料，可以一次提交多个问题，让 Jev 并行完成判断，不必逐个提问。</div>

<!--
按顺序讲四种题型：是非题判断成立概率，单选题在预设选项中选择，打分题按等级评分，Box 在图片中定位目标。收尾强调，同一份材料可一次提交多个问题，由 Jev 并行完成判断。
-->

---
class: demo-slide demo-types-slide
---

# 🔴 现场演示 1：四种题型

<div class="eyebrow">认识 Jev · 现场演示</div>

<DemoTypes />

<!--
演示步骤：各选一条是非题、单选题与打分题，观察返回的概率和结果；单选可选 other 示例。框选时选择图片中的不同目标，观察返回的坐标和框。把握度会随模型版本和网络浮动，现场只描述当前返回。
Box 与图片输入需在请求中加 TypeSafe-Danger-Zone-Images: true，官方标注 Dreamer-ready，格式和准确度可能变化，适合原型。
请求失败时说明错误并重试，不引用旧的概率数字。
-->

---

# 一次调用长什么样

<div class="eyebrow">认识 Jev · 一次调用</div>

<div class="cols" style="grid-template-columns:1.7fr 1fr;align-items:center">
<div>

```ts
const res = await fetch('https://api.typesafe.ai/v1/systemone', {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}` },   // 只放服务端！
  body: JSON.stringify({
    model: 'jev-latest',   // 演示用；上线请写死具体版本
    state: '我的月订阅被扣了两次款。可以帮我核对吗？',
    questions: {
      is_urgent:  { type: 'noul',   instructions: '是否要求马上处理？' },
      department: { type: 'choice', instructions: '该由哪个团队处理？', criteria: {
        billing: '付款、扣费、退款', technical: '故障、报错', other: '以上都不是' } },
      frustration:{ type: 'score',  instructions: '客户有多不满？',
        criteria: ['冷静', '不满但礼貌', '非常愤怒'] },
    },
  }),
})
// → answers.is_urgent.noul / answers.department.choice / .probabilities / .confidence
```
<div class="cap" style="font-size:15px">model＝用哪个版本　state＝要判断的材料　questions＝题目　criteria＝选项 / 等级说明　instructions＝题干　confidence＝把握度</div>
</div>
<div>
<img class="shot" src="/img/firstcode.jpg" style="max-height:320px;width:auto;margin:0 auto" />
</div>
</div>

<div class="takeaway">代码读键，别去解析散文；<b>判定之后做什么，由你的 if 决定</b>，Jev 不会替你执行业务。</div>

<!--
对前端最熟悉：就是一个 fetch，三个字段。注意 Key 只能放服务端，别进浏览器——这也是后面 Demo 用本地服务转发的原因。
-->

---

# 为什么快：不写字，一次算完

<div class="eyebrow">为什么值得用 · 快</div>

<div class="cols c2" style="align-items:start;gap:20px">
<div>
<img class="shot" src="/img/parallel-flow.svg" />

<div class="card cy compact" style="margin-top:12px"><div class="tag">为什么更适合判断</div><p>提前给出选项，Jev 直接返回结果和概率，不需要逐字生成一段回答；同一份材料可一次回答多道题。</p></div>

</div>
<div>
<div class="cols c3" style="margin-bottom:12px;gap:10px">
<div class="card"><div class="kpi" style="font-size:34px">70–500<small>ms</small></div><div class="kcap">官方单次延迟</div></div>
<div class="card"><div class="kpi" style="font-size:34px">~76<small>ms</small></div><div class="kcap">网友自报中位数</div></div>
<div class="card"><div class="kpi gn" style="font-size:34px">~250<small>ms</small></div><div class="kcap">本机实测（含跨境网络）</div></div>
</div>
<div class="card pu compact"><div class="tag">一次工单判断</div><p>同一条客户反馈 → 同时判断<b>诉求类型、是否退款、紧急程度</b> → 应用读取结果并处理。</p></div>
<div class="cap" style="margin-top:10px">数字来自不同来源和测量条件，不能直接横向比较；实际延迟受模型、请求和网络影响。</div>
</div>
</div>

<!--
为什么快？大模型像写作文，逐个生成 token；Jev 将输出限定为预先定义的结构化选项。
官方称采用并行采样和新架构，但没有公开完整实现。官方延迟范围、社区自报汇总与本机单次实测的口径不同，不直接横向比较；上线前要用自己的请求和网络测端到端表现。
-->


---

# 为什么省：收费方式与边界

<div class="eyebrow">核心优势 · 费用</div>
<div class="cols c2" style="gap:18px;margin-top:18px;align-items:stretch">
<div class="card cy compact">
<div class="tag">官方 API 价格</div>
<div style="display:flex;align-items:baseline;gap:10px;margin:12px 0"><span class="kpi" style="font-size:48px">$0.042</span><span class="dim">/ 100 万输入 Token</span></div>
<p>输出 Token <b>免费</b>；材料和题目都计入输入。多道题共用材料时，可以减少重复发送。</p>
</div>
<div class="card pu compact">
<div class="tag">费用估算</div>
<div style="display:flex;align-items:center;gap:8px;margin:16px 0;font-size:17px">
<div class="node cy">400 Token<br/><small>每次请求</small></div><span class="arrow">×</span>
<div class="node pu">100 万次<br/><small>调用</small></div><span class="arrow">→</span>
<div class="node gn"><b>$16.80</b><br/><small>输入费用</small></div>
</div>
<p class="dim" style="font-size:15px">计算：400 × 100 万 ÷ 100 万 × $0.042</p>
</div>
</div>
<div class="card am compact" style="margin-top:12px"><div class="tag">省钱不只看单价</div><p>实际费用还取决于<b>输入长度、调用次数、错误率和复核成本</b>。同一任务也要与规则或其他模型比较。</p></div>
<div class="takeaway">用自己的任务和实际费用比较；价格以 <a href="https://typesafe.ai/" target="_blank">TypeSafe 官网</a>和控制台为准。</div>

<!--
截至 2026-10-28，TypeSafe 官网列出的 Jev 输入价格为每百万 token 0.042 美元，输出免费。示例：400 × 100 万 ÷ 100 万 × 0.042 = 16.80 美元，仅为输入费用；材料和题目均计入输入。对比时还要算准确率、复核及人工成本。来源：https://typesafe.ai/
-->


---

# 把握度：让程序知道何时需要复核

<div class="eyebrow">核心优势 · 把握度与分流</div>

<div class="cols c2" style="margin-top:16px;gap:18px;align-items:start">
<div class="card cy compact"><div class="tag">先看懂结果</div><h3>一张工单，模型有多确定？</h3><p>例如，Jev 把工单分为“账单问题”，并给出 <b>90% 把握度</b>。这个数字表示模型的估计，并不保证这一次一定正确。</p><div class="node cy" style="margin-top:10px">工单内容 → 账单问题 · 把握度 90%</div></div>
<div class="card pu compact"><div class="tag">再决定怎么处理 · 示例</div><div style="display:grid;gap:8px;margin-top:10px"><div class="node gn">高把握 → 自动分配</div><div class="node pu">中等把握 → 再检查</div><div class="node am">低把握 → 交人工</div></div><p class="dim" style="font-size:15px;margin-top:8px">分界线由业务风险和实测结果决定。</p></div>
</div>
<div class="card compact" style="margin-top:12px"><div class="tag">怎样判断把握度靠不靠谱？</div><p>把很多条“约 90% 把握”的结果与人工答案对照；如果其中约 90% 确实正确，就说明这一档的把握度比较可靠。这个检查叫<b>校准</b>。</p></div>
<div class="takeaway">这是批量结果的验证，不能保证单次正确；上线前用自己的数据测试。</div>
<!-- 校准是比较预测把握度与实际正确比例的方法。90% 是便于理解的示例，不代表这个项目的实测准确率；分流阈值需要业务数据验证。 -->

---
class: demo-slide demo-types-slide
---

# 🔴 现场演示 2：工单分流

<div class="eyebrow">核心优势 · 现场演示</div>

<DemoTicket />

<!--
演示步骤：在工单分流中先选一条信息清楚的请求，再选一条含糊的请求，比较第一名与第二名概率；拖动“自动放行线”和“复核线”，说明阈值由应用设定。切到 VIP 路由，用相同用户话术配不同客户资料对比判断结果；VIP 信息来自应用状态，不是 Jev 自己查询。结果和把握度会随请求变化，不报固定百分比。
请求失败时说明错误并重试。
-->

---

# 案例地图：四种类型，四个案例

<div class="eyebrow">真实案例 · 总览</div>
<div class="cols c2" style="margin-top:18px">
<div class="card cy"><div class="tag">AGENT 决策</div><h3>每一步选哪个</h3><p>浏览器 Agent</p></div>
<div class="card cy"><div class="tag">新闻筛选</div><h3>为品牌寻找相关话题</h3><p>梭哈.AI · 新闻匹配演示</p></div>
<div class="card pu"><div class="tag">批量处理</div><h3>逐条分类和筛选</h3><p>海量分类</p></div>
<div class="card pu"><div class="tag">招聘初筛</div><h3>从候选人中筛选</h3><p>Jack &amp; Jill · 候选人初步评分</p></div>
</div>
<div class="takeaway">共同点：选项事先存在，模型只需给出判断。</div>

---

# 案例 1｜Browser Use：浏览器 Agent

<div class="eyebrow">真实案例 · Agent 决策</div>

<div class="cols" style="grid-template-columns:1fr 1.1fr;align-items:center">
<div>

- **Browser Use** 的开源项目 `jev-ultrafast`，将网页上的可操作元素整理成编号清单。
- Jev 选择**操作和目标元素**；需要输入文字时，由另一个模型生成文本。
- 作者的机票搜索测试中，优化前后中位耗时为 **9.45 秒 → 7.09 秒**。
- 这是一个任务、每种配置各 3 次的测量，不代表所有网页都能达到同样效果。

</div>
<div>
<img class="shot" src="/img/jev-ultrafast-github.png" style="max-height:240px;object-fit:cover;object-position:top" />
<div class="cap">Browser Use 项目仓库截图（点击放大）</div>
<BeforeAfter title="机票搜索：项目优化前后耗时中位数" :before="{label:'优化前', v:9.45, text:'9.45 s'}" :after="{label:'优化后', v:7.09, text:'7.09 s'}" />
<div class="cap"><a href="https://github.com/browser-use/jev-ultrafast" target="_blank">查看项目与测量说明 ↗</a></div>
</div>
</div>

<!--
来源：https://github.com/browser-use/jev-ultrafast。速度比较是同一项目优化前后各三次运行，并非截图模型与 Jev 的对照；项目作者说明不构成通用可靠性评测。
-->


---
class: news-video-slide
---

# 案例 2｜批量筛新闻：为品牌寻找相关话题

<div class="eyebrow">真实演示 · 新闻匹配测试</div>

<div class="news-video-frame">
<video controls preload="metadata" playsinline class="news-video"><source src="/video/jev-news-demo.mp4" type="video/mp4" /></video>
</div>

<!-- 视频来源：https://x.com/SUOHA_AI/status/2101000339948282090 -->

---

# 案例 3｜1k Papers：批量整理 AI 论文

<div class="eyebrow">真实项目 · 论文分类实验</div>
<div class="cols c2" style="gap:20px;align-items:start;margin-top:18px">
<div><div class="card cy"><div class="tag">1K PAPERS · HASSAN EL MGHARI</div><p>作者在论文浏览项目中尝试用 Jev 把 <b>1,018 篇论文</b>分到 <b>24 个主题</b>，方便按主题查找。</p></div>
<div class="card pu" style="margin-top:12px"><div class="tag">作者报告的分类实验</div><p>Jev 分类费用约 <b>$0.08</b>，每篇请求延迟中位数约 <b>256 毫秒</b>。</p><p class="dim" style="font-size:14px">论文摘要由另一个模型提前生成，费用不包含在 $0.08 中；分类效果仍需验证。</p></div>
<p class="dim" style="font-size:14px"><a href="https://x.com/nutlope/status/2100426999546184123" target="_blank">作者的实验说明 ↗</a></p></div>
<div><img class="shot" src="/img/1kpapers-home.png" style="max-height:290px;object-fit:cover;object-position:top"/><div class="cap">1k Papers 论文浏览网站截图（点击放大）；不代表现有线上标签均由 Jev 生成。</div><p><a href="https://1kpapers.com/" target="_blank">访问 1k Papers ↗</a></p></div></div>
<div class="takeaway">先生成摘要，再做分类；下面用 100 条反馈演示批量判断。</div>
<!-- 来源：作者发布的实验 https://x.com/nutlope/status/2100426999546184123；页面截图仅展示论文网站，不能证明现有线上标签使用 Jev。$0.08 仅是分类阶段，摘要费用另计。 -->

---
class: demo-slide
---

# 🔴 现场演示 3：100 条并行分类

<div class="eyebrow">真实案例 · 现场演示</div>

<DemoBatch />
<!-- 点击并行分类，观察耗时、费用、失败数和与预设答案的一致率。样例一致率不代表真实业务准确率。 -->

---

# 案例 4｜招聘初筛：更快筛选候选人

<div class="eyebrow">真实案例 · Jack &amp; Jill</div>
<div class="cols c2" style="gap:20px;margin-top:18px;align-items:start">
<div>
<div class="card cy"><div class="tag">应用场景 · 候选人初步评分</div><p>招聘平台 <b>Jack &amp; Jill</b> 使用 Jev 对候选人进行初步评分，筛出一部分人选后，再由更强的模型进一步评估。</p></div>
<img class="shot" src="/img/jack-jill-jev.png" style="margin-top:16px;width:100%" />
<div class="cap">官方案例流程图：候选人 → 初筛 → 深入评估 → 招聘经理（点击放大）</div>
<p class="dim" style="font-size:14px;margin-top:14px">对比对象：原流程中的 Gemini 3.1 Flash Lite。</p>
</div>
<div class="card pu"><div class="tag">官方案例 · 初筛阶段对比</div><table class="t"><tbody>
<tr><th>指标</th><th>原模型</th><th>Jev</th></tr>
<tr><td>每千名候选人成本</td><td>$0.755</td><td>$0.092</td></tr>
<tr><td>每个岗位的初筛耗时中位数</td><td>20.3 秒</td><td>10.3 秒</td></tr>
<tr><td>招聘经理选中人选的保留率</td><td>93.9%</td><td>94.6%</td></tr>
</tbody></table><p class="dim" style="font-size:14px;margin-top:10px">保留率差异未达统计显著；数据来自厂商披露的特定流程。</p><a href="https://typesafe.ai/blog/jack-jill-jev-case-study" target="_blank">查看官方案例 ↗</a></div>
</div>
<div class="takeaway">在这个初筛流程中，官方报告成本降低约 88%，耗时约减半。</div>
<!-- 来源：https://typesafe.ai/blog/jack-jill-jev-case-study。质量结果来自对真实岗位的离线测试；保留率差异未达统计显著。成本和耗时针对初筛阶段，不代表整个招聘流程。 -->

---

# 好玩的演示：看个热闹，别当真

<div class="eyebrow">真实案例 · 趣味实验</div>
<div class="cols c3" style="margin-top:20px">
<div class="card cy"><img class="shot" src="/img/tetris.jpg" style="height:160px;width:100%;object-fit:cover"/><h3>俄罗斯方块</h3><p>每落一块，让模型选择位置和旋转方式。</p></div>
<div class="card pu"><img class="shot" src="/img/city.jpeg" style="height:160px;width:100%;object-fit:cover"/><h3>Jevton 小镇</h3><p>模拟居民和企业的日常决策。</p></div>
<div class="card gn"><img class="shot" src="/img/sim.jpeg" style="height:160px;width:100%;object-fit:cover"/><h3>游戏与控制</h3><p>Doom 演示使用坐标等状态输入，每秒约 10 次判断。</p></div>
</div>
<div class="takeaway">这些实验展示高频判断，实际业务效果仍需单独验证。</div>
<!-- 这些是趣味实验。Doom 示例输入的是状态和坐标，不是画面；不能据此推断真实业务效果。 -->

---

# 以后能用在哪：判断标准

<div class="eyebrow">以后用在哪 · 判断标准</div>

<div class="takeaway takeaway-intro">现在用大模型、但<b>其实只让它返回一个选项</b>的地方；<br/>或者"以前不值得上 AI"的小判断。</div>

<div class="cols c4">
<div class="card cy"><div class="tag">高频</div><h3>每秒多次</h3><p>UI、游戏、实时控制</p></div>
<div class="card cy"><div class="tag">大批量</div><h3>百万条</h3><p>逐条判，输出免费</p></div>
<div class="card cy"><div class="tag">要快</div><h3>用户在等</h3><p>几百毫秒内给结果</p></div>
<div class="card cy"><div class="tag">要闸门</div><h3>按把握分流</h3><p>自动 / 复核 / 人工</p></div>
</div>

<div class="card rd" style="margin-top:18px">
<div class="tag">不适合</div>
<p>写作、开放问答、看图、要解释理由的场景 · 规则已经能稳定解决的（<b>别为了用模型而用模型</b>）</p>
</div>

<!--
这页给一个自检标准。记不住别的，记住这句：现在用大模型，但其实只让它返回一个选项。
-->

---

# 前端 / 产品视角的 8 个方向

<div class="eyebrow">以后用在哪 · 8 个方向（头脑风暴）</div>

<div class="cols c2">
<div class="card gn">
<div class="tag">已有人跑通</div>
<p><b>① 评论 / 用户发布内容 / 表单实时初审</b>（输入即判）<br/>
<b>② 客服与工单入口分流</b>：情绪、紧急度、部门<br/>
<b>③ 自动化测试 / 浏览器 Agent</b>里"点哪个"<br/>
<b>④ AI 功能的路由器</b>：简单问题走小模型，Agent 工具调用护栏</p>
</div>
<div class="card pu">
<div class="tag">我们的设想（待验证）</div>
<p><b>⑤ 搜索 / 筛选</b>：自然语言 → 筛选项或意图分类<br/>
<b>⑥ 埋点 / 日志 / 报错</b>自动分级，告警降噪<br/>
<b>⑦ 自适应 UI</b>：预测用户下一步，个性化入口<br/>
<b>⑧ 研发效率</b>：代码改动风险分级、Bug / 需求自动打标签</p>
</div>
</div>

<div class="takeaway"><b>游戏平台里的例子：</b>玩家评论 / 聊天实时审核 · 客服工单（充值、封号、BUG）分流 · 玩家反馈自动打标签<span class="dim">　讨论：我们有哪些调用"只返回一个选项"？</span></div>

<!--
这页留给互动。前四个已经有别人真的做出来了；后四个是我们结合前端业务的设想，需要先盲测。
问大家：你们负责的系统里，有哪些地方符合？
-->

---

# 趋势：AI 调用在分层

<div class="eyebrow">以后用在哪 · 趋势</div>

<div class="cols c2" style="align-items:center">
<div style="display:grid;gap:14px">
<div class="card cy"><div class="tag">军师</div><h3>大模型</h3><p>拆解复杂任务、写代码、写文案</p></div>
<div class="card pu"><div class="tag">传令兵</div><h3>Jev 这类判断模型</h3><p>成百上千次的工具分拣、条件路由、合规拦截</p></div>
</div>
<div>

- **杰文斯悖论**：东西变便宜以后，用量往往<b>不降反升</b>——Jev 的名字就来自它
- 产品与接口更新很快：题目和代码尽量解耦，**选型时用自己的数据比较**
- 更本质的启发：程序之间交互，真的每一步都需要长篇自然语言吗？

</div>
</div>

<div class="takeaway">给系统装上一枚枚毫秒级响应的<b>智能 if</b>。</div>

<!--
趋势一句话：AI 调用在分层。这也是为什么即使 Jev 本身以后被替代，这套"选择题 + 概率 + 分流"的思路依然有效。
-->

---

# 怎么上手：从 Key 到第一次请求

<div class="eyebrow">上手 · 建 Key 到跑通</div>

<div class="cols c2" style="align-items:center">
<div>

1. **创建 Key**：在控制台生成接口密钥。
2. **先试 Playground**：填写材料和题目，点击运行。
3. **接入应用**：在后端调用 API 或 SDK；上线时固定模型版本。

<div class="takeaway">Key 放在后端环境变量中，不放进前端代码或仓库。</div>
<p class="dim" style="font-size:15px;margin-top:16px"><a href="https://console.typesafe.ai/home" target="_blank">打开控制台</a>　·　<a href="https://docs.typesafe.ai" target="_blank">查看文档</a></p>
</div>
<div>
<img class="shot" src="/img/console.jpg" />
<div class="cap">控制台首页：① 复制 Agent 提示　② 查看 Token 用量　③ 核心功能演示</div>
</div>
</div>

<!--
这一页只要大家知道：门槛很低。Playground 不写代码就能玩；写代码就是一条 fetch。
-->

---

# 写题规则 ①：哪些是固定的，哪些自己起名

<div class="eyebrow">上手 · 写题规则（最外层固定为 model / state / questions）</div>

<div class="cols" style="grid-template-columns:1fr 1.25fr;gap:18px;align-items:start">
<div>
<pre class="jv"><span class="p">{</span>
  <span class="nm">"request_type"</span>: <span class="p">{</span>
    <span class="fx">"type"</span>: <span class="tv">"choice"</span>,
    <span class="fx">"instructions"</span>: <span class="tx">"根据 message，判断用户的主要诉求。"</span>,
    <span class="fx">"criteria"</span>: <span class="p">{</span>
      <span class="nm">"refund"</span>: <span class="tx">"要求退款"</span>,
      <span class="nm">"repair"</span>: <span class="tx">"要求维修"</span>,
      <span class="nm">"other"</span>: <span class="tx">"其他诉求"</span>
    <span class="p">}</span>
  <span class="p">}</span>,
  <span class="nm">"wants_refund"</span>: <span class="p">{</span>
    <span class="fx">"type"</span>: <span class="tv">"noul"</span>,
    <span class="fx">"instructions"</span>: <span class="tx">"message 中的用户是否明确要求退款？"</span>
  <span class="p">}</span>
<span class="p">}</span></pre>
<div class="legend"><span class="fx">■ 固定字段名</span>　<span class="tv">■ 规定的类型值</span>　<span class="nm">■ 自己起名</span>　<span class="tx">■ 自己填写的内容</span></div>
</div>
<div class="compact">
<table class="t"><tbody>
<tr><th>内容</th><th>是否固定</th><th>说明</th></tr>
<tr><td><code>request_type</code>、<code>wants_refund</code></td><td class="nm">自己命名</td><td>题目的名字，可改成 <code>category</code> 等；结果用<b>同名字段</b>返回</td></tr>
<tr><td><code>type</code></td><td class="fx">固定字段名</td><td>告诉 Jev 用哪种方式回答</td></tr>
<tr><td><code>"choice"</code>、<code>"noul"</code></td><td class="tv">规定的类型值</td><td>只能从 <code>choice</code> / <code>noul</code> / <code>score</code> / <code>box</code> 里选，<b>不能随意编</b></td></tr>
<tr><td><code>instructions</code></td><td class="fx">固定字段名</td><td>后面的<b>问题内容由你填写</b></td></tr>
<tr><td><code>criteria</code></td><td class="fx">固定字段名</td><td>定义选项或评分标准，具体格式取决于 <code>type</code></td></tr>
<tr><td><code>refund</code>、<code>repair</code>、<code>other</code></td><td class="nm">自己命名</td><td>选项标识，选中后<b>返回这个名字</b></td></tr>
<tr><td><code>"要求退款"</code> 等</td><td class="tx">自己填写</td><td>解释每个选项代表什么</td></tr>
</tbody></table>
</div>
</div>

<div class="takeaway">一句话：<b>固定的是"形状"（字段名和类型），自己写的是"内容"（题目、选项、说明）。</b></div>

<!--
这页回答最常见的问题："这些字段都是固定的吗？"
把它想成填表：表头是印好的（type、instructions、criteria），你填的是内容和自己起的名字。
颜色：青色=固定字段名，紫色=规定的类型值，橙色=自己起名，绿色=自己填的内容。
-->

---

# 写题规则 ②：type 只能四选一

<div class="eyebrow">上手 · 写题规则（规定回答形式，内容由你写）</div>

<div class="compact">
<table class="t"><tbody>
<tr><th>type</th><th>回答形式</th><th>criteria 怎么写</th><th>返回什么</th></tr>
<tr><td><code>noul</code></td><td>是非题</td><td>通常不需要</td><td><code>noul</code>：0–1 的"是"的概率</td></tr>
<tr><td><code>choice</code></td><td>单选题</td><td><b>对象</b>：选项名 → 说明，最多 255 个</td><td><code>choice</code>（选中的名字）、<code>probabilities</code>（各项概率）、<code>confidence</code></td></tr>
<tr><td><code>score</code></td><td>打分题</td><td><b>数组</b>：从低到高的等级说明</td><td><code>score</code>（可为小数）、<code>probabilities</code>、<code>confidence</code></td></tr>
<tr><td><code>box</code></td><td>框选（需图片）</td><td>不需要，只写 <code>instructions</code></td><td><code>box</code>（top / bottom / left / right，0–1 比例）、<code>confidence</code>；需图片和 <code>TypeSafe-Danger-Zone-Images</code> 请求头</td></tr>
</tbody></table>
</div>

<div class="cols c4 compact" style="margin-top:12px;gap:12px">
<div class="card cy"><div class="tag">规矩 1</div><p>选项要<b>互斥</b>：别同时写"售后"和"退货"，除非你能一句话说清差别</p></div>
<div class="card cy"><div class="tag">规矩 2</div><p>单选题留一个 <code>other</code>：不然它会<b>硬选</b>一个最像的</p></div>
<div class="card cy"><div class="tag">规矩 3</div><p>名字用<b>英文 + 下划线</b>：代码里要用它读结果</p></div>
<div class="card cy"><div class="tag">规矩 4</div><p><b>一题只问一件事</b>；同一份材料的多道题，合并成一次请求</p></div>
</div>

<div class="takeaway">报错先查：<code>type</code> 拼写；单选的 <code>criteria</code> 用<b>对象</b>、打分的用<b>数组</b>。</div>

<!--
type 的值目前只能从四种里选：choice、noul、score、box。它规定的是"回答形式"；问题内容你自己写，选 choice 时有哪些选项也由你定义。
box 用来在图里找位置，返回四条边（占图片宽高的 0–1 比例）和 confidence；需要带图，并加 TypeSafe-Danger-Zone-Images 请求头。官方标注 Dreamer-ready，先当原型玩，第 10 页已现场演示。
常见报错：type 拼错；choice 的 criteria 要写成对象，score 的要写成数组。
-->

---

# 使用 Jev 时要注意什么

<div class="eyebrow">上手与落地 · 使用边界</div>

<div class="cols c2" style="gap:14px;margin-top:18px">
<div class="card cy"><div class="tag">01 · 计算交给代码</div><h3>日期、金额先算好</h3><p>例如“明天下午 3 点”，先用代码算出具体时间，再交给 Jev 判断。</p></div>
<div class="card pu"><div class="tag">02 · 只提供相关信息</div><h3>材料清楚，判断才有依据</h3><p>工单分部门时，提供客户描述和必要信息，不必塞入整份用户资料。</p></div>
<div class="card gn"><div class="tag">03 · 用真实数据验证</div><h3>别把把握度当成正确率</h3><p>找自己的历史工单对照答案，并试试改变选项顺序，看结果是否稳定。</p></div>
<div class="card rd"><div class="tag">04 · 重要操作留规则</div><h3>模型给建议，程序定动作</h3><p>例如退款或删除数据，仍要经过业务规则和必要的人工审核。</p></div>
</div>
<div class="takeaway">如果现有规则已经能稳定解决问题，也值得先比较成本和效果。</div>

<!-- 日期和计算由代码处理；只提供判断所需材料。用真实数据验证正确率和稳定性，重要操作保留业务规则。 -->

---

# 如何开始试用 Jev

<div class="eyebrow">上手与落地 · 以工单分流为例</div>

<div class="cols" style="grid-template-columns:1fr auto auto;align-items:center">
<div style="display:grid;gap:12px">
<div class="card cy"><div class="tag">01 · 选一个任务</div><p>例如：把客服工单分给<b>账单、技术或销售</b>团队。</p></div>
<div class="card pu"><div class="tag">02 · 拿旧数据测试</div><p>找一批历史工单，先由人标好部门，再和 Jev 的判断逐条对照，看看哪里容易出错。</p></div>
<div class="card gn"><div class="tag">03 · 先并行观察</div><p>工单仍按原方式处理；Jev 同时给出建议并记录。确认效果达到业务要求后，再考虑自动分配。</p></div>
</div>
<div><img class="shot" src="/img/dual.jpg" style="height:320px;width:auto" /></div>
<div><img class="shot" src="/img/checklist.jpg" style="height:320px;width:auto" /></div>
</div>

<!--
以工单分流为例：选任务、用历史工单对照、与旧流程并行观察。样本量和观察时间要根据业务风险决定，不能只凭固定天数判断是否上线。右边是并行观察和上线检查的示意图。
-->

---
class: demo-slide shift-slide
---

<DemoShift />

<!--
演示顺序：在中央输入日程、提醒或清单，说明日期、姓名由代码解析；再试计时或投票，操作卡片控件。按 / 查看并选择其他类型，慢慢输入未完成的话，观察空白、虚影或二选一状态。<br/>
输入框下方在请求中或失败时会显示提示；Tab 确认虚影，Enter 保存，Esc 清空。按 / 手动选型后也会调用 Jev 获取其他判断信号。
-->

---
layout: center
class: closing-slide
---

<div class="closing-content">
<div class="closing-label">THANK YOU</div>
<h1>谢谢大家</h1>
<div class="closing-divider"></div>
<div class="closing-presenter"><span class="closing-role">分享人</span><span class="closing-name">黄冠豪</span><span class="closing-department">研发中心 / 游戏平台项目部</span></div>
</div>
