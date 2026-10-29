<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { callJev, pct, type JevResult } from '../utils/jev'
import { scenarios } from '../utils/scenarios'

// 类似官方 Playground：左边 STATE + QUESTIONS（可改），右边 RESPONSE；示例自带"参考答案"
const sc = scenarios[0]
const ei = ref(1)
const state = ref(sc.examples[1].state)
const stateInput = ref<HTMLTextAreaElement | null>(null)
const stateHighlight = ref<HTMLElement | null>(null)
function formatJson(value: string) {
  try {
    const parsed = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : value
  } catch { return value }
}
function highlightState(value: string) {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  if (!/^[\s]*[\[{]/.test(value)) return escape(value) + '\n'
  const tokens = /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}\[\],:])/g
  let result = '', cursor = 0, match: RegExpExecArray | null
  while ((match = tokens.exec(value))) {
    result += escape(value.slice(cursor, match.index))
    const color = match[1] ? 'qj-key' : match[2] ? 'qj-string' : match[3] ? 'qj-number' : match[4] ? 'qj-literal' : 'qj-punctuation'
    result += `<span class="${color}">${escape(match[0])}</span>`
    cursor = tokens.lastIndex
  }
  return result + escape(value.slice(cursor)) + '\n'
}
const highlightedState = computed(() => highlightState(state.value))
function syncStateScroll() {
  if (stateInput.value && stateHighlight.value) {
    stateHighlight.value.scrollTop = stateInput.value.scrollTop
    stateHighlight.value.scrollLeft = stateInput.value.scrollLeft
  }
}
function formatState() {
  state.value = formatJson(state.value)
  nextTick(syncStateScroll)
}
const qText = ref(JSON.stringify(scenarios[0].questions, null, 2))
const res = ref<JevResult | null>(null)
const loading = ref(false)
const err = ref('')
const th = ref(0.9)
const lo = ref(0.7)
let requestId = 0
let controller: AbortController | null = null

const ex = computed(() => sc.examples[ei.value])
const visibleExamples = [
  { ...sc.examples[1], index: 1, shortLabel: '明确工单 · 礼包扣款' },
  { ...sc.examples[3], index: 3, shortLabel: '含糊工单 · 礼包异常' },
]
function pickExample(index: number) {
  ei.value = index
  state.value = formatJson(sc.examples[index].state)
  res.value = null
  err.value = ''
}
const questions = computed<Record<string, any> | null>(() => {
  try { const q = JSON.parse(qText.value); return q && typeof q === 'object' ? q : null } catch { return null }
})
const pristine = computed(() => formatJson(state.value) === formatJson(ex.value.state) && qText.value === JSON.stringify(sc.questions, null, 2))

async function run() {
  err.value = ''
  if (!questions.value) { err.value = '题目 JSON 格式有误，请检查'; return }
  const id = ++requestId
  controller?.abort()
  controller = new AbortController()
  const requestState = state.value
  const requestQuestions = questions.value
  loading.value = true
  res.value = null
  const response = await callJev(requestState, requestQuestions, controller.signal)
  if (id === requestId) { res.value = response; loading.value = false }
}
watch([state, qText], () => { requestId++; controller?.abort(); loading.value = false; res.value = null }, { flush: 'sync' })
onBeforeUnmount(() => controller?.abort())

const ans = computed(() => res.value?.data?.answers)
const main = computed(() => (pristine.value ? sc.main : undefined))
const mainAns = computed(() => (main.value ? ans.value?.[main.value] : undefined))
const conf = computed(() => {
  const a = mainAns.value
  if (!a) return 0
  const top = Math.max(0, ...Object.values<number>(a.probabilities || {}))
  return Math.min(a.confidence ?? top, top || 1)
})
const route = computed(() => {
  if (!mainAns.value) return null
  const c = conf.value
  if (c >= th.value) return { k: 'auto', t: `自动 → ${mainAns.value.choice}` }
  if (c >= lo.value) return { k: 'llm', t: '交大模型复核' }
  return { k: 'human', t: '转人工' }
})
</script>
<template>
  <div class="demo pg">
    <DemoModeBar title="DEMO 2 · 工单分流" :ms="res?.wall" />
    <div class="tabs">
      <span class="dtitle">工单分流</span>
      <span class="tabnote">沿用前面的工单：一次判断紧急程度、处理部门和情绪，再演示分流</span>
    </div>
    <div class="pgrid">
      <div class="pl">
        <div class="dlabel">STATE</div>
        <div class="ticket-state-editor">
          <pre ref="stateHighlight" class="ticket-state-highlight" aria-hidden="true" v-html="highlightedState" />
          <textarea ref="stateInput" v-model="state" rows="3" class="st ticket-state-input" aria-label="材料" spellcheck="false" @scroll="syncStateScroll" @blur="formatState" />
        </div>
        <div class="chips ticket-examples">
          <button v-for="e in visibleExamples" :key="e.index" class="chip" :class="{ on: ei === e.index }" @click="pickExample(e.index)">{{ e.shortLabel }}</button>
          <button class="run" :disabled="loading" @click="run">{{ loading ? '判定中…' : res && !res.ok ? '↻ 重试请求' : 'Run request' }}</button>
        </div>
        <div class="dlabel">QUESTIONS · 是非 + 单选 + 评分，一次提交</div>
        <div class="qbox ticket-question-box">
          <QView :questions="sc.questions" compact hide-legend />
        </div>
      </div>
      <div class="pr ticket-response">
        <div class="dlabel">RESPONSE</div>
        <div class="ticket-response-content">
        <div v-if="err || (res && !res.ok)" class="err">出错：{{ err || res?.error }}</div>
        <RView v-if="ans && questions" :questions="questions" :answers="ans" />
        <div v-else-if="!err && !(res && !res.ok)" class="hint">Run request to see output</div>
        <template v-if="route">
          <div class="dlabel" style="margin-top:8px">分流：≥ <b>{{ th.toFixed(2) }}</b> 自动　≥ <b>{{ lo.toFixed(2) }}</b> 复核（按 {{ main }} 的把握度 {{ pct(conf) }}）</div>
          <div class="sl2">
            <label class="sll">自动放行线<input type="range" min="0.5" max="0.99" step="0.01" v-model.number="th" @input="lo = Math.min(lo, th)" /></label>
            <label class="sll">复核线（低于它转人工）<input type="range" min="0.3" max="0.9" step="0.01" v-model.number="lo" @input="th = Math.max(th, lo)" /></label>
          </div>
          <div class="route" :class="route.k">{{ route.t }}</div>
        </template>
        </div>
      </div>
    </div>
  </div>
</template>
