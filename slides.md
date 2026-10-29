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
  <div class="agenda-subtitle">AGENDA · 从 AI 基础到认识 Jev，再到实际应用</div>

  <div class="agenda-grid">
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>01</span><h2>AI 基础知识</h2></div>
      <p>大模型 · Token · Prompt · Agent</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>02</span><h2>认识 Jev 与判断结果</h2></div>
      <p>模型定位 · 四种题型 · 输入输出</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>03</span><h2>为什么值得比较</h2></div>
      <p>延迟 · 成本 · 把握度</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>04</span><h2>外部案例</h2></div>
      <p>Agent · 新闻筛选 · 招聘初筛</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>05</span><h2>我们的业务怎么试</h2></div>
      <p>方案选型 · 接口与字段 · 写题与验证</p>
    </article>
    <article class="agenda-item">
      <div class="agenda-item-heading"><span>06</span><h2>交互压轴与总结</h2></div>
      <p>变形输入框 · 从判断到行动</p>
    </article>
  </div>

  <div class="agenda-highlights">
    <article class="agenda-highlight agenda-highlight--demo">
      <div class="agenda-label"><span class="agenda-icon" aria-hidden="true">▶</span>INTERACTIVE DEMO ×3</div>
      <h2>交互演示 · 离线预设</h2>
      <p>看懂题型、工单分流和变形输入框；不作为模型性能测试。</p>
    </article>
    <article class="agenda-highlight agenda-highlight--point">
      <div class="agenda-label"><span class="agenda-icon" aria-hidden="true">✦</span>THE POINT</div>
      <h2>一个核心问题</h2>
      <p>日常 AI 应用中，有多少任务其实只需要模型做一个判断或选择？</p>
    </article>
    <article class="agenda-highlight agenda-highlight--reality">
      <div class="agenda-label"><span class="agenda-icon" aria-hidden="true">⚖</span>REALITY CHECK</div>
      <h2>客观看待</h2>
      <p>区分官方披露、作者实验与现场离线模拟，了解能力、局限和适用场景。</p>
    </article>
  </div>

  <div class="agenda-takeaway">今天不只介绍 Jev 是什么，更重要的是弄清楚：它能解决什么问题，什么时候值得用。</div>
</div>

<!--
按六个主题带过议程：先用五页对齐 AI 基础，再介绍 Jev 的定位、题型与输入输出，接着比较延迟、成本和把握度，结合外部案例讨论选型、接口使用与验证落地，最后用变形输入框和总结收束。三个交互演示分别展示输出形式、分流和自适应 UI，全部是离线预设，不调用真实 Jev。
外部案例保留来源和测量边界。今天不是证明 Jev 总比其他方案强，而是识别值得验证的判断任务。
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
点一下候选词演示“采样”。这只是帮助理解逐步生成的简化示意，不等同于披露 Jev 内部实现；后者的重点是返回限定的判断结果，而不是生成长篇文本。
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
Token 可以类比计量单位，但不等同于字或字节；上下文像容量有限的白板，超长输入如何处理取决于服务与应用。
回到工单：提供客户描述和必要订单信息，不必发送全部历史。材料和题目都可能计入输入费用，后面比较的是总成本，不只是输出 token。
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
收尾补一句：连接工具、任务方法和运行系统各有分工。基础知识到这里对齐，接下来正式认识 Jev：它在这个系统里负责什么，又不负责什么？
-->

---

# Jev 是什么：专门做判断的 AI

<div class="eyebrow">认识 Jev · 从 AI 基础回到判断任务</div>

<div class="cols c2" style="align-items:center">
<div>
<img class="shot" src="/img/compare.jpg" />
</div>
<div class="jev-definition-cards">
<section class="card">
  <div class="tag">01 · 它是什么？</div>
  <h3>专门做快速判断的 AI 模型</h3>
  <p>Jev 是 TypeSafe AI 推出的 System One 模型，返回程序可用的判断结果，而不是长篇回答。</p>
</section>
<section class="card">
  <div class="tag">02 · 用一个工单贯穿今天</div>
  <h3>“充值后没到账，该找谁？”</h3>
  <p>程序需要的是部门、紧急程度和复核信号，不一定需要一段客服回复。</p>
</section>
<section class="card">
  <div class="tag">03 · 它不是什么？</div>
  <h3>不是聊天助手，也不是完整 Agent</h3>
  <p>不负责写文章或执行退款；它给判断，程序按规则决定后续动作。</p>
