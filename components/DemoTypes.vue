<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { callJev, callBox, pct, type JevResult } from '../utils/jev'
import { typeTabs, boxImages } from '../utils/typeDemos'

// 四个标签：是非 / 单选 / 打分（文字材料）+ 框选 box（图片）。每个标签：左边材料 + 题目，右边返回
const ti = ref(0) // 0..2 文字题型，3 = box
const isBox = computed(() => ti.value === 3)
const tab = computed(() => typeTabs[Math.min(ti.value, 2)])
const questionDrafts = ref(typeTabs.map((item) => JSON.stringify(item.questions, null, 2)))
const questionsText = computed({
  get: () => questionDrafts.value[Math.min(ti.value, 2)],
  set: (value: string) => { questionDrafts.value[Math.min(ti.value, 2)] = value },
})
const questionInput = ref<HTMLTextAreaElement | null>(null)
const questionHighlight = ref<HTMLElement | null>(null)
function escapeHtml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function highlightJson(text: string) {
  const tokenPattern = /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}\[\],:])/g
  const parts: string[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = tokenPattern.exec(text))) {
    parts.push(escapeHtml(text.slice(cursor, match.index)))
    const token = match[0]
    const color = match[1] ? 'qj-key' : match[2] ? 'qj-string' : match[3] ? 'qj-number' : match[4] ? 'qj-literal' : 'qj-punctuation'
    parts.push(`<span class="${color}">${escapeHtml(token)}</span>`)
    cursor = tokenPattern.lastIndex
  }
  parts.push(escapeHtml(text.slice(cursor)))
  return `${parts.join('')}\n`
}
const highlightedQuestions = computed(() => highlightJson(questionsText.value))
function syncQuestionScroll() {
  if (!questionInput.value || !questionHighlight.value) return
  questionHighlight.value.scrollTop = questionInput.value.scrollTop
  questionHighlight.value.scrollLeft = questionInput.value.scrollLeft
}
function validateQuestions(text: string) {
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { return 'JSON 格式有误，请检查括号、逗号和引号。' }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return '题目需要是 JSON 对象。'
  const entries = Object.entries(parsed as Record<string, unknown>)
  if (!entries.length) return '至少保留一道题。'
  for (const [key, value] of entries) {
    if (!key.trim() || !value || typeof value !== 'object' || Array.isArray(value)) return '每道题都需要有名称和对象内容。'
    const question = value as Record<string, unknown>
    if (!['noul', 'choice', 'score'].includes(String(question.type))) return '题型 type 需为 noul、choice 或 score。'
    if (typeof question.instructions !== 'string' || !question.instructions.trim()) return '每道题都需要填写 instructions。'
    if (question.type === 'choice') {
      const criteria = question.criteria
      if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria) || !Object.keys(criteria).length || !Object.values(criteria).every((item) => typeof item === 'string')) return 'choice 题需要填写 criteria 选项对象。'
    }
    if (question.type === 'score' && (!Array.isArray(question.criteria) || question.criteria.length < 2 || !question.criteria.every((item) => typeof item === 'string'))) return 'score 题的 criteria 至少需要两个等级。'
  }
  return ''
}
const questionError = computed(() => validateQuestions(questionsText.value))
const activeQuestions = computed<Record<string, any>>(() => questionError.value ? tab.value.questions : JSON.parse(questionsText.value))

// ---- 文字题型 ----
const ei = ref(0)
const state = ref(typeTabs[0].examples[0].state)
const res = ref<JevResult | null>(null)
const loading = ref(false)
let requestId = 0
let controller: AbortController | null = null
const ex = computed(() => tab.value.examples[ei.value])
function pickEx(i: number) { ei.value = i; state.value = tab.value.examples[i].state; res.value = null }
function pickTab(i: number) {
  ti.value = i
  res.value = null
  if (i < 3) { ei.value = 0; state.value = typeTabs[i].examples[0].state }
  else { bres.value = null }
}
async function run() {
  if (questionError.value) return
  const id = ++requestId
  controller?.abort()
  controller = new AbortController()
  const requestState = state.value
  const requestQuestions = activeQuestions.value
  loading.value = true
  res.value = null
  const response = await callJev(requestState, requestQuestions, controller.signal)
  if (id === requestId) { res.value = response; loading.value = false }
}
watch([state, ti, questionsText], () => { requestId++; controller?.abort(); loading.value = false; res.value = null }, { flush: 'sync' })
const ans = computed(() => res.value?.data?.answers)

