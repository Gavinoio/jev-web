<!-- 第 20 页：案例 1：Browser Use 浏览器 Agent -->
<template>
  <section class="slide">
<h1>案例 1：Browser Use 浏览器 Agent</h1>
<div class="eyebrow">用在哪里 ① · Agent 每一步选哪个操作</div>
<div class="cols c2" style="gap:20px;margin-top:18px;align-items:start">
<div>
<div class="card cy"><div class="tag">项目做法 · 开源项目 jev-ultrafast</div>
<div class="case-steps">
  <div><b>1</b><p>把网页上能点、能填的元素整理成<strong>编号清单</strong>。</p></div>
  <div><b>2</b><p>Jev 从清单里选出<strong>操作和目标元素</strong>：点哪个、填哪个。</p></div>
  <div><b>3</b><p>需要输入文字时，交给另一个模型生成文本。</p></div>
</div>
</div>
<BeforeAfter class="case-ba" title="作者实测 · 机票搜索耗时中位数" :before="{label:'优化前', v:9.45, text:'9.45 s'}" :after="{label:'优化后', v:7.09, text:'7.09 s'}" />
</div>
<div>
<img class="shot" src="/img/jev-ultrafast-github.png" style="width:100%;max-height:300px;object-fit:cover;object-position:top" />
<div class="cap">Browser Use 项目仓库截图（点击放大）</div>
</div>
</div>
<div class="takeaway">Agent 每走一步都要“选一个操作”，正适合交给 Jev；但这是<b>一个任务、每种配置各 3 次</b>的测量，不代表所有网页都能快这么多。</div>
  </section>
</template>
