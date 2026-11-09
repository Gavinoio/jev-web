<!-- 第 16 页：为什么快：直接给答案，不用逐字生成 -->
<template>
  <section class="slide">
<h1>为什么快：直接给答案，不用逐字生成</h1>
<div class="eyebrow">为什么选 Jev ① · 输出越短，用户等得越少</div>
<div class="speed-lanes">
<div class="lane">
<div class="lane-head"><span class="lane-tag">通用大模型</span><b>逐字生成一段回答</b><span class="lane-steps">约 21 步生成</span></div>
<div class="lane-tokens gen"><span style="--i:0">这</span><span style="--i:1">条</span><span style="--i:2">工</span><span style="--i:3">单</span><span style="--i:4">属</span><span style="--i:5">于</span><span style="--i:6">账</span><span style="--i:7">单</span><span style="--i:8">问</span><span style="--i:9">题</span><span style="--i:10">，</span><span style="--i:11">建</span><span style="--i:12">议</span><span style="--i:13">交</span><span style="--i:14">给</span><span style="--i:15">billing</span><span style="--i:16">团</span><span style="--i:17">队</span><span style="--i:18">处</span><span style="--i:19">理</span><span style="--i:20">…</span></div>
<div class="lane-note">每多一个字就要再算一步；程序还得从这段文字里把“billing”解析出来。</div>
</div>
<div class="lane hot">
<div class="lane-head"><span class="lane-tag">Jev</span><b>直接返回判断结果</b><span class="lane-steps">一次给出</span></div>
<div class="lane-tokens res"><span class="pick">billing 0.90</span><span>technical 0.06</span><span>other 0.04</span></div>
<div class="lane-note">答案限定在预设选项内，附带各项概率，程序直接读取。</div>
</div>
</div>
<div class="speed-evidence">
<div class="ev-card">
<div class="ev-top"><span class="ev-src">厂商披露 · Jack &amp; Jill 招聘初筛</span><span class="ev-big">耗时约减半</span></div>
<div class="ev-bar"><span>Gemini 3.1 Flash Lite</span><i class="old" style="width:100%"></i><b>20.3 s</b></div>
<div class="ev-bar"><span>Jev</span><i style="width:50.7%"></i><b class="hot">10.3 s</b></div>
<div class="ev-foot">每个岗位初筛耗时的中位数，同一招聘流程</div>
</div>
<div class="ev-card">
<div class="ev-top"><span class="ev-src">开源项目作者实验 · Browser Use</span><span class="ev-big">耗时少 25%</span></div>
<div class="ev-bar"><span>优化前</span><i class="old" style="width:100%"></i><b>9.45 s</b></div>
<div class="ev-bar"><span>Jev 负责选动作</span><i style="width:75%"></i><b class="hot">7.09 s</b></div>
<div class="ev-foot">机票搜索任务的耗时中位数，每种配置跑 3 次</div>
</div>
</div>
<div class="takeaway">输出越短，等待越少；落到自己的业务，仍要用同一批材料对比端到端延迟的中位数和 P95。</div>
  </section>
</template>
