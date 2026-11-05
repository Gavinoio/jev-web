<script setup lang="ts">
// 同一批判断任务的 API 费用对比。价格单位：美元 / 100 万 Token（官方定价页，2026-11-04 核验）
// 场景：100 万次判断，每次输入 IN 个 Token、输出 OUT 个 Token（只回一个标签）
const CALLS_M = 1 // 百万次
const IN = 400
const OUT = 20

type Row = { name: string; vendor: string; tier: '轻量' | '旗舰'; inP: number; outP: number; note?: string; hot?: boolean }
const rows: Row[] = [
  { name: 'Jev', vendor: 'TypeSafe', tier: '轻量', inP: 0.042, outP: 0, hot: true },
  { name: 'Claude Haiku 5.5', vendor: 'Anthropic', tier: '轻量', inP: 0.1, outP: 0.5 },
  { name: 'GPT-6 Luna', vendor: 'OpenAI', tier: '轻量', inP: 0.1, outP: 0.5 },
  { name: 'GLM-5.3-Flash', vendor: '智谱', tier: '轻量', inP: 0.15, outP: 0.5 },
  { name: 'DeepSeek V4.1 Flash', vendor: 'DeepSeek', tier: '轻量', inP: 0.15, outP: 0.6, note: '非高峰价' },
  { name: 'DeepSeek V4 Pro', vendor: 'DeepSeek', tier: '旗舰', inP: 0.66, outP: 1.98, note: '非高峰价' },
  { name: 'GLM-5.3', vendor: '智谱', tier: '旗舰', inP: 1.4, outP: 4.4 },
  { name: 'Claude Sonnet 5.5', vendor: 'Anthropic', tier: '旗舰', inP: 2, outP: 10 },
  { name: 'GPT-6.1 Sol', vendor: 'OpenAI', tier: '旗舰', inP: 2, outP: 10 },
  { name: 'Kimi K3.1 Pro', vendor: '月之暗面', tier: '旗舰', inP: 2, outP: 10 },
]

const LOGO: Record<string, string> = {
  TypeSafe: '/img/logos/typesafe.png', Anthropic: '/img/logos/claude-color.svg', OpenAI: '/img/logos/openai.svg',
  智谱: '/img/logos/zhipu-color.svg', DeepSeek: '/img/logos/deepseek-color.svg', 月之暗面: '/img/logos/kimi-color.svg',
}
const cost = (r: Row) => CALLS_M * (IN * r.inP + OUT * r.outP)
const base = cost(rows[0])
const max = Math.max(...rows.map(cost))
const money = (v: number) => '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2))
const price = (v: number) => (v === 0 ? '免费' : '$' + (v < 0.1 ? v.toFixed(3) : v < 10 ? v.toFixed(2) : v.toFixed(0)))
const times = (r: Row) => (r.hot ? '基准' : (cost(r) / base >= 10 ? Math.round(cost(r) / base) : (cost(r) / base).toFixed(1)) + '×')
</script>

<template>
  <div class="pc">
    <div class="pc-scene">
      <span class="pc-chip"><span><b>100 万次</b>判断</span><small>例如 100 万条客服工单</small></span>
      <span class="pc-op">×</span>
      <span class="pc-chip"><span>每次输入 <b>{{ IN }}</b> Token</span><small>一条工单 + 题目，约 300 字</small></span>
      <span class="pc-op">+</span>
      <span class="pc-chip"><span>每次输出 <b>{{ OUT }}</b> Token</span><small>只回一个标签；Jev 输出免费</small></span>
    </div>

    <div class="pc-head">
      <span>模型</span><span class="r">输入</span><span class="r">输出</span><span>跑完 100 万次的总费用</span><span class="r">是 Jev 的</span>
    </div>
    <div v-for="(r, i) in rows" :key="r.name" class="pc-row" :class="{ hot: r.hot, flag: r.tier === '旗舰', split: i > 0 && r.tier !== rows[i - 1].tier }">
      <span class="pc-name">
        <i class="pc-tier">{{ r.tier }}</i>
        <img class="pc-logo" :class="{ sq: r.vendor === 'TypeSafe' }" :src="LOGO[r.vendor]" :alt="r.vendor + ' logo'" />
        <b>{{ r.name }}</b>
        <small>{{ r.name.startsWith(r.vendor) ? r.note : r.vendor + (r.note ? ' · ' + r.note : '') }}</small>
      </span>
      <span class="r mono">{{ price(r.inP) }}</span>
      <span class="r mono" :class="{ free: r.outP === 0 }">{{ price(r.outP) }}</span>
      <span class="pc-bar">
        <span class="pc-track"><span class="pc-fill" :style="{ width: Math.max(0.6, (cost(r) / max) * 100) + '%' }" /></span>
        <span class="pc-val mono">{{ money(cost(r)) }}</span>
      </span>
      <span class="r mono pc-x">{{ times(r) }}</span>
    </div>
    <div class="pc-foot">单价：美元 / 100 万 Token，官方 API 标准价（DeepSeek 为非高峰时段价），不含税</div>
  </div>