</section>
</div>
</div>

<div class="takeaway">Jev 做判断，程序定动作。接下来看看：这些判断能用哪些题型表达，又会返回什么结果？</div>

<!--
基础概念已经对齐，现在介绍 Jev 的定位。用玩家充值不到账举例：部门分类和是否紧急是判断，回复用户是生成，查询订单和退款是工具与业务动作。今天用客服工单串起这些差别。
过渡：明确它负责判断、不负责执行之后，下一页看四种题型和对应输出。
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

# 交互演示 1：看懂四种输出

<div class="eyebrow">认识 Jev · 离线预设，只看结果形式</div>

<DemoTypes />

<!--
程序直接读取选项和概率，不需要从自然语言回复里提取答案；完整请求和字段规则在后面的接入章节展开。
演示步骤：是非、单选、打分共用“买礼包扣了两次钱，道具还没到账！活动马上结束了，赶紧处理，太让人失望了！”的同一条预设工单，依次看紧急概率、billing 部门、情绪评分，材料不变只换问题。Box 保留同一网页图中的三个目标：搜索栏、7 号区块、拿清单的机器人；目标和问题使用中文描述，切换后重新运行显示预设框。结果全部为离线演示数据，不是模型输出或实测置信度。
Box 的历史资料标注需图片输入与 TypeSafe-Danger-Zone-Images 请求头，具体格式及支持范围以当前官方文档为准。自定义输入失败是预设边界，不切换成假装真实的结果。
-->

---

# 为什么快：从生成文字到直接判断

<div class="eyebrow">为什么值得用 · 快</div>

<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:start;margin-top:16px">
<div>
<img class="shot" src="/img/parallel-flow.svg" alt="逐词生成文本与结构化判断的输出路径对比" style="width:100%" />
</div>
<div>
<div class="card cy" style="padding:18px 20px">
<div class="tag">核心思路</div>
<p style="font-size:20px;line-height:1.5;margin:10px 0 0">预设题目和选项，直接返回<b>判断结果与概率</b>，无需生成一段回答。</p>
</div>
<div style="margin-top:16px;padding:15px 20px;background:rgba(167,139,250,.08);border-left:3px solid var(--pu);border-radius:6px">
<div style="font-size:14px;font-weight:700;color:var(--pu)">工单示例 · 一份材料，多道判断</div>
<p style="font-size:17px;line-height:1.5;margin:8px 0 0">一条客户反馈，同时判断诉求类型、是否退款和紧急程度。</p>
</div>
</div>
</div>

<div class="takeaway">少生成文字，不等于所有任务都更快；用相同材料与质量要求，对比端到端延迟的中位数和 P95。</div>
<div class="cap">本场离线演示不测网络延迟；外部案例中的耗时仅适用于其披露的任务和条件。</div>

<!--
为什么快？大模型像写作文，逐个生成 token；Jev 将输出限定为预先定义的结构化选项。
官方实现细节不能仅从接口形式推断。少生成文字是设计差别，不足以证明端到端延迟更低；需要用相同任务与质量标准比较中位数和 P95。本场离线预设的耗时不作为模型性能证据。
-->


---

# 为什么省：计费方式与成本估算

<div class="eyebrow">核心优势 · 费用</div>
<div class="cols c2" style="gap:18px;margin-top:18px;align-items:stretch">
<div class="card cy compact">
<div class="tag">已有资料中的价格记录 · 非实时报价</div>
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
<div class="takeaway">便宜的请求不一定是便宜的方案：把调用、复核与维护成本一起算。</div>

<!--
已有分享资料记录的披露日期为 2026-10-28：输入每百万 token 0.042 美元，输出免费。本轮未能重新获取官网正文，现场不称其为当前核验价格，打开官网与控制台确认后再用于实际预算。示例：400 × 100 万 ÷ 100 万 × 0.042 = 16.80 美元，仅为输入费用；材料和题目均计入输入。还要算复核与人工成本。来源入口：https://typesafe.ai/
-->


---
class: story-slide confidence-slide
---

# 为什么可控：判断之后，还能安排复核

<div class="eyebrow">程序决定处理方式 · 模型给出答案，不等于必须直接采用</div>

