<!-- 第 09 页：题型：是非、单选、打分、图像（实验） -->
<template>
  <section class="slide">
<h1>题型：是非、单选、打分、图像（实验）</h1>
<div class="eyebrow">认识 Jev · 题型</div>
<div class="qt-grid">
<div class="qt-card cy">
<div class="qt-tag">01 · NOUL · 是非题</div>
<p class="qt-def">判断一件事是否成立，返回“是”的概率</p>
<div class="qt-q">工单是否紧急？</div>
<div class="qt-out">
<div class="qt-noul"><span>是</span><i><b style="width:94%"></b></i><em>0.94</em></div>
<small>0 = 否 ··· 1 = 是</small>
</div>
</div>
<div class="qt-card pu">
<div class="qt-tag">02 · CHOICE · 单选题</div>
<p class="qt-def">从预设选项里选一个，并给出每项的概率</p>
<div class="qt-q">应该交给哪个部门？</div>
<div class="qt-out">
<div class="qt-opt hot"><span>billing</span><i><b style="width:90%"></b></i><em>0.90</em></div>
<div class="qt-opt"><span>technical</span><i><b style="width:6%"></b></i><em>0.06</em></div>
<div class="qt-opt"><span>other</span><i><b style="width:4%"></b></i><em>0.04</em></div>
</div>
</div>
<div class="qt-card gn">
<div class="qt-tag">03 · SCORE · 打分题</div>
<p class="qt-def">按设定的等级打分，结果可以是小数</p>
<div class="qt-q">客户有多不满？</div>
<div class="qt-out">
<div class="qt-score"><i></i><b style="left:85%">1.7</b></div>
<div class="qt-levels"><span>0 冷静</span><span>1 不满</span><span>2 愤怒</span></div>
</div>
</div>
<div class="qt-card am">
<div class="qt-tag">04 · BOX · 图像（实验）</div>
<p class="qt-def">在图片里找到目标，返回它的四条边</p>
<div class="qt-q">搜索栏在哪里？</div>
<div class="qt-out">
<div class="qt-box"><i class="l1"></i><i class="l2"></i><i class="l3"></i><b></b></div>
<small>left 0.30 · top 0.13 · right 0.57 · bottom 0.20</small>
</div>
</div>
</div>
<div class="takeaway">同一份材料，可以一次提交多个问题，让 Jev 并行完成判断，不必逐个提问。</div>
  </section>
</template>
