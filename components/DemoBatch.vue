<script setup lang="ts">
import { ref, computed } from 'vue'
import { callJev, estTokens, estCost } from '../utils/jev'
import { batchQuestions, batchSamples } from '../utils/scenarios'

const N = 100
const samples = batchSamples(N)
interface Row { i: number; text: string; expected: string; got: string; conf: number; ok: boolean }

const rows = ref<Row[]>([])
const done = ref(0), running = ref(false), ms = ref(0), tokens = ref(0), fails = ref(0)
const modeSeen = ref<string>('')
const lastErr = ref('')
const avg = computed(() => (rows.value.length ? Math.round(ms.value / rows.value.length) : 0))
const okCount = computed(() => rows.value.filter((r) => r.ok).length)
const acc = computed(() => (rows.value.length ? Math.round((okCount.value / rows.value.length) * 100) : 0))
const shown = computed(() => [...rows.value].sort((a, b) => b.i - a.i).slice(0, 8))
let t0 = 0, tick: any = null
const wall = ref(0)

async function run() {
  done.value = 0; tokens.value = 0; fails.value = 0; lastErr.value = ''; ms.value = 0; rows.value = []; modeSeen.value = ''; running.value = true
  t0 = performance.now(); tick = setInterval(() => (wall.value = Math.round(performance.now() - t0)), 50)
  let idx = 0
  const worker = async () => {
    while (idx < N) {
      const i = idx++
      const s = samples[i]
      const r = await callJev(s.text, batchQuestions)
      if (r.ok) {
        const a = r.data?.answers?.category
        const got = a?.choice || '?'
        const conf = a?.confidence ?? Math.max(0, ...Object.values<number>(a?.probabilities || {}))
        rows.value.push({ i, text: s.text, expected: s.expected, got, conf, ok: got === s.expected })
        ms.value += r.wall ?? 0
        if (r.mode) modeSeen.value = r.mode
        tokens.value += r.data?.usage?.input_tokens ?? (estTokens(s.text) + estTokens(JSON.stringify(batchQuestions)))
      } else { fails.value++; lastErr.value = r.error || '未知错误' }
      done.value++
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker))
  clearInterval(tick); wall.value = Math.round(performance.now() - t0); running.value = false
}
</script>
<template>
  <div class="demo pg batch-demo">
    <DemoModeBar title="DEMO 3 · 批量分类" :ms="rows.length ? avg : undefined" time-label="平均响应时长" />
    <div class="chips" style="margin-top:0">
      <button class="run" style="margin-left:0" :disabled="running" @click="run">{{ running ? '运行中…' : fails ? `↻ 重新运行 ${N} 条` : `▶ 并行判 ${N} 条（10 并发）` }}</button>
      <span class="hint">{{ done }} / {{ N }}　100 条各不相同，每条都有"预设答案"；最后 4 条是"先夸后骂"的转折句</span>
    </div>
    <div v-if="lastErr" class="err" style="margin:4px 0">有 {{ fails }} 条失败，最近一次：{{ lastErr }}</div>
    <div class="progress"><span :style="{ width: (done / N) * 100 + '%' }" /></div>
    <div class="stats five">
      <div><b>{{ (wall / 1000).toFixed(2) }}s</b><small>总耗时</small></div>
      <div><b>{{ avg }}ms</b><small>平均响应时长</small></div>
      <div><b>${{ estCost(tokens).toFixed(5) }}</b><small>估算花费（输入）</small></div>
      <div><b :class="{ okc: acc >= 90 }">{{ rows.length ? acc + '%' : '–' }}</b><small>与预设答案一致</small></div>
      <div><b>{{ fails }}</b><small>失败</small></div>
    </div>
    <div class="pgrid" style="grid-template-columns:0.8fr 1.4fr;margin-top:6px">
      <div class="pl">
        <div class="dlabel">QUESTIONS · 只有一道单选</div>
        <div class="qbox" style="max-height:190px"><QView :questions="batchQuestions" compact /></div>
      </div>
      <div class="pr">
        <div class="dlabel">最近完成的 8 条 · 材料 / 预设答案 / Jev 答案 / 把握度</div>
        <table class="bt">
          <tbody>
            <tr v-for="r in shown" :key="r.i">
              <td class="bx">{{ r.text }}</td>
              <td class="bn">{{ r.expected }}</td>
              <td class="bn" :class="r.ok ? 'okc' : 'badc'">{{ r.got }} {{ r.ok ? '✓' : '✗' }}</td>
              <td class="bn">{{ Math.round(r.conf * 100) }}%</td>
            </tr>
            <tr v-if="!shown.length"><td colspan="4" class="hint">点上面的按钮开始。</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="hint" style="margin-top:4px">花费按输入 token 数估算；未返回用量时按文本长度粗估。实际价格与账单以控制台为准。</div>
  </div>
</template>