<div class="story-body review-story">
<div class="review-example">
<div><span class="review-label">还是这条礼包工单</span><p>“买礼包扣了两次钱，道具还没到账！”</p></div>
<div class="review-suggestion"><span class="review-label">模型给出建议</span><strong>交给账单团队 <code>billing</code></strong></div>
</div>
<div class="review-question">收到这个建议，程序可以怎么处理？</div>
<div class="cols c3 review-options">
<div class="card gn"><div class="tag">01 · 满足已验证的自动分配条件</div><h3>直接分配</h3><p>历史测试表现达标，材料完整，也符合业务规则，就按建议分给账单团队。</p><div class="review-outcome">只分配工单，不自动退款</div></div>
<div class="card pu"><div class="tag">02 · 尚未达到自动分配条件</div><h3>再检查一次</h3><p>交给规则或其他模型核对；仍无法确认，就转人工处理。</p><div class="review-outcome">先复核，再决定归属</div></div>
<div class="card am"><div class="tag">03 · 材料不足，或涉及重要操作</div><h3>交给人工</h3><p>先补充订单信息；退款、封号等操作仍要单独经过权限与业务审核。</p><div class="review-outcome">不能凭模型建议直接执行</div></div>
</div>
<div class="review-signal"><span class="review-label">confidence 在哪里起作用？</span><p>它是接口提供的一个<b>复核参考信号</b>，不是实测正确率。先用历史工单检查“不同分数下实际错了多少”，再决定怎样设置自动分配条件。</p></div>
<div class="takeaway">模型负责建议“交给谁”；程序结合历史验证、材料和业务规则，决定“直接分配、再检查，还是交人工”。</div>
</div>

<!--
不要从“置信度是什么”开讲。先接前面的礼包工单：模型建议 billing，我们是否一定照做？答案是否，流程是我们写的。
三张卡是三种可配置的处理策略示意，不是模型自动判断出来的三档，更不是当前离线 Demo 实现的完整策略。直接分配的是工单，不是执行退款。材料不足要补充信息，重要操作要独立审核。
最后再介绍 confidence：具体含义以对应模型与当前文档为准，不能直接当成这次正确的概率，不能默认等于最高选项概率。先用独立标注数据检查各分数段的真实错分情况，再衡量自动处理覆盖量、错分与复核成本，确定是否值得使用该信号。
这里的“可控”是我们能设计处理流程，不是承诺模型一定正确。下一页用同一条工单和离线预设演示简化版：三道题一起返回，路由建议只按部门置信度与手动阈值变化；信息完整性、紧急度、情绪及重要操作审核未接入这段路由逻辑。
-->

---
class: demo-slide demo-types-slide
---

# 交互演示 2：判断之后，工单怎么走？

<div class="eyebrow">同一条工单 · 三种题型一起判断，再按部门置信度演示分流</div>

<DemoTicket />

<!--
演示步骤：沿用题型演示的“礼包扣款”工单，三道题定义完全相同；前面逐题看，这里一次提交，同时返回紧急概率、billing 部门与情绪评分。当前分流仅按 department 的置信度和示例阈值计算，紧急程度与情绪作为同时返回的信号展示，不宣称三者已参与路由。再选“礼包异常”（礼包好像不对，价格变了，东西也找不到，帮我看看。）对比转人工建议。调整阈值观察路由变化，强调阈值是业务策略，不是模型自动授权。其他场景数据保留备用。
概率与把握度均为离线模拟，不代表校准结果。当前只改变界面上的路由建议，不实际转工单或退款。说明后回到真实数据如何验证。
-->

---
class: story-slide
---

# 外部案例：看三种分工，不只看一个快字

<div class="eyebrow">案例地图 · 来源不同，证据边界也不同</div>

<div class="story-body">
<div class="cols c3 case-map">
<div class="card cy"><img src="/img/jev-ultrafast-github.png" alt="Browser Use 项目仓库截图" /><div class="tag">01 · 开源项目作者实验</div><h3>Agent 选动作</h3><p>Jev 选择操作和目标，生成模型负责需要输入的文字。</p></div>
<div class="card pu"><img src="/img/news-filter.svg" alt="新闻按品牌相关性筛选的流程示意，不是真实测试结果" /><div class="tag">02 · 第三方演示视频</div><h3>新闻批量筛选</h3><p>先判断哪些内容相关，再把候选交给后续处理。</p></div>
<div class="card gn"><img src="/img/jack-jill-jev.png" alt="Jack and Jill 招聘初筛案例流程图" /><div class="tag">03 · 厂商披露案例</div><h3>招聘前置初筛</h3><p>先缩小候选范围，再由更强模型和招聘经理评估。</p></div>
</div>
<div class="takeaway">共同点：把“判断”放进流程；不同点：任务、基线和评价方式不能混为一谈。</div>
</div>

