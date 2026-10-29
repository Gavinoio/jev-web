<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { callJev, type JevResult } from '../utils/jev'
import { moderateQuestions, moderateExamples } from '../utils/scenarios'

const text = ref('')
const ei = ref(-1)
const res = ref<JevResult | null>(null)
const loading = ref(false)
let timer: any = null
let seq = 0
let controller: AbortController | null = null

async function classify(value: string, id: number) {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  const r = await callJev(value, moderateQuestions, controller.signal)
  if (id === seq) { res.value = r; loading.value = false }
}

watch(text, (v) => {
  clearTimeout(timer)
  const my = ++seq
  controller?.abort()
  if (!v.trim()) { res.value = null; loading.value = false; return }
  res.value = null
  timer = setTimeout(() => classify(v, my), 350)
}, { flush: 'sync' })
function retry() { clearTimeout(timer); const my = ++seq; void classify(text.value, my) }
onBeforeUnmount(() => { clearTimeout(timer); controller?.abort() })
function pick(i: number) { ei.value = i; text.value = moderateExamples[i].state }

const a = computed(() => res.value?.data?.answers)
const ex = computed(() => (ei.value >= 0 && moderateExamples[ei.value].state === text.value ? moderateExamples[ei.value] : null))
const verdict = computed(() => {
  if (!a.value) return null
  if ((a.value.harassment?.noul ?? 0) >= 0.5) return { k: 'human', t: '隐藏' }
  if ((a.value.scam?.noul ?? 0) >= 0.7) return { k: 'llm', t: '交人工' }
  return { k: 'auto', t: '放行' }
})
</script>
<template>
  <div class="demo pg">
    <DemoModeBar title="DEMO 3 · 输入即判" :ms="res?.wall" />
    <div class="dlabel">STATE · 边打字边判（停顿 0.35 秒后自动请求）</div>
    <textarea v-model="text" rows="2" class="st" placeholder="在这里边打字边判……" />
    <div class="chips">
      <button v-for="(e, i) in moderateExamples" :key="i" class="chip" :class="{ on: ei === i }" @click="pick(i)">{{ e.label }}</button>
    </div>
    <div class="pgrid" style="margin-top:8px">
      <div class="pl">
        <div class="dlabel">QUESTIONS · 一次请求，三道题并行</div>
        <div class="qbox" style="max-height:250px"><QView :questions="moderateQuestions" compact /></div>
      </div>
      <div class="pr">
        <div class="dlabel">RESPONSE</div>
        <div v-if="res && !res.ok" class="err">出错：{{ res.error }} <button class="chip mini" @click="retry">重试请求</button></div>
        <RView v-if="a" :questions="moderateQuestions" :answers="a" />
        <div v-else-if="!(res && !res.ok)" class="hint">{{ loading ? '判定中…' : '输入或点上面的示例，结果会实时出现。' }}</div>
        <div v-if="verdict" class="route" :class="verdict.k">{{ verdict.t }}　<small>规则：辱骂 ≥ 0.5 隐藏 · 诈骗 ≥ 0.7 交人工</small></div>
      </div>
    </div>
  </div>
</template>
