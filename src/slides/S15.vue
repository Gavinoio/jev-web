<!-- 第 15 页：案例 1｜Browser Use：浏览器 Agent -->
<template>
  <section class="slide">
<h1>案例 1｜Browser Use：浏览器 Agent</h1>
<div class="eyebrow">真实案例 · Agent 决策</div>
<div class="cols" style="grid-template-columns:1fr 1.1fr;align-items:center">
<div>
<ul>
<li><strong>Browser Use</strong> 的开源项目 <code>jev-ultrafast</code>，将网页上的可操作元素整理成编号清单。</li>
<li>Jev 选择<strong>操作和目标元素</strong>；需要输入文字时，由另一个模型生成文本。</li>
<li>作者的机票搜索测试中，优化前后中位耗时为 <strong>9.45 秒 → 7.09 秒</strong>。</li>
<li>这是一个任务、每种配置各 3 次的测量，不代表所有网页都能达到同样效果。</li>
</ul>
</div>
<div>
<img class="shot" src="/img/jev-ultrafast-github.png" style="max-height:240px;object-fit:cover;object-position:top" />
<div class="cap">Browser Use 项目仓库截图（点击放大）</div>
<BeforeAfter title="机票搜索：项目优化前后耗时中位数" :before="{label:'优化前', v:9.45, text:'9.45 s'}" :after="{label:'优化后', v:7.09, text:'7.09 s'}" />
</div>
</div>
  </section>
</template>