<!--
三个案例分别解释动作选择、批量筛选和前置闸门。这里只导航，不逐个读数字。来源类型不同，不能当作同一标准下的横向评测。
新闻配图是本项目自绘的流程示意。项目截图与厂商图沿用已有素材，具体来源见后续各页。
-->

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
</div>
</div>

<!--
来源：https://github.com/browser-use/jev-ultrafast。速度比较是同一项目优化前后各三次运行，并非截图模型与 Jev 的对照；项目作者说明不构成通用可靠性评测。
-->


---
class: news-video-slide
---

# 案例 2｜批量筛新闻：为品牌寻找相关话题

<div class="eyebrow">第三方演示视频 · 看筛选流程，不据此推断准确率</div>
<div class="video-focus"><b>观看重点</b><span>给定品牌与标准 → 逐条判断新闻是否相关 → 保留候选，继续处理</span></div>

<div class="news-video-frame">
<video controls preload="metadata" playsinline class="news-video" aria-label="梭哈 AI 新闻匹配演示视频"><source src="/video/jev-news-demo.mp4" type="video/mp4" /></video>
</div>

<!--
播放前先交代观察点：品牌需求如何变成相关性判断，筛出的候选如何进入下一步。按分享时间选取关键片段，不必从头播放到尾。
播放后用一句话总结：批量筛选的价值在缩小后续处理范围，但漏筛、误筛和端到端成本必须另测。接着看招聘初筛：同样是前置判断，如何为后续深入评估缩小候选范围。
视频来源：https://x.com/SUOHA_AI/status/2101000339948282090
-->

---

# 案例 3｜招聘初筛：先筛选，再深入评估

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
</tbody></table><p class="dim" style="font-size:14px;margin-top:10px">保留率差异未达统计显著；数据来自厂商披露的特定流程。</p></div>
</div>
<div class="takeaway">案例展示的是“先筛选，再深入评估”；不能用初筛阶段的结果代替整条招聘流程的评估。</div>
<!-- 来源：https://typesafe.ai/blog/jack-jill-jev-case-study。质量结果来自对真实岗位的离线测试；保留率差异未达统计显著。成本和耗时针对初筛阶段，不代表整个招聘流程。 -->

---
class: story-slide selection-slide
---

# 同一条客服流程，哪些步骤值得用 Jev？

<div class="eyebrow">从具体任务选方案 · 不是所有步骤都需要模型，也不是所有模型都要生成文字</div>

<div class="story-body">
<div class="selection-table" tabindex="0" role="region" aria-label="客服流程中的任务与方案对照">
<table class="t">
<colgroup><col style="width:31%"/><col style="width:27%"/><col style="width:42%"/></colgroup>
<thead><tr><th scope="col">客服流程中的具体任务</th><th scope="col">优先比较什么方案？</th><th scope="col">为什么这样选？</th></tr></thead>
<tbody>
<tr><td><b>查订单是否支付、是否重复扣款</b></td><td>数据库查询 + 业务代码</td><td>有明确事实可查，不让模型猜订单状态或计算退款金额。</td></tr>
<tr><td><b>读玩家描述，判断归哪个团队</b></td><td><span class="selection-highlight">Jev / 结构化输出模型</span></td><td>需要理解语义，但结果只需从账单、技术、销售等选项中选择。</td></tr>
<tr><td><b>给大量历史反馈打固定标签</b></td><td>分类模型 / Jev / 其他模型</td><td>用同一批标注数据比较质量、批处理成本和维护成本，不预先认定谁最好。</td></tr>
<tr><td><b>解释处理结果，写一段客服回复</b></td><td>回复模板 / 通用大模型</td><td>需要生成文字；涉及订单或退款承诺时，仍由业务规则约束。</td></tr>
</tbody>
</table>
</div>
<div class="selection-check"><b>哪些任务值得先测？</b><span>输出选项明确，而且调用量大、用户在等，或需要先筛一遍再复核。</span></div>
<div class="takeaway">先用代码查事实，再让模型判断诉求，最后按需生成回复；Jev 可以参与其中一个环节，不必替换整条流程。</div>
</div>

