<script setup lang="ts">
import { computed } from 'vue'
import type { Expected } from '../utils/scenarios'

// 类似官方 Playground 的返回面板：每道题一块，带概率条、把握度，以及"参考答案"对照
const props = defineProps<{ questions: Record<string, any>; answers?: Record<string, any>; expected?: Expected }>()

const pc = (x: number) => Math.round(x * 100) + '%'

interface Row { label: string; desc?: string; p: number; hot?: boolean }
interface Block {
  key: string; type: string; instructions: string
  headline: string
  rows: Row[]
  confidence?: number
  exp?: { text: string; ok: boolean | null }
}

const blocks = computed<Block[]>(() => {
  const out: Block[] = []
  for (const [key, q] of Object.entries<any>(props.questions)) {
    const a = props.answers?.[key]
    const e = props.expected?.[key]
    const b: Block = { key, type: q.type, instructions: q.instructions || '', headline: '', rows: [] }
    if (a) {
      if (q.type === 'noul') {
        const p = Number(a.noul ?? 0)
        b.headline = `${pc(p)} ${p >= 0.5 ? '是' : '否'}`
        b.rows = [{ label: '是', p, hot: p >= 0.5 }]
        if (e !== undefined) b.exp = { text: e ? '是' : '否', ok: (p >= 0.5) === !!e }
      } else if (q.type === 'choice') {
        const probs: Record<string, number> = a.probabilities || {}
        const crit: Record<string, string> = q.criteria || {}
        b.rows = Object.entries(probs).map(([k, p]) => ({ label: k, desc: crit[k], p: Number(p), hot: k === a.choice })).sort((x, y) => y.p - x.p)
        b.headline = String(a.choice ?? '')
        b.confidence = a.confidence
        if (e !== undefined) b.exp = { text: String(e), ok: a.choice === e }
      } else if (q.type === 'score') {
        const levels: string[] = Array.isArray(q.criteria) ? q.criteria : Object.values(a.legend || {})
        const probs: Record<string, number> = a.probabilities || {}
        const sc = Number(a.score ?? 0)
        b.rows = levels.map((name, i) => ({ label: `${i}`, desc: name, p: Number(probs[i] ?? 0), hot: Math.round(sc) === i }))
        b.headline = `${sc.toFixed(2)} ≈ ${levels[Math.max(0, Math.min(levels.length - 1, Math.round(sc)))] ?? ''}`
        b.confidence = a.confidence
        if (e !== undefined) b.exp = { text: `${e}（${levels[Number(e)] ?? ''}）`, ok: Math.round(sc) === Number(e) }
      }
    }
    out.push(b)
  }
  return out
})
const TYPE = { noul: 'Noul 是非', choice: 'Choice 单选', score: 'Score 打分' } as Record<string, string>
</script>
<template>
  <div class="rv">
    <div v-for="b in blocks" :key="b.key" class="rq">
      <div class="rqh">
        <span class="rk">{{ b.key }}</span>
        <span class="rt">{{ TYPE[b.type] || b.type }}</span>
        <span class="rhl" v-if="b.headline">{{ b.headline }}</span>
      </div>
      <div class="ri">{{ b.instructions }}</div>
      <div v-for="r in b.rows" :key="r.label" class="rr" :class="{ hot: r.hot }">
        <span class="rl">{{ r.label }}<small v-if="r.desc"> {{ r.desc }}</small></span>
        <span class="rb"><span class="rf" :style="{ width: Math.round(r.p * 100) + '%' }" /></span>
        <span class="rp">{{ pc(r.p) }}</span>
      </div>
      <div class="rm" v-if="b.confidence !== undefined || b.exp">
        <span v-if="b.confidence !== undefined">Confidence {{ pc(b.confidence) }}</span>
        <span v-if="b.exp" class="re" :class="b.exp.ok ? 'ok' : 'bad'">参考答案：{{ b.exp.text }} {{ b.exp.ok ? '✓ 一致' : '✗ 不一致' }}</span>
      </div>
    </div>
  </div>
</template>