// ---- box ----
const ii = ref(0)
const ci = ref(0)
const img = computed(() => boxImages[ii.value])
const target = ref(boxImages[0].targets[0].target)
const bres = ref<JevResult | null>(null)
const bloading = ref(false)
let boxRequestId = 0
let boxController: AbortController | null = null
function pickImg(i: number) { ii.value = i; ci.value = 0; target.value = boxImages[i].targets[0].target; bres.value = null }
function pickTarget(i: number) { ci.value = i; target.value = img.value.targets[i].target; bres.value = null }
const boxQuestions = computed(() => ({
  visible: { type: 'noul', instructions: `Is the following visible in \`photo\`: ${target.value}?` },
  target: { type: 'box', instructions: `${target.value} in \`photo\`` },
}))
async function runBox() {
  const id = ++boxRequestId
  boxController?.abort()
  boxController = new AbortController()
  bloading.value = true
  bres.value = null
  const response = await callBox(img.value.src.split('/').pop()!, target.value, boxController.signal)
  if (id === boxRequestId) { bres.value = response; bloading.value = false }
}
watch([ii, target], () => { boxRequestId++; boxController?.abort(); bloading.value = false; bres.value = null }, { flush: 'sync' })
onBeforeUnmount(() => { controller?.abort(); boxController?.abort() })
const bAns = computed(() => bres.value?.data?.answers)
const bBox = computed(() => bAns.value?.target?.box as { top: number; bottom: number; left: number; right: number } | undefined)
const bVisible = computed(() => Number(bAns.value?.visible?.noul ?? 0))
const rectStyle = computed(() => {
  const b = bBox.value
  if (!b) return null
  return { left: b.left * 100 + '%', top: b.top * 100 + '%', width: (b.right - b.left) * 100 + '%', height: (b.bottom - b.top) * 100 + '%' }
})
const note = computed(() => img.value.targets[ci.value]?.note)
</script>
<template>
  <div class="demo pg">
    <DemoModeBar title="DEMO 1 · 四种题型" :ms="isBox ? bres?.wall : res?.wall" />
    <div class="tabs">
      <button v-for="(t, i) in typeTabs" :key="t.id" class="tab" :class="{ on: ti === i }" @click="pickTab(i)">{{ t.name }}</button>
      <button class="tab" :class="{ on: isBox }" @click="pickTab(3)">图像题 Box</button>
      <span class="tabnote">{{ isBox ? '返回图中目标的位置：上 / 下 / 左 / 右四条边（占图片宽高的比例）' : tab.intro }}</span>
    </div>

    <!-- 文字题型 -->
    <div v-if="!isBox" class="pgrid">
      <div class="pl">
        <div class="dlabel">STATE</div>
        <textarea v-model="state" rows="3" class="st" />
        <div class="chips">
          <button v-for="(e, i) in tab.examples" :key="i" class="chip" :class="{ on: ei === i }" @click="pickEx(i)">{{ e.label }}</button>
          <button class="run" :disabled="loading || !!questionError" @click="run">{{ loading ? '判定中…' : res && !res.ok ? '↻ 重试请求' : 'Run request' }}</button>
        </div>
        <div v-if="ex.note" class="exp none"><span class="expn">{{ ex.note }}</span></div>
        <div class="dlabel">QUESTIONS</div>
        <div class="qbox question-editor">
          <div class="qedit-wrap">
            <pre ref="questionHighlight" class="qedit-highlight" aria-hidden="true" v-html="highlightedQuestions" />
            <textarea ref="questionInput" v-model="questionsText" class="qedit" aria-label="题目 JSON" spellcheck="false" :aria-invalid="!!questionError" @scroll="syncQuestionScroll" />
          </div>
          <div v-if="questionError" class="question-error">{{ questionError }}</div>
        </div>
      </div>
      <div class="pr ticket-response">
        <div class="dlabel">RESPONSE</div>
        <div class="ticket-response-content">
        <div v-if="res && !res.ok" class="err">出错：{{ res.error }}</div>
        <RView v-if="ans" :questions="activeQuestions" :answers="ans" />
        <div v-else-if="!(res && !res.ok)" class="hint">Run request to see output</div>
        </div>
      </div>
    </div>

    <!-- box -->
    <div v-else class="pgrid">
      <div class="pl">
        <div class="dlabel">STATE · 图片（先选图，再选要找的目标）</div>
        <div class="boxwrap">
          <img :src="img.src" />
          <div v-if="rectStyle" class="rect" :style="rectStyle"><span>{{ pct(Number(bAns?.target?.confidence ?? 0)) }}</span></div>
        </div>
        <div class="chips">
          <button v-for="(m, i) in boxImages" :key="m.id" class="chip" :class="{ on: ii === i }" @click="pickImg(i)">{{ m.name }}</button>
        </div>
        <div class="chips">
          <button v-for="(t, i) in img.targets" :key="t.target" class="chip" :class="{ on: ci === i }" @click="pickTarget(i)">{{ t.label }}</button>
        </div>
        <div class="chips">
          <input v-model="target" class="tin" placeholder="要找什么（英文描述更稳）" />
          <button class="run" :disabled="bloading" @click="runBox">{{ bloading ? '定位中…' : bres && !bres.ok ? '↻ 重试定位' : 'Run request' }}</button>
        </div>
        <div v-if="note" class="exp none"><b>看点</b><span class="expn">{{ note }}</span></div>
      </div>
      <div class="pr ticket-response">
        <div class="dlabel">QUESTIONS · 一个 box + 一道配套的是非题</div>
        <div class="qbox" style="max-height:210px"><QView :key="target" :questions="boxQuestions" compact /></div>
        <div class="dlabel">RESPONSE</div>
        <div class="ticket-response-content">
        <div v-if="bres && !bres.ok" class="err">出错：{{ bres.error }}</div>
        <template v-if="bBox">
          <div class="rv"><div class="rq">
            <div class="rqh"><span class="rk">target</span><span class="rt">Box 框选</span><span class="rhl">confidence {{ pct(Number(bAns?.target?.confidence ?? 0)) }}</span></div>
            <div class="edges">
              <span><i>left</i>{{ bBox.left.toFixed(2) }}</span><span><i>top</i>{{ bBox.top.toFixed(2) }}</span>
              <span><i>right</i>{{ bBox.right.toFixed(2) }}</span><span><i>bottom</i>{{ bBox.bottom.toFixed(2) }}</span>
            </div>
          </div></div>
          <RView :questions="{ visible: boxQuestions.visible }" :answers="{ visible: bAns.visible }" />
          <div class="route" :class="bVisible >= 0.5 ? 'auto' : 'human'">{{ bVisible >= 0.5 ? '图里有它 → 框可用' : '图里没有 → 忽略这个框' }}　<small>Box 永远返回一个框，要靠是非题判断"有没有"</small></div>
        </template>
        <div v-else-if="!(bres && !bres.ok)" class="hint">Run request to see output</div>
        </div>
      </div>
    </div>
  </div>
</template>