<!--
把原来的选型、适用标准和趋势三页合并成一条具体客服流程。订单和资金数据查数据库；部门分类可比较 Jev 与其他结构化模型；标签多且稳定、有标注数据时也比较专用分类；生成回复用模板或生成模型。
高频、大批量、延迟要求和前置筛选是值得测量的动机，不是 Jev 已证明更优的证据。结构化输出也不是 Jev 独有，选择仍看同数据下的质量、端到端延迟、复核与维护成本。
不再单独讲军师、传令兵、智能 if 等抽象比喻，也不在这一段扩展名称由来。下一页保留完整八个应用方向，让听众从具体功能中找自己的任务；然后进入如何调用与写题。
-->

---
class: story-slide
---

# Jev 可以用在哪：8 个应用方向

<div class="eyebrow">以后用在哪 · 从具体功能出发，一起找应用场景</div>

<div class="story-body">
<div class="cols c2 story-cards">
<div class="card gn">
<div class="tag">审核、分流与自动化</div>
<h3>① 内容初审</h3><p>评论、聊天、表单提交前，判断是否需要提醒或人工复核。</p>
<h3>② 客服工单分流</h3><p>识别诉求、紧急程度和处理部门，把工单交给对应团队。</p>
<h3>③ 浏览器 Agent</h3><p>从页面可操作元素中选择下一步：点哪个按钮、执行什么动作。</p>
<h3>④ AI 功能路由</h3><p>判断问题类型，选择规则、小模型、大模型或人工处理。</p>
</div>
<div class="card pu">
<div class="tag">产品与研发中的设想 · 待验证</div>
<h3>⑤ 搜索 / 筛选</h3><p>把“找最近充值失败的订单”识别为对应的筛选意图。</p>
<h3>⑥ 日志 / 报错分级</h3><p>区分普通异常、需关注问题和紧急故障，辅助告警降噪。</p>
<h3>⑦ 自适应 UI</h3><p>识别用户想建日程、记账还是记笔记，展示对应的卡片。</p>
<h3>⑧ 研发标签</h3><p>给 Bug、需求和代码改动打标签，辅助分派与风险复核。</p>
</div>
</div>
<div class="takeaway"><b>游戏平台里的例子：</b>玩家评论 / 聊天初审 · 充值、封号、BUG 工单分流 · 玩家反馈打标签。</div>
</div>

<!--
这页的目的仍是展开应用方向，不在这里讲试点实施方法。按两组介绍八种具体功能，每个方向说明“输入什么、判断什么、结果用在哪里”，不要只读抽象名词。
浏览器 Agent 呼应前面的开源案例，自适应 UI 为后面的变形输入框埋伏笔。其余是候选方向，不表示本项目已验证可上线。
最后联系游戏平台：评论初审、充值或封号工单的首接部门、玩家反馈标签。工单分类不等于执行退款或封号；试点、质量验证和重要操作审核留在后面的落地章节。
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
class: story-slide api-call-slide
---

# 一次调用长什么样

<div class="eyebrow">上手 ① · 服务端发送请求 → 检查响应 → 按字段读取结果</div>

<div class="story-body">
<div class="cols c21 api-example api-call">
<div class="card cy">
<div class="tag">请求示例</div>

```ts
const response = await fetch('https://api.typesafe.ai/v1/systemone', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'jev-latest',
    state: '充值扣款了，但道具一直没到账。',
    questions: {
      department: {
        type: 'choice',
        instructions: '这条工单的首接团队是谁？',
        criteria: {
          billing: '支付、扣款、到账、退款问题',
          technical: '与支付无关的登录或功能故障',
          other: '其他或信息不足',
        },
      },
    },
  }),
})
```

</div>
<div class="api-response card pu"><div class="tag">响应示例</div>

```json
{
  "answers": {
    "department": {
      "type": "choice",
      "choice": "billing",
      "confidence": 0.9,
      "probabilities": {
        "billing": 0.9,
        "technical": 0.06,
        "other": 0.04
      }
    }
  }
}
```

<div class="api-reading">
<div class="api-reading-title">读取判断结果</div>
<div><code>choice</code><span>选中的选项</span></div>
<div><code>probabilities</code><span>各选项的概率</span></div>
<div><code>confidence</code><span>把握度，辅助决定是否复核</span></div>
</div>
</div>
</div>
<div class="takeaway">请求定义问题，响应返回判断；后续处理由业务代码决定。</div>
</div>