</template>

<style scoped>
.pc { margin-top: 6px; }
.pc-scene { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.pc-chip { display: flex; flex-direction: column; padding: 6px 14px; border: 1px solid rgba(56,189,248,.35); border-radius: 8px; background: rgba(56,189,248,.07); font-size: 15px; line-height: 1.3; }
.pc-chip > span { white-space: nowrap; }
.pc-chip b { color: var(--cy); font-family: var(--mono); font-size: 17px; margin: 0 2px; }
.pc-chip small { font-size: 11px; color: var(--tx2); }
.pc-op { color: var(--cy); font-family: var(--mono); font-size: 20px; }

.pc-head, .pc-row { display: grid; grid-template-columns: 300px 66px 60px 1fr 56px; gap: 12px; align-items: center; padding: 0 10px; }
.pc-head { font-size: 12px; color: var(--tx3); letter-spacing: 1px; padding-bottom: 4px; border-bottom: 1px solid var(--line); }
.r { text-align: right; }
.mono { font-family: var(--mono); }
.pc-row { height: 27px; font-size: 14px; border-radius: 6px; }
.pc-row.split { margin-top: 7px; border-top: 1px dashed var(--line); padding-top: 0; }
.pc-row.hot { background: rgba(52,211,153,.10); box-shadow: inset 3px 0 0 var(--gn); }
.pc-name { display: flex; align-items: baseline; gap: 8px; white-space: nowrap; overflow: hidden; }
.pc-logo { width: 17px; height: 17px; align-self: center; flex: none; }
.pc-logo.sq { border-radius: 4px; }
.pc-name b { font-weight: 600; }
.pc-name small { font-size: 11px; color: var(--tx2); }
.pc-tier { font-style: normal; font-size: 10px; padding: 0 5px; border-radius: 4px; color: var(--cy); border: 1px solid rgba(56,189,248,.4); }
.flag .pc-tier { color: var(--pu); border-color: rgba(167,139,250,.45); }
.hot .pc-tier { color: var(--gn); border-color: rgba(52,211,153,.5); }
.free { color: var(--gn); font-family: inherit; }

.pc-bar { display: flex; align-items: center; gap: 10px; }
.pc-track { flex: 1; height: 10px; border-radius: 5px; background: rgba(255,255,255,.04); overflow: hidden; }
.pc-fill { display: block; height: 100%; border-radius: 5px; background: linear-gradient(90deg, rgba(56,189,248,.55), var(--cy)); }
.flag .pc-fill { background: linear-gradient(90deg, rgba(167,139,250,.5), var(--pu)); }
.hot .pc-fill { background: var(--gn); }
.pc-val { width: 64px; text-align: right; font-size: 14px; }
.hot .pc-val, .hot .pc-x { color: var(--gn); font-weight: 700; }
.pc-x { color: var(--tx2); }
.pc-foot { margin-top: 6px; font-size: 11px; color: var(--tx3); text-align: right; }

/* 手机：只保留模型、总费用条和倍数，单价在电脑版里看 */
@media (max-width: 900px) {
  .pc-scene { flex-wrap: wrap; gap: 6px; }
  .pc-op { display: none; }
  .pc-chip { flex: 1 1 140px; font-size: 13px; }
  .pc-head, .pc-row { grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr) 38px; gap: 8px; padding: 0 6px; }
  .pc-head > :nth-child(2), .pc-head > :nth-child(3), .pc-row > :nth-child(2), .pc-row > :nth-child(3) { display: none; }
  .pc-row { height: auto; min-height: 30px; font-size: 13px; }
  .pc-name { flex-wrap: wrap; row-gap: 0; white-space: normal; }
  .pc-name small, .pc-tier { display: none; }
  .pc-val { width: 54px; font-size: 12px; }
  .pc-foot { text-align: left; }
}
</style>
