<template>
  <div class="card cy">
    <div class="tag">CALIBRATION · 示意曲线</div>
    <!-- 两条轴都是 0.5 → 1.0：y = 200 - (v - 0.5) / 0.5 × 180 -->
    <svg class="cal" viewBox="0 0 420 250" style="width:100%;margin-top:6px">
      <g stroke="#1b2942" stroke-width="1">
        <line x1="50" y1="20" x2="50" y2="200" /><line x1="50" y1="200" x2="340" y2="200" />
        <line x1="50" y1="110" x2="340" y2="110" stroke-dasharray="3 4" /><line x1="195" y1="20" x2="195" y2="200" stroke-dasharray="3 4" />
      </g>
      <line x1="50" y1="200" x2="340" y2="20" stroke="#6f8399" stroke-dasharray="5 5" />
      <polyline points="50,198 120,154 195,112 270,66 340,26" fill="none" stroke="#34d399" stroke-width="3" />
      <polyline points="50,198 120,186 195,168 270,148 340,128" fill="none" stroke="#f87171" stroke-width="3" />
      <text x="344" y="30" fill="#34d399" font-size="12">校准好</text>
      <text x="344" y="132" fill="#f87171" font-size="12">过度自信</text>
      <text x="40" y="218" fill="#8da2c0" font-size="11">0.5</text>
      <text x="183" y="218" fill="#8da2c0" font-size="11">0.75</text>
      <text x="328" y="218" fill="#8da2c0" font-size="11">1.0</text>
      <text x="24" y="114" fill="#8da2c0" font-size="11">0.75</text>
      <text x="28" y="24" fill="#8da2c0" font-size="11">1.0</text>
      <text x="130" y="240" fill="#8da2c0" font-size="12">模型自报的把握 →</text>
      <text x="4" y="60" fill="#8da2c0" font-size="11">实际</text>
      <text x="4" y="74" fill="#8da2c0" font-size="11">正确率</text>
      <text x="200" y="146" fill="#f87171" font-size="11">说 99%，只对 70%</text>
    </svg>
    <div class="note">虚线是"说多少就对多少"；红线这种模型，没法当"自动执行"的闸门</div>
  </div>
</template>