<!--
这页展示请求与响应的对应关系。先看 URL、POST、鉴权和 Content-Type，再看展开后的 model、state、questions、题型与选项，最后结合右侧说明读取结果。响应解析与错误处理代码不在本页展开，实际接入仍需补齐。
强调这是服务端示例，不能将 Key 直接放进浏览器。右边按项目留存的历史响应结构节选，省略 model、usage 等字段；选项与数值为手写示例，不是左侧输入的真实调用结果，也未重新核验当前线上 API。confidence 与最大选项概率不应默认相等。网页交互演示仍是离线模拟。示例只保留一道 choice 题保证可读性，同一份材料可添加多道题。实际接入需按当前文档校验结构，不能把这个简化示例直接当完整生产封装。
过渡：代码里这么多名字，哪些是接口规定的，哪些是我们自己起的？下一页分颜色解释。
-->

---
class: story-slide
---

# 写题规则 ①：哪些固定，哪些自己定义？

<div class="eyebrow">上手 ② · 字段名、规定类型、自己命名、自己填写，分开看</div>

<div class="story-body">
<div class="cols c2 api-example field-guide">
<div class="card cy">
<div class="tag">沿用刚才的工单 · 颜色区分四种内容</div>
<pre class="jv">{
  <span class="fx">"model"</span>: <span class="tx">"jev-latest"</span>,
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
<div class="legend"><span class="fx">■ 固定字段</span>　<span class="tv">■ 规定类型</span><br/><span class="nm">■ 自己命名</span>　<span class="tx">■ 自己填写</span></div>
</div>
<div class="api-notes">
<div class="card"><div class="tag fx">青色 · 接口规定的字段名</div><p><code>model</code>、<code>state</code>、<code>questions</code>、<code>type</code>、<code>instructions</code>、<code>criteria</code> 不能随意改名；是否需要 <code>criteria</code> 取决于题型。</p></div>
<div class="card pu"><div class="tag">紫色 · 规定的类型值</div><p><code>type</code> 按支持的题型填写：<code>noul</code>、<code>choice</code>、<code>score</code>、实验性 <code>box</code>，不能自创类型。</p></div>
<div class="card"><div class="tag nm">橙色 · 题名和选项标识自己起</div><p><code>department</code> 可改成 <code>category</code>；<code>billing</code> 等标识也可自定。改题名后，读取路径同步改为 <code>answers.category</code>。</p></div>
<div class="card gn"><div class="tag">绿色 · 内容自己填，模型选受支持版本</div><p>材料、题干和选项说明由你填写；<code>model</code> 的值须是服务支持的模型名，不是随意起名。</p></div>
</div>
</div>
<div class="takeaway">固定的是字段名与类型约定；自定义的是题名、选项标识和判断内容。<code>other</code> 也是自定义选项，不是保留字段。</div>
</div>

<!--
四种颜色配合文字标签，避免只靠颜色区分。model 是固定字段名，但值是从服务支持的模型中选择；不是整个字符串都写死，也不是任意编模型名。state 的内容由业务提供。
department 是我们起的题名，不是官方固定业务字段；billing、technical、other 都是 choice 选项标识。把 department 改成 category 后，返回同名题目，代码读取 answers.category.choice。criteria 这个字段名固定，但内部写对象还是数组取决于题型，下一页具体对照。
-->

---
class: story-slide type-rules-slide
---

# 写题规则 ②：题型决定 criteria 和返回值

<div class="eyebrow">上手 ③ · 题型不是随便起名；choice 用对象，score 用有序数组</div>

<div class="story-body">
<div class="type-rule-table" tabindex="0" role="region" aria-label="四种题型的填写规则与返回字段对照表">
<table class="t">
<colgroup><col style="width:13%"/><col style="width:19%"/><col style="width:31%"/><col style="width:37%"/></colgroup>
<thead><tr><th scope="col">type / 用途</th><th scope="col">criteria 格式</th><th scope="col">填写示例</th><th scope="col">返回字段 / 注意事项</th></tr></thead>
<tbody>
<tr><th scope="row"><code>noul</code><span class="rule-description">是非判断</span></th><td><b>不需要</b><span class="rule-description">在 instructions 中写判断条件</span></td><td><code>instructions:</code><br/><code>'是否要求马上处理？'</code></td><td><code>noul</code>：0～1 的“是”的概率。<span class="rule-description">返回的是概率，不是 true / false。</span></td></tr>
<tr><th scope="row"><code>choice</code><span class="rule-description">从选项中选一个</span></th><td><b>对象 { }</b><span class="rule-description">选项标识 → 选项说明</span></td><td><code>criteria: {</code><br/><code>  billing: '账单问题',</code><br/><code>  other: '其他' }</code></td><td><code>choice</code>：选中的自定义标识。<br/><code>probabilities</code>：各项概率。<br/><code>confidence</code>：把握度。<span class="rule-description">不要把选项对象写成数组。</span></td></tr>
<tr><th scope="row"><code>score</code><span class="rule-description">按等级打分</span></th><td><b>有序数组 [ ]</b><span class="rule-description">等级说明从低到高排列</span></td><td><code>criteria: [</code><br/><code>  '冷静', '不满但礼貌',</code><br/><code>  '非常愤怒' ]</code></td><td><code>score</code>：评分，可为小数。<br/><code>probabilities</code>、<code>confidence</code>。<span class="rule-description">示例的三个等级对应 0、1、2；不是选项对象。</span></td></tr>
<tr><th scope="row"><code>box</code><span class="rule-description">图像定位 · 实验</span></th><td><b>不需要</b><span class="rule-description">另需图片资产与目标描述</span></td><td><code>instructions:</code><br/><code>'图片中搜索栏的位置'</code><span class="rule-description">需同时提供图片，不能只传文字。</span></td><td><code>box</code>：top / bottom / left / right，0～1 比例；<code>confidence</code>：把握度。<span class="rule-description">图片格式与实验请求头要求以当前文档为准。</span></td></tr>
</tbody>
</table>
</div>
<div class="takeaway">同一材料可同时提多题：<code>department</code> 用 choice，<code>is_urgent</code> 用 noul，<code>frustration</code> 用 score。</div>
</div>

<!--
逐行讲清 criteria：noul 不需要，choice 是选项对象，score 是由低到高的说明数组，box 需要图片资产并遵循实验接口要求。这里只恢复原有题型教学，不新增未经核验的数量上限或新能力承诺。
返回字段也有规定：同一自定义题名下，noul 读 noul，choice 读 choice，score 读 score，box 读 box。noul 是概率而不是布尔值，score 可以为小数。参数和实验支持范围以当前官方文档为准。
下一页才讨论怎么把分类边界写清楚：会填接口是第一步，题目明确是第二步，二者不能互相替代。
-->

---
class: story-slide
---

# 写题不是填字段：把模糊边界写清楚

<div class="eyebrow">上手 · 同一个工单，坏题目与改进后的题目</div>

<div class="story-body">
<div class="question-sample">客户原话：<b>“充值扣款了，但道具一直没到账。”</b></div>
<div class="cols c2 story-cards">
<div class="card rd"><div class="tag">容易出错的问法</div><h3>“属于充值、BUG 还是售后？”</h3><p>充值和售后可能重叠，“BUG”的范围不明确；材料再少，也必须硬选一个。</p><div class="answer-pill">问题不在 JSON，而在分类标准</div></div>
<div class="card gn"><div class="tag">更清楚的问法</div><h3>“这条工单的首接团队是谁？”</h3><p><b>账单：</b>支付、扣款、到账、退款问题。<br/><b>技术：</b>与支付无关的登录或功能故障。<br/><b>其他：</b>不属于以上两类或材料不足。</p></div>
</div>
<div class="idea-strip"><b>写题检查</b><span>一题一件事 · 说明重叠时的优先级 · 留其他出口 · 用反例测试</span></div>
<div class="takeaway">示例规则中，“未到账”先归账单团队；这是业务约定，不是模型自己决定的真理。</div>
</div>

<!--
先问听众会选哪一类，再指出三个标签本身重叠，换模型也不一定解决。右边将问题限定为首接团队，并把未到账的归属写清楚。
other 只是出口，不保证模型一定知道自己不知道；还要检查信息是否足够。修改标准后，用独立样本和反例重新验证，不把现场预设当作效果证据。
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
class: story-slide
---

# 怎样验证：不只看一个“准确率”

<div class="eyebrow">上手与落地 · 工单试点的最小评估闭环</div>

<div class="story-body">
<div class="figure-scroll"><img class="story-figure" src="/img/validation-loop.svg" alt="脱敏历史工单经过标注、独立测试集、方案比较和影子运行，再决定是否小流量上线" /></div>
<div class="cols c3 story-cards">
<div class="card cy"><div class="tag">质量 · 错在什么地方？</div><h3>按类别看误分与漏分</h3><p>重点看紧急工单漏判、少数类别与材料不足；不只报总体平均数。</p></div>
<div class="card pu"><div class="tag">自动化 · 能放心放行多少？</div><h3>同时看覆盖率与错误率</h3><p>提高把握度门槛后，自动处理剩多少？被放行的工单还有多少错分？</p></div>
<div class="card gn"><div class="tag">成本 · 整条链划不划算？</div><h3>比较延迟、复核与维护</h3><p>记录中位数 / P95、调用费用、人工复核量；与现有规则和其他模型比较。</p></div>
</div>
<div class="takeaway">调题目用一批数据，验收留一批独立数据；先定可接受的错分代价，再决定是否自动化。</div>
</div>

<!--
分开调试集与独立测试集，避免反复看答案后高估效果；先脱敏并确认数据可用于外部服务。比较方案时用相同输入和评价标准。
覆盖率指有多少请求被自动处理，错误率要单独看这部分。阈值不是越高越好，还影响人工复核量。影子运行不改变现有路由；达到预定标准后才考虑小流量，并保留回退。
-->

---

# 从一个工单试点开始，不急着替换系统

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
class: story-slide
---

# 带走三句话：模型判断，代码计算，用户确认

<div class="eyebrow">先收束核心观点 · 最后用一个交互演示串起来</div>

<div class="story-body">
<div class="cols c3 summary-cards">
<div class="card cy"><span class="summary-number">01</span><h3>判断不必变成长篇回答</h3><p>输出选项、分数与概率，让程序直接读取；但格式正确不代表判断正确。</p></div>
<div class="card pu"><span class="summary-number">02</span><h3>确定的事交给代码</h3><p>日期、金额、单位换算由代码计算；业务权限、校验和执行也不能省。</p></div>
<div class="card gn"><span class="summary-number">03</span><h3>不确定时保留回退</h3><p>低把握复核，重要操作确认；阈值与自动化范围由真实数据决定。</p></div>
</div>
<div class="takeaway">值得带走的不只是 Jev，而是“结构化判断 + 确定性代码 + 可控流程”的设计方法。</div>
</div>

<!--
先用工单回顾分工：部门建议是判断，查订单与校验权限是代码，影响大的动作需要确认与回退。
接下来用变形输入框串起这三个原则：意图分类、日期与金额计算、用户确认。介绍后直接演示，演示结束进入致谢。
-->

---
class: story-slide
---

# 最后，把判断结果变成看得见的交互

<div class="eyebrow">交互演示 3 · 会变形的输入框</div>

<div class="story-body">
<div class="figure-scroll"><img class="story-figure" src="/img/intent-to-card.svg" alt="用户输入自然语言，判断意图后由本地代码解析日期和数值，生成可预览并由用户确认的卡片" /></div>
<div class="cols c3 story-cards">
<div class="card cy"><div class="tag">第一步 · 输入逐渐完整</div><h3>观察界面如何过渡</h3><p>“明天” → “明天中午” → “明天中午和小王” → 完整日程。</p></div>
<div class="card pu"><div class="tag">第二步 · 只选几个例子</div><h3>日程、AA、换算、笔记</h3><p>关注同一输入框如何服务不同意图，不逐个遍历全部卡片。</p></div>
<div class="card gn"><div class="tag">第三步 · 保留控制权</div><h3>预览、手选，再确认</h3><p>按 / 选类型，Tab 确认预览，Enter 保存；自定义文本可手动选择类型。</p></div>
</div>
<div class="takeaway">下一页为离线预设：展示交互设计，不证明任意输入都能被模型正确理解。</div>
</div>

<!--
压轴只讲一个新价值：判断不只是后台分类，也能改变前端交互。前三个例子用预设，笔记可以示范手动选类型；自定义内容不会自动判断。
说明源自 shapeshift 的交互思路：模型判断意图，代码解析具体数值，用户拥有确认权。呼应前一页的三点总结，下一页直接演示，结束后进入致谢。
-->

---
class: demo-slide shift-slide
---

<DemoShift />

<!--
演示顺序：逐步输入「明天」→「明天中午」→「明天中午和小王」→「明天中午和小王、小李吃饭」，观察预设模拟的输入、二选一、虚影和卡片状态；每一步稍作停顿。按 / 查看并选择其他类型。<br/>
输入框仅对预设例子及上述指定阶段返回离线模拟结果；其他自定义内容不会被自动判断，但可手动选择卡片类型。Tab 确认虚影，Enter 保存，Esc 清空。
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
