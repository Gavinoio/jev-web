<!-- Adapted from anishfn/shapeshift (MIT): Chinese copy, Vue/Slidev UI and local parsers. -->
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { CalendarDays, Bell, ListChecks, Timer, Sun, Palette, Users, Wallet, Ruler, Calculator, Plane, Vote, Contact, Link2, CalendarClock, Globe, Dices, Target, StickyNote, Search, MapPin } from '@lucide/vue'
import { callJev, pct, type JevResult } from '../utils/jev'
import { hexToOklch, shades, withLightness } from '../utils/shiftColor'
import {
  shiftQuestions, shiftExamples, CARDS, TH, initialMemory, decide, force, promote, hysteresis,
  parseEvent, parseReminder, parseTodo, parseDuration, parseHabit, parseColor, parseSplit, parseExpense,
  parseConvert, parseCalc, parsePoll, parseCountdown, parseRandom, parseTravel, parseContact, parseLink, parseTimezone, parseGoal, money,
  type CardKey, type IntentAnswer, type Memory,
} from '../utils/shift'

const STORE_KEY = 'jev-shapeshift-saved'
const PLACEHOLDERS = ['明天中午和小王、小李吃饭', '提醒我周五给妈妈回电话', '计划下月坐高铁去杭州玩两天', '我已经读完4本书，目标是12本']
const EXAMPLE_FOR: Record<CardKey, string> = {
  event: shiftExamples[0], reminder: shiftExamples[2], todo: shiftExamples[3], timer: shiftExamples[4], habit: shiftExamples[5], color: shiftExamples[6], split: shiftExamples[7], expense: shiftExamples[8], convert: shiftExamples[9], calc: shiftExamples[10], poll: shiftExamples[12], travel: shiftExamples[11], contact: shiftExamples[13], link: shiftExamples[14], countdown: shiftExamples[15], timezone: shiftExamples[16], random: shiftExamples[17], goal: shiftExamples[18], note: shiftExamples[19],
}
const PALETTE_ICONS: Record<CardKey, any> = { event: CalendarDays, reminder: Bell, todo: ListChecks, timer: Timer, habit: Sun, color: Palette, split: Users, expense: Wallet, convert: Ruler, calc: Calculator, travel: Plane, poll: Vote, contact: Contact, link: Link2, countdown: CalendarClock, timezone: Globe, random: Dices, goal: Target, note: StickyNote }

const text = ref('')
const input = ref<HTMLInputElement | null>(null)
const paletteInput = ref<HTMLInputElement | null>(null)
const paletteList = ref<HTMLElement | null>(null)
const result = ref<JevResult | null>(null)
const answers = ref<Record<string, any>>({})
const intent = ref<IntentAnswer | null>(null)
const memory = ref<Memory>(initialMemory)
const loading = ref(false)
const urgent = ref(false)
const localFallbackReason = ref('')
type SavedCard = { icon: string; name: string; text: string; key?: CardKey }
const saved = ref<SavedCard[]>([])
const editing = ref<number | null>(null)
const removed = ref<{ item: SavedCard; index: number } | null>(null)
const paletteOpen = ref(false)
const paletteQuery = ref('')
const paletteIndex = ref(0)
const chooseIndex = ref(0)
const requestedType = ref<CardKey | null>(null)
const placeholderIndex = ref(0)
const clockNow = ref(new Date())
const message = ref('')
const copyMessage = ref('')
const placeholder = computed(() => PLACEHOLDERS[placeholderIndex.value % PLACEHOLDERS.length])
const allIntents = Object.keys(CARDS) as CardKey[]
const paletteItems = computed(() => allIntents.filter((key) => `${CARDS[key].name} ${key} ${EXAMPLE_FOR[key]}`.toLowerCase().includes(paletteQuery.value.trim().toLowerCase())))
watch(paletteQuery, () => { paletteIndex.value = 0 })

let debounce: ReturnType<typeof setTimeout> | undefined
let requestTimeout: ReturnType<typeof setTimeout> | undefined
let toastTimer: ReturnType<typeof setTimeout> | undefined
let placeholderTimer: ReturnType<typeof setInterval> | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined
let sequence = 0
let controller: AbortController | null = null

function showMessage(value: string) {
  message.value = value
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (message.value = ''), 2200)
}
function persistSaved() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(saved.value)) } catch {}
}
function loadSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
    if (Array.isArray(value)) saved.value = value.filter((x) => x && typeof x.text === 'string' && x.text.trim())
  } catch { saved.value = [] }
}

watch(text, (value) => {
  requestedType.value = null
  clearTimeout(debounce)
  const my = ++sequence
  controller?.abort()
  clearTimeout(requestTimeout)
  if (!value.trim()) {
    memory.value = initialMemory
    result.value = null
    answers.value = {}
    intent.value = null
    loading.value = false
    urgent.value = false
    localFallbackReason.value = ''
    return
  }
  if (memory.value.ui.kind === 'committed' && memory.value.ui.forced) {
    memory.value = force(memory.value.ui.intent, value)
    result.value = null
    answers.value = {}
    intent.value = null
    loading.value = false
    urgent.value = false
    localFallbackReason.value = ''
    return
  }
  // 保留卡片状态，让判断结果通过状态机平滑切换；旧请求仍立即作废。
  result.value = null
  loading.value = true
  localFallbackReason.value = ''
  debounce = setTimeout(() => ask(value, my), 320)
}, { flush: 'sync' })

async function ask(value = text.value, my = sequence) {
  if (!value.trim() || my !== sequence) return
  controller?.abort()
  controller = new AbortController()
  const requestController = controller
  let timedOut = false
  loading.value = true
  localFallbackReason.value = ''
  const timeout = setTimeout(() => { timedOut = true; requestController.abort() }, 26_000)
  requestTimeout = timeout
  const response = await callJev(value, shiftQuestions, requestController.signal)
  clearTimeout(timeout)
  if (requestTimeout === timeout) requestTimeout = undefined
  if (my !== sequence) return
  loading.value = false
  if (!response.ok) {
    memory.value = initialMemory; answers.value = {}; intent.value = null; result.value = null
    localFallbackReason.value = timedOut ? '模拟处理超时，请重试。' : response.error || '离线模拟失败'
    return
  }
  const apiAnswers = response.data?.answers
  const actualIntent = apiAnswers?.intent
  const invalidAnswer = !apiAnswers || Object.entries(shiftQuestions).some(([key, question]) => {
    const answer = apiAnswers?.[key]
    if (!answer) return true
    if (question.type === 'choice') return typeof answer.choice !== 'string' || !Object.hasOwn(question.criteria, answer.choice)
    if (question.type === 'score') return typeof answer.score !== 'number' || !Number.isFinite(answer.score)
    return typeof answer.noul !== 'number' || !Number.isFinite(answer.noul)
  })
  if (invalidAnswer || !actualIntent?.probabilities || typeof actualIntent.confidence !== 'number') {
    memory.value = initialMemory; answers.value = {}; intent.value = null; result.value = null
    localFallbackReason.value = 'Jev 返回结果不完整，请重试。'
    return
  }
  result.value = response
  answers.value = apiAnswers
  const classified: IntentAnswer = { value: actualIntent.choice, probabilities: actualIntent.probabilities, confidence: actualIntent.confidence }
  intent.value = classified
  memory.value = requestedType.value ? force(requestedType.value, value) : decide(memory.value, classified, value)
  urgent.value = hysteresis(Number(answers.value.urgency?.score ?? 0), urgent.value, 1.2, 1.0)
}

const ui = computed(() => memory.value.ui)
const active = computed<CardKey | null>(() => (ui.value.kind === 'committed' || ui.value.kind === 'ghost' ? ui.value.intent : null))
const ghost = computed(() => ui.value.kind === 'ghost')
const top3 = computed(() => Object.entries(intent.value?.probabilities || {}).sort((a, b) => b[1] - a[1]).slice(0, 3))
const signal = (key: string) => answers.value[key] || {}
const signalChoice = (key: string, fallback: string) => signal(key).choice || fallback
const STATE_LABEL: Record<string, string> = { input: '继续输入', ghost: '预览卡片', choose: '选一种类型', committed: '卡片已就绪' }
const cardLabel = (key: string) => CARDS[key].name
const stateTone = computed(() => ui.value.kind === 'ghost' ? 'ghost' : ui.value.kind === 'choose' ? 'choose' : ui.value.kind === 'committed' ? 'ready' : 'idle')

const card = computed<any>(() => {
  switch (active.value) {
    case 'event': return parseEvent(text.value)
    case 'reminder': return parseReminder(text.value)
    case 'todo': return parseTodo(text.value)
    case 'habit': return parseHabit(text.value)
    case 'color': return parseColor(text.value)
    case 'split': return parseSplit(text.value) || { total: 0, n: 2, each: 0, diff: 0 }
    case 'expense': return parseExpense(text.value, signalChoice('expenseCategory', 'other'))
    case 'convert': return parseConvert(text.value)
    case 'calc': return parseCalc(text.value)
    case 'poll': return parsePoll(text.value)
    case 'countdown': return parseCountdown(text.value)
    case 'travel': return parseTravel(text.value)
    case 'contact': return parseContact(text.value)
    case 'link': return parseLink(text.value)
    case 'timezone': return parseTimezone(text.value, clockNow.value)
    case 'goal': return parseGoal(text.value)
    default: return null
  }
})

const todoDone = ref<Record<string, boolean>>({})
watch(active, () => { todoDone.value = {}; habitChecks.value = Array(7).fill(false) })
const duration = computed(() => active.value === 'timer' ? parseDuration(text.value) || 25 * 60 : 0)
const secondsLeft = ref(0)
const stopwatchSeconds = ref(0)
const timerRunning = ref(false)
let tick: ReturnType<typeof setInterval> | undefined
watch([duration, active], ([value]) => { secondsLeft.value = value; stopwatchSeconds.value = 0; stopTimer() }, { immediate: true })
function stopTimer() { timerRunning.value = false; clearInterval(tick) }
function toggleTimer() {
  if (timerRunning.value) { stopTimer(); return }
  if (!secondsLeft.value && signalChoice('timerKind', 'countdown') !== 'stopwatch') return
  const started = Date.now()
  const initial = signalChoice('timerKind', 'countdown') === 'stopwatch' ? stopwatchSeconds.value : secondsLeft.value
  timerRunning.value = true
  tick = setInterval(() => {
    const elapsed = Math.floor((Date.now() - started) / 1000)
    if (signalChoice('timerKind', 'countdown') === 'stopwatch') stopwatchSeconds.value = initial + elapsed
    else { secondsLeft.value = Math.max(0, initial - elapsed); if (!secondsLeft.value) stopTimer() }
  }, 250)
}
const timerKindLabel = computed(() => ({ focus: '专注', break: '休息', stopwatch: '秒表', countdown: '倒计时', unspecified: '倒计时' }[signalChoice('timerKind', 'countdown')] || '倒计时'))
const formatTime = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
const shownTime = computed(() => signalChoice('timerKind', 'countdown') === 'stopwatch' ? formatTime(stopwatchSeconds.value) : formatTime(secondsLeft.value))
const habitChecks = ref<boolean[]>(Array(7).fill(false))
const votes = ref<Record<string, number>>({})
const voteTotal = computed(() => Object.values(votes.value).reduce((sum, n) => sum + n, 0))
watch(() => card.value?.options?.join('|'), () => (votes.value = {}))
const goalCurrent = ref<number | null>(null)
watch(() => card.value?.current, (value) => { if (typeof value === 'number') goalCurrent.value = value }, { immediate: true })
const goalPercent = computed(() => card.value?.target ? Math.min(100, Math.round(((goalCurrent.value ?? card.value.current) / card.value.target) * 100)) : 0)
const randomRoll = ref(0)
const randomResult = computed(() => {
  void randomRoll.value
  if (active.value !== 'random') return null
  const rule = parseRandom(text.value)
  const rand = (n: number) => Math.floor(Math.random() * n)
  if (rule.kind === 'dice') { const faces = Array.from({ length: rule.n }, () => rand(rule.sides) + 1); return { title: `${rule.n} 个 ${rule.sides} 面骰`, value: faces.join('、'), detail: `合计 ${faces.reduce((a, b) => a + b, 0)}` } }
  if (rule.kind === 'coin') return { title: '抛硬币', value: rand(2) ? '正面' : '反面', detail: '再试一次看看' }
  if (rule.kind === 'range') { const lo = Math.min(rule.lo, rule.hi), hi = Math.max(rule.lo, rule.hi); return { title: `${lo} 到 ${hi} 的随机数`, value: String(lo + rand(hi - lo + 1)), detail: '包含两端' } }
  return { title: `从 ${rule.options.length} 个选项中抽取`, value: rule.options[rand(rule.options.length)], detail: rule.options.join(' · ') }
})
const checkedTravel = ref<Record<string, boolean>>({})
const travelBasics = ['证件', '车票 / 机票', '住宿']
const eventDate = ref('')
const travelStart = ref('')
const travelEnd = ref('')
const splitTotal = ref<number | null>(null)
const splitPeople = ref<number | null>(null)
const expenseCategory = ref('')
const pickedColor = ref('')
const colorLightness = ref<number | null>(null)
const convertFrom = ref('')
const convertTo = ref('')
const unitGroups = [['公里', '英里', '米', '英尺', '英寸', '厘米', '毫米'], ['公斤', '斤', '磅', '克', '盎司'], ['摄氏度', '华氏度'], ['升', '毫升', '加仑']]
const converted = computed(() => {
  if (!card.value || active.value !== 'convert') return null
  const from = convertFrom.value || card.value.from, to = convertTo.value || card.value.to
  return from === to ? { out: card.value.v } : parseConvert(`${card.value.v}${from}转成${to}`)
})
const availableUnits = computed(() => unitGroups.find(group => group.includes(card.value?.from)) || [])
watch(text, () => { eventDate.value = ''; travelStart.value = ''; travelEnd.value = ''; splitTotal.value = null; splitPeople.value = null; expenseCategory.value = ''; pickedColor.value = ''; colorLightness.value = null; convertFrom.value = ''; convertTo.value = '' })
function appendDraft(value: string) { text.value = `${text.value.trimEnd()}${value}`; nextTick(() => input.value?.focus()) }
const displayedColor = computed(() => { const base = pickedColor.value || card.value?.hex; return base ? colorLightness.value === null ? base : withLightness(base, colorLightness.value / 100) : '' })
const baseLightness = computed(() => Math.round((hexToOklch(pickedColor.value || card.value?.hex || '')?.l ?? .6) * 100))
const paletteShades = computed(() => card.value?.hex ? shades(card.value.hex) : [])

function saveCurrent() {
  if (!active.value || !text.value.trim() || loading.value || (!result.value?.ok && !(memory.value.ui.kind === 'committed' && memory.value.ui.forced))) return
  const item: SavedCard = { key: active.value, icon: CARDS[active.value].icon, name: CARDS[active.value].name, text: text.value }
  if (editing.value !== null) saved.value.splice(editing.value, 1, item)
  else saved.value.unshift(item)
  persistSaved()
  editing.value = null
  text.value = ''
  nextTick(() => input.value?.focus())
}
function reopenSaved(index: number) {
  const item = saved.value[index]
  const key = item.key || allIntents.find((k) => CARDS[k].name === item.name)
  if (!key) return
  if (active.value && text.value.trim() && (editing.value === null || saved.value[editing.value] !== item)) saveCurrent()
  const actualIndex = saved.value.indexOf(item)
  editing.value = actualIndex
  requestType(key, item.text)
}
function removeSaved(index: number) {
  const item = saved.value.splice(index, 1)[0]
  if (!item) return
  removed.value = { item, index }; persistSaved()
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { removed.value = null }, 6000)
}
function undoRemove() { if (removed.value) { saved.value.splice(removed.value.index, 0, removed.value.item); removed.value = null; persistSaved() } }
function chooseIntent(key: CardKey) {
  requestType(key, text.value || EXAMPLE_FOR[key])
  paletteOpen.value = false
  paletteQuery.value = ''
}
function requestType(key: CardKey, sample: string) {
  text.value = sample
  clearTimeout(debounce)
  clearTimeout(requestTimeout)
  ++sequence
  controller?.abort()
  result.value = null
  answers.value = {}
  intent.value = null
  memory.value = force(key, sample)
  localFallbackReason.value = ''
  loading.value = false
  requestedType.value = key
  nextTick(() => input.value?.focus())
}
function openPalette() { paletteOpen.value = true; paletteQuery.value = ''; paletteIndex.value = 0; nextTick(() => paletteInput.value?.focus()) }
function onInputKey(event: KeyboardEvent) {
  event.stopPropagation()
  if (paletteOpen.value) {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && paletteItems.value.length) { event.preventDefault(); paletteIndex.value = (paletteIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + paletteItems.value.length) % paletteItems.value.length; nextTick(() => paletteList.value?.querySelector('.focused')?.scrollIntoView({ block: 'nearest' })) }
    else if (event.key === 'Enter' && paletteItems.value.length) { event.preventDefault(); chooseIntent(paletteItems.value[paletteIndex.value] || paletteItems.value[0]) }
    else if (event.key === 'Escape') { event.preventDefault(); paletteOpen.value = false }
    return
  }
  if (ui.value.kind === 'choose') {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); chooseIndex.value = (chooseIndex.value + (event.key === 'ArrowRight' ? 1 : -1) + ui.value.options.length) % ui.value.options.length; return }
    if (event.key === 'Enter') { event.preventDefault(); chooseIntent(ui.value.options[chooseIndex.value]); return }
  }
  if (event.key === 'Tab' && !event.shiftKey && ui.value.kind === 'ghost') { event.preventDefault(); memory.value = promote(memory.value) }
  else if (event.key === 'Escape') { event.preventDefault(); editing.value = null; text.value = '' }
  else if (event.key === 'Enter' && active.value) { event.preventDefault(); saveCurrent() }
  else if (event.key === '/' && !text.value && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); openPalette() }
}
function handleGlobalKey(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (!paletteOpen.value && ui.value.kind === 'choose') {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); chooseIndex.value = (chooseIndex.value + (event.key === 'ArrowRight' ? 1 : -1) + ui.value.options.length) % ui.value.options.length; return }
    if (event.key === 'Enter') { event.preventDefault(); chooseIntent(ui.value.options[chooseIndex.value]); return }
  }
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '')) { event.preventDefault(); openPalette() }
  if (event.key === 'Escape' && paletteOpen.value) paletteOpen.value = false
}
function useExample(value: string) { text.value = value; nextTick(() => input.value?.focus()) }
async function copy(value: string) {
  if (!value) return
  try { await navigator.clipboard.writeText(value); copyMessage.value = '已复制'; setTimeout(() => (copyMessage.value = ''), 1300) }
  catch { copyMessage.value = '请手动复制'; setTimeout(() => (copyMessage.value = ''), 1800) }
}
function retry() { clearTimeout(debounce); controller?.abort(); const my = ++sequence; ask(text.value, my) }

onMounted(() => {
  loadSaved()
  placeholderTimer = setInterval(() => { placeholderIndex.value++ }, 2800)
  clockTimer = setInterval(() => { clockNow.value = new Date() }, 15_000)
  document.addEventListener('keydown', handleGlobalKey)
})
onBeforeUnmount(() => {
  clearTimeout(debounce); clearTimeout(requestTimeout); clearTimeout(toastTimer); clearInterval(placeholderTimer); clearInterval(clockTimer); clearInterval(tick)
  controller?.abort()
  document.removeEventListener('keydown', handleGlobalKey)
})
</script>

<template>
  <section class="shift-shell" aria-label="Jev 中文卡片变形演示">
    <div class="shift-response-time">离线模拟</div>
    <main class="shift-main">
      <div class="morph-shell" :class="{ expanded: active }">
      <div class="input-wrap" :class="{ 'has-result': active || ui.kind === 'choose' }">
        <input ref="input" v-model="text" class="shift-input" :placeholder="placeholder" aria-label="输入一句话创建卡片" @keydown="onInputKey" />
        <button v-if="text" class="clear-input" aria-label="清空输入" title="清空" @click="text = ''">×</button>
      </div>
      <div v-if="active && !loading && !localFallbackReason" class="result-stage">
        <Transition name="card-morph" mode="out-in">
          <article :key="active" class="result-card" :class="{ ghost }">
            <div class="card-topline">
              <div class="card-kind"><span class="kind-icon"><component :is="PALETTE_ICONS[active]" /></span><h2>{{ CARDS[active].name }}</h2></div>
              <span v-if="urgent && ['reminder', 'todo', 'event'].includes(active)" class="urgent-badge">尽快处理</span>
            </div>

            <div class="card-content" :inert="ghost">
            <template v-if="active === 'event'">
              <h3 class="card-title">{{ card.title || '安排一次见面' }}</h3>
              <div class="event-fields"><label class="event-chip"><CalendarDays /> {{ eventDate || card.when }}<input v-model="eventDate" type="date" :disabled="ghost" aria-label="修改日期" /></label><button v-if="!card.hasTime" class="missing-chip" @click="appendDraft(' ')" >＋ 添加时间</button><div class="event-line"><MapPin /> <span v-if="card.place || signalChoice('eventMode', 'unspecified') === 'video_call'">{{ card.place || '线上会议' }}</span><button v-else class="missing-chip" @click="appendDraft(' 在')">＋ 添加地点</button></div><div class="event-line"><span v-if="card.people.length">{{ card.people.join('、') }}</span><button v-else class="missing-chip" @click="appendDraft(' 和')">＋ 添加参与人</button></div></div>
            </template>
            <template v-else-if="active === 'reminder'"><div class="reminder-body"><h3 class="card-title">{{ card.task }}</h3><span class="event-chip">◷ {{ card.when }}</span></div></template>
            <template v-else-if="active === 'todo'"><div class="list-head"><span>{{ signal('isShoppingList').noul >= 0.65 ? '购物清单' : '待办事项' }}</span><small>{{ Object.values(todoDone).filter(Boolean).length }} / {{ card.items.length }} 已完成</small></div><label v-for="item in card.items" :key="item" class="task-row" :class="{ complete: todoDone[item] }"><input v-model="todoDone[item]" type="checkbox" :disabled="ghost" /><span>{{ item }}</span></label><button class="missing-chip" :disabled="ghost" @click="appendDraft('、')">＋ 添加事项</button></template>
            <template v-else-if="active === 'timer'"><div class="timer-view"><div class="timer-time">{{ shownTime }}</div><span>{{ timerKindLabel }} · {{ signalChoice('timerKind', 'countdown') === 'stopwatch' ? '正向计时' : `${Math.ceil(duration / 60)} 分钟` }}</span><div class="action-row"><button class="primary-action" :disabled="ghost || (!secondsLeft && signalChoice('timerKind', 'countdown') !== 'stopwatch')" @click="toggleTimer">{{ timerRunning ? '暂停' : '开始' }}</button><button class="secondary-action" :disabled="ghost || (secondsLeft === duration && !stopwatchSeconds)" @click="secondsLeft = duration; stopwatchSeconds = 0; stopTimer()">重置</button></div></div></template>
            <template v-else-if="active === 'habit'"><h3 class="card-title">{{ card.action }}</h3><div class="list-head"><span>每周 {{ card.perWeek }} 次</span><small>选择每周的日期</small></div><div class="habit-days"><button v-for="(day, index) in '一二三四五六日'" :key="day" :class="{ checked: habitChecks[index] }" :disabled="ghost" @click="habitChecks[index] = !habitChecks[index]">{{ day }}</button></div></template>
            <template v-else-if="active === 'color'"><template v-if="card"><div class="color-preview"><div :style="{ background: displayedColor }" /><b>{{ displayedColor.toUpperCase() }}</b></div><div class="shade-list"><button v-for="shade in paletteShades" :key="shade" :style="{ background: shade }" :aria-label="`选择颜色 ${shade}`" :disabled="ghost" @click="pickedColor = shade; colorLightness = null" /></div><label class="slider-label">亮度 <input :value="colorLightness ?? baseLightness" type="range" min="10" max="96" :disabled="ghost" @input="colorLightness = Number(($event.target as HTMLInputElement).value)" /></label></template><div v-else class="empty-card">输入颜色名称或 #色号。</div></template>
            <template v-else-if="active === 'split'"><div class="money-hero">¥{{ money((splitTotal ?? card.total) / (splitPeople ?? card.n)) }}<small>每人</small></div><div class="edit-controls"><label>总金额 <input :value="splitTotal ?? card.total" type="number" min="0" :disabled="ghost" @input="splitTotal = Math.max(0, Number(($event.target as HTMLInputElement).value))" /></label><span>人数 <button :disabled="ghost || (splitPeople ?? card.n) <= 1" @click="splitPeople = Math.max(1, (splitPeople ?? card.n) - 1)">−</button> {{ splitPeople ?? card.n }} <button :disabled="ghost || (splitPeople ?? card.n) >= 99" @click="splitPeople = Math.min(99, (splitPeople ?? card.n) + 1)">＋</button></span></div></template>
            <template v-else-if="active === 'expense'"><template v-if="card"><div class="money-hero">¥{{ money(card.amount) }}</div><div class="edit-controls"><span>{{ card.item }}</span><select v-model="expenseCategory" :disabled="ghost" aria-label="支出分类"><option value="">{{ card.cat }}</option><option value="food">餐饮</option><option value="transport">交通</option><option value="shopping">购物</option><option value="bills">账单</option><option value="entertainment">娱乐</option><option value="other">其他</option></select></div></template><div v-else class="empty-card">还没找到金额，请补充具体支出金额。</div></template>
            <template v-else-if="active === 'convert'"><template v-if="card"><div class="conversion">{{ card.v }} <select v-model="convertFrom" :disabled="ghost" aria-label="原单位"><option value="">{{ card.from }}</option><option v-for="unit in availableUnits" :key="unit" :value="unit">{{ unit }}</option></select><button :disabled="ghost" aria-label="交换单位" @click="[convertFrom, convertTo] = [convertTo || card.to, convertFrom || card.from]">⇄</button> {{ converted?.out ?? '—' }} <select v-model="convertTo" :disabled="ghost" aria-label="目标单位"><option value="">{{ card.to }}</option><option v-for="unit in availableUnits" :key="unit" :value="unit">{{ unit }}</option></select></div></template><div v-else class="empty-card">没有识别到单位，可试试「72 华氏度换算成摄氏度」。</div></template>
            <template v-else-if="active === 'calc'"><template v-if="card"><div class="calculation"><small>{{ card.expr }}</small><b>{{ card.result }}</b></div></template><div v-else class="empty-card">没有识别到算式，可试试「1999 元打八五折」。</div></template>
            <template v-else-if="active === 'travel'"><h3 class="card-title">{{ card.title }}</h3><div class="detail-grid"><div><small>目的地</small><b>{{ card.destination }}</b></div><div><small>交通方式</small><b>{{ card.transport }}</b></div></div><div class="edit-controls"><label>出发 <input v-model="travelStart" type="date" :disabled="ghost" /></label><label>返回 <input v-model="travelEnd" type="date" :min="travelStart" :disabled="ghost" /></label></div></template>
            <template v-else-if="active === 'poll'"><template v-if="card"><h3 class="card-title">{{ card.title }}</h3><div v-for="option in card.options" :key="option" class="poll-option"><b>{{ option }}</b><small>0%</small></div></template><div v-else class="empty-card">写出两个以上选项，例如「周五吃火锅还是烧烤？」</div><button class="missing-chip" :disabled="ghost" @click="appendDraft(' 或')">＋ 添加选项</button></template>
            <template v-else-if="active === 'contact'"><h3 class="card-title">{{ card.name }}</h3><div class="detail-grid two"><div><small>手机</small><b>{{ card.phone || '未填写' }}</b></div><div><small>电子邮箱</small><b>{{ card.email || '未填写' }}</b></div></div><button v-if="card.phone || card.email" class="soft-action" @click="copy(card.phone || card.email)">{{ copyMessage || '复制联系方式' }}</button></template>
            <template v-else-if="active === 'link'"><h3 class="card-title">{{ card.title }}</h3><a v-if="card.url" class="saved-link" :href="card.url" target="_blank" rel="noreferrer">{{ card.url }} <span>↗</span></a><div v-else class="empty-card">请补充一个网址，例如 https://example.com</div></template>
            <template v-else-if="active === 'countdown'"><template v-if="card"><div class="countdown-hero"><b>{{ card.days }}</b><span>天</span></div><div class="detail-grid two"><div><small>目标</small><b>{{ card.name }}</b></div><div><small>日期</small><b>{{ card.date }}</b></div></div></template><div v-else class="empty-card">没有识别到日期，可试试「距离元旦还有几天」。</div></template>
            <template v-else-if="active === 'timezone'"><div class="timezone-compare"><div><small>{{ card.from }} · 输入时间</small><b>{{ card.sourceTime }}</b></div><span>→</span><div><small>{{ card.to }} · 对应时间</small><b>{{ card.targetTime }}</b></div></div><p class="fine-print">按本地时区规则计算{{ card.hasExplicitTime ? '输入的时间' : '当前时间' }}。</p></template>
            <template v-else-if="active === 'random' && randomResult"><div class="random-view"><small>{{ randomResult.title }}</small><b>{{ randomResult.value }}</b><span>{{ randomResult.detail }}</span><button class="primary-action" @click="randomRoll++">再来一次</button></div></template>
            <template v-else-if="active === 'goal'"><h3 class="card-title">{{ card.label }}</h3><div class="goal-count"><b>{{ goalCurrent ?? card.current }} <small>/ {{ card.target }} {{ card.unit }}</small></b><span>{{ goalPercent }}%</span></div><div class="goal-track"><i :style="{ width: `${goalPercent}%` }" /></div><div class="edit-controls"><span>还差 {{ Math.max(0, card.target - (goalCurrent ?? card.current)) }} {{ card.unit }}</span><span><button :disabled="ghost || (goalCurrent ?? card.current) <= 0" @click="goalCurrent = Math.max(0, (goalCurrent ?? card.current) - 1)">−</button><button :disabled="ghost || (goalCurrent ?? card.current) >= card.target" @click="goalCurrent = Math.min(card.target, (goalCurrent ?? card.current) + 1)">＋</button></span></div></template>
            <template v-else-if="active === 'note'"><div class="note-view">{{ text }}</div><div class="fine-print">这条想法已整理成笔记草稿。</div></template>

            </div>
            <div class="card-actions" aria-live="polite"><span v-if="ghost"><kbd>Tab</kbd> 确认{{ CARDS[active].name }}卡片</span><span v-else><kbd>Esc</kbd> {{ editing !== null ? '取消' : '清空' }}</span><button v-if="!ghost" class="save-button" @click="saveCurrent">{{ editing !== null ? '保存' : '添加' }}{{ CARDS[active].name }} ↵</button></div>
          </article>
        </Transition>
      </div>
      </div>
      <div v-if="!text.trim() && !saved.length" class="input-hint">逐步输入「明天」「明天中午」「明天中午和小王」体验模拟状态。</div>
      <div v-if="!text.trim() && !saved.length" class="palette-hint">按 <button @click="openPalette"><kbd>/</kbd></button> 查看全部 19 种卡片类型。</div>
      <div v-if="text.trim() && !loading && (result?.ok || localFallbackReason) && ui.kind === 'input'" class="uncertain-hint" role="status" aria-live="polite">
        <span>暂时无法确定卡片类型。请补充时间、地点或具体事项，</span><button @click="openPalette">或手动选择类型</button>。
      </div>
      <div v-if="ui.kind === 'choose'" class="choose-options choice-inline"><button v-for="(option, index) in ui.options" :key="option" class="choice-card" :class="{ selected: index === chooseIndex }" @click="chooseIntent(option)">{{ CARDS[option].name }} · {{ pct(intent?.probabilities[option] ?? 0) }}</button></div>
      <div v-if="loading || localFallbackReason" class="source-hint" role="status" aria-live="polite"><span>{{ loading ? '正在读取离线模拟…' : localFallbackReason }}</span><button v-if="localFallbackReason && !loading" class="retry-link" @click="retry">重试请求</button></div>

      <div v-if="saved.length" class="saved-stack"><div v-for="(item, index) in saved" v-show="index !== editing" :key="`${item.text}-${index}`" class="saved-row"><button class="saved-open" @click="reopenSaved(index)"><component :is="PALETTE_ICONS[item.key || allIntents.find(k => CARDS[k].name === item.name) || 'note']" /><span>{{ item.text }}</span></button><button class="saved-delete" aria-label="删除已保存卡片" @click="removeSaved(index)">×</button></div></div>
    </main>

    <div v-if="message" class="toast">{{ message }}</div>
    <div v-if="removed" class="toast">已删除 <button @click="undoRemove">撤销</button></div>

    <Transition name="palette-fade">
      <div v-if="paletteOpen" class="palette-backdrop" @click.self="paletteOpen = false">
        <section class="palette" role="dialog" aria-modal="true" aria-label="选择卡片类型">
          <div class="palette-search-wrap"><Search class="search-icon" aria-hidden="true" /><input ref="paletteInput" v-model="paletteQuery" class="palette-search" placeholder="选择卡片类型…" aria-label="搜索卡片类型" @keydown="onInputKey" /></div>
          <div ref="paletteList" class="palette-list"><button v-for="(key, index) in paletteItems" :key="key" class="palette-option" :class="{ focused: index === paletteIndex }" @mouseenter="paletteIndex = index" @click="chooseIntent(key)"><span class="palette-icon"><component :is="PALETTE_ICONS[key]" aria-hidden="true" /></span><b>{{ CARDS[key].name }}</b><small>{{ EXAMPLE_FOR[key] }}</small></button><p v-if="!paletteItems.length" class="palette-empty">没有找到对应类型。</p></div>
        </section>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.shift-shell { position: relative; height: 492px; display: flex; flex-direction: column; overflow: hidden; background: #f5f4f0; color: #252722; border: 1px solid #e8e6df; border-radius: 15px; font: 13px/1.45 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; box-shadow: 0 12px 35px rgba(25, 28, 22, .08); }
.shift-top { height: 41px; min-height: 41px; display: flex; align-items: center; justify-content: space-between; padding: 0 19px; border-bottom: 1px solid #e9e7e0; }
.brand, .top-controls, .mode-pill, .input-hint, .card-topline, .card-kind, .confidence-line, .saved-strip, .shift-footer { display: flex; align-items: center; }
.brand { gap: 8px; color: #42443e; font-weight: 650; font-size: 12px; letter-spacing: .01em; }
.brand i { color: #96978e; font-size: 10px; font-style: normal; font-weight: 450; margin-left: 4px; }
.brand-mark { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; color: #fff; background: #252722; font: italic 700 14px Georgia, serif; }
.top-controls { gap: 13px; }
.mode-pill { gap: 5px; color: #73766e; font-size: 10px; white-space: nowrap; }
.shift-response-time { position: absolute; top: 12px; right: 16px; z-index: 2; color: #73766e; font-size: 11px; }
.mode-pill small { color: #a0a197; font: 9px ui-monospace, monospace; margin-left: 2px; }
.mode-pill.live { color: #397554; }
.status-dot, .confidence-dot { width: 6px; height: 6px; border-radius: 50%; background: #b8b9b0; }
.mode-pill.live .status-dot { background: #48a66c; }
.shift-main { min-height: 0; flex: 1; overflow-y: auto; padding: 11px 24px 7px; }
.headline { display: flex; align-items: baseline; justify-content: center; gap: 10px; margin: 0 0 8px; text-align: center; }
.headline span { color: #41433d; font-size: 16px; font-weight: 600; letter-spacing: -.035em; }
.headline small { color: #989a91; font-size: 10px; }
.input-wrap { display: flex; align-items: center; gap: 10px; width: min(670px, 100%); height: 44px; margin: 0 auto; padding: 0 12px; background: #fff; border: 1px solid #deded6; border-radius: 10px; box-shadow: 0 2px 7px rgba(28, 31, 26, .035); transition: border-color .2s, box-shadow .2s; }
.input-wrap:focus-within, .input-wrap.has-result { border-color: #a7b9a1; box-shadow: 0 0 0 3px rgba(105, 139, 105, .08); }
.input-spark { color: #74866b; font-size: 18px; line-height: 1; }
.shift-input { min-width: 0; min-height: 44px; height: 100%; box-sizing: border-box; flex: 1; border: 0; outline: 0; background: transparent; color: #30322d; font: inherit; font-size: 13px; line-height: 1.4; }
.shift-input::placeholder { color: #a5a69e; }
.clear-input, .slash-key { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; border: 1px solid #e9e9e3; border-radius: 6px; background: #fafaf8; color: #777970; font: inherit; font-size: 15px; line-height: 1; cursor: pointer; }
.slash-key { color: #a3a49b; font: 12px ui-monospace, monospace; }
.input-hint { justify-content: center; min-height: 20px; gap: 9px; color: #a2a398; font-size: 9px; }
.thinking { color: #71816a; }.thinking i { display: inline-block; width: 6px; height: 6px; margin: 0 4px 1px 0; border-radius: 50%; background: #84997a; animation: pulse 1s infinite alternate; }
.retry-link, .type-link { padding: 0; color: #78866f; background: transparent; border: 0; font: inherit; cursor: pointer; }
.type-link { margin-left: 5px; }.type-link kbd, kbd { border: 1px solid #e3e3dc; border-radius: 4px; padding: 1px 4px; color: #898b82; background: #fbfbf9; font: 9px ui-monospace, monospace; }
.fallback-hint { color: #9a7050; }
.examples { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; width: min(760px, 100%); margin: 3px auto 9px; }
.example-chip, .all-examples { min-height: 32px; max-width: 100%; border: 1px solid #e5e4dd; border-radius: 999px; padding: 3px 8px; background: #f9f8f5; color: #777a71; font: inherit; font-size: 9px; line-height: 1.3; cursor: pointer; transition: background .15s, border .15s, color .15s; white-space: nowrap; }
.example-chip:hover, .example-chip.selected { background: #fff; border-color: #bdc9b6; color: #4d6047; }
.all-examples { color: #798470; }.all-examples span { font-size: 12px; vertical-align: -1px; }
.result-stage { width: min(670px, 100%); min-height: 194px; margin: 0 auto; }
.result-card, .empty-result { position: relative; box-sizing: border-box; width: 100%; min-height: 166px; border: 1px solid #e3e3dc; border-radius: 12px; background: rgba(255, 255, 255, .86); box-shadow: 0 4px 14px rgba(34, 36, 30, .045); padding: 13px 17px 10px; }
.result-card.ghost { opacity: .65; border-style: dashed; }
.card-topline { justify-content: space-between; gap: 10px; margin-bottom: 9px; }
.card-kind { gap: 8px; min-width: 0; }.kind-icon { display: grid; place-items: center; width: 31px; height: 31px; border-radius: 9px; background: #f1f2ed; font-size: 17px; }
.card-kind small { display: block; color: #9b9d94; font-size: 8px; line-height: 1.1; }.card-kind h2 { margin: 2px 0 0; color: #383a34; font-size: 12px; line-height: 1.2; font-weight: 650; }
.save-button, .primary-action, .secondary-action, .soft-action { border-radius: 7px; cursor: pointer; font-family: inherit; }
.save-button { margin-left: auto; border: 1px solid #dce2d8; background: #f8faf6; padding: 4px 8px; color: #5e7355; font-size: 9px; white-space: nowrap; }.save-button kbd { margin-left: 5px; }
.urgent-badge { color: #9a654f; background: #fbf1eb; padding: 3px 7px; border-radius: 999px; font-size: 8px; }
.ghost-note { color: #96784a; background: #fbf8ef; border-radius: 5px; padding: 3px 7px; margin: -4px 0 6px; font-size: 9px; }
.card-title { margin: 2px 0 8px; color: #383a34; font-size: 15px; line-height: 1.35; font-weight: 620; overflow-wrap: anywhere; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }.detail-grid.two { grid-template-columns: 1fr 1fr; }.detail-grid.three { grid-template-columns: repeat(3, 1fr); gap: 5px; }
.detail-grid > div { min-width: 0; display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid #f0f0eb; padding: 3px 0; }
.detail-grid small, .timezone-compare small { color: #a0a198; font-size: 8px; }.detail-grid b { color: #51534c; font-size: 10px; font-weight: 560; overflow-wrap: anywhere; }.color-dot { display: inline-block; width: 8px; height: 8px; margin-right: 4px; border-radius: 2px; }
.soft-action { margin-top: 7px; padding: 4px 8px; background: #f7f8f4; border: 1px solid #e5e8e0; color: #63755c; font-size: 9px; }
.list-head { display: flex; justify-content: space-between; margin: 6px 0 5px; color: #5d6058; font-size: 10px; }.list-head small { color: #a0a198; font-size: 8px; }
.task-row { display: flex; align-items: center; gap: 7px; padding: 3px 0; color: #565850; font-size: 10px; cursor: pointer; }.task-row input, .travel-checks input { width: 12px; height: 12px; accent-color: #7c9871; margin: 0; }.task-row.complete span { color: #a5a79d; text-decoration: line-through; }
.timer-view, .random-view { display: flex; flex-direction: column; align-items: center; color: #989a91; font-size: 9px; }.timer-time { color: #414a3e; font: 36px/1.2 ui-monospace, monospace; letter-spacing: -.06em; }.action-row { display: flex; gap: 6px; margin-top: 9px; }
.primary-action, .secondary-action { padding: 5px 13px; font-size: 9px; }.primary-action { color: #fff; background: #74866b; border: 1px solid #74866b; }.secondary-action { color: #74776d; background: #fff; border: 1px solid #e3e4dc; }
.habit-days { display: flex; gap: 6px; margin: 5px 0 2px; }.habit-days button { width: 24px; height: 24px; border-radius: 50%; border: 1px solid #e5e6df; background: #fff; color: #888a82; font: inherit; font-size: 9px; cursor: pointer; }.habit-days button.checked { background: #829777; border-color: #829777; color: #fff; }
.color-swatch { display: flex; justify-content: space-between; align-items: flex-end; height: 55px; padding: 8px 10px; margin-bottom: 5px; border-radius: 8px; }.color-swatch b { font: 15px ui-monospace, monospace; }.color-swatch span { font-size: 8px; opacity: .75; }
.money-hero, .conversion, .calculation { color: #41483d; font-size: 22px; font-weight: 650; margin: 2px 0 7px; }.money-hero small { display: block; color: #a0a198; font-size: 8px; font-weight: 450; }.fine-print { margin: 5px 0 0; color: #a0a198; font-size: 8px; line-height: 1.5; }.conversion { font-size: 16px; }.conversion span { color: #a2a49a; padding: 0 4px; }.calculation small { display: block; color: #a0a198; font-size: 9px; font-weight: 450; }.calculation b { display: block; margin-top: 4px; font-size: 23px; }
.travel-checks { display: flex; gap: 12px; margin-top: 6px; color: #777a71; font-size: 8px; }.travel-checks label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.poll-option { position: relative; display: flex; align-items: center; justify-content: space-between; width: 100%; overflow: hidden; margin: 4px 0; padding: 6px 9px; border: 1px solid #e8e8e1; border-radius: 7px; background: #fff; color: #5c5e56; font: inherit; font-size: 9px; cursor: pointer; }.poll-fill { position: absolute; inset: 0 auto 0 0; background: #eff2eb; transition: width .2s; }.poll-option b, .poll-option small { position: relative; font-weight: 500; }.poll-option small { color: #999b92; }
.saved-link { display: inline-flex; max-width: 100%; gap: 5px; color: #75876d; overflow-wrap: anywhere; font-size: 10px; text-decoration: underline; text-underline-offset: 3px; }.saved-link span { flex: none; }
.countdown-hero { display: flex; align-items: baseline; justify-content: center; gap: 6px; padding: 0 0 7px; color: #4f6048; }.countdown-hero b { font: 39px/1 ui-monospace, monospace; }.countdown-hero span { font-size: 11px; }
.timezone-compare { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; margin: 12px 0 5px; }.timezone-compare div { display: flex; flex-direction: column; gap: 4px; }.timezone-compare div:last-child { text-align: right; }.timezone-compare b { color: #485342; font: 20px ui-monospace, monospace; }.timezone-compare > span { color: #adb2a5; }
.random-view { gap: 3px; }.random-view b { color: #4d5f44; font-size: 25px; margin: 2px 0; }.random-view > span { max-width: 100%; overflow-wrap: anywhere; }
.goal-count { display: flex; justify-content: space-between; align-items: baseline; color: #505e49; }.goal-count b { font-size: 17px; }.goal-count small { color: #95988e; font-size: 9px; font-weight: 450; }.goal-count > span { color: #849579; font-size: 11px; }.goal-track { height: 5px; overflow: hidden; margin: 7px 0; border-radius: 999px; background: #eff0eb; }.goal-track i { display: block; height: 100%; border-radius: inherit; background: #85997a; transition: width .25s; }
.note-view { padding: 8px 0; color: #53564f; font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }.empty-card { padding: 12px 0; color: #a0a198; font-size: 10px; }
.confidence-line { gap: 6px; margin-top: 9px; padding-top: 7px; border-top: 1px solid #f0f0eb; color: #92948b; font-size: 8px; }.confidence-spacer { flex: 1; }.confidence-line .idle { background: #c1b48a; }.confidence-line .ghost { background: #c1a46d; }.confidence-line .choose { background: #928aab; }.confidence-line .ready { background: #7e9a72; }
.empty-result { display: flex; min-height: 154px; flex-direction: column; align-items: center; justify-content: center; color: #94968d; background: rgba(255,255,255,.45); border-style: dashed; box-shadow: none; }.empty-spark { color: #a7b29f; font-size: 22px; margin-bottom: 5px; }.empty-result b { color: #73766d; font-size: 11px; font-weight: 550; }.empty-result small { margin-top: 4px; text-align: center; font-size: 8px; }
.choose-card h2 { margin: 2px 0; color: #484a43; font-size: 14px; }.card-kicker { color: #8c8f83; font-size: 9px; }.card-kicker span { color: #b3a67e; }.card-subtitle { margin: 3px 0 10px; color: #a0a198; font-size: 9px; }.choose-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }.choice-card { position: relative; display: flex; align-items: center; gap: 7px; padding: 9px; border: 1px solid #e4e6dd; border-radius: 8px; background: #fbfcf9; color: #55594f; font: inherit; font-size: 10px; cursor: pointer; text-align: left; }.choice-card.selected { border-color: #b7c5aa; background: #f3f6ef; }.choice-icon { font-size: 16px; }.choice-card small { margin-left: auto; color: #9b9e93; font-size: 8px; }.choice-card b { color: #93a18a; font-weight: 500; }
.decision-details { width: min(670px, 100%); margin: -2px auto 5px; color: #93958c; font-size: 8px; }.decision-details summary { cursor: pointer; list-style: none; text-align: center; }.decision-details summary::-webkit-details-marker { display: none; }.decision-details summary span { margin-left: 5px; color: #78866f; }.decision-body { padding: 6px 12px; }.prob-row { display: grid; grid-template-columns: 65px 1fr 28px; align-items: center; gap: 7px; margin: 4px 0; }.prob-row > span { color: #777a71; }.prob-row > i { display: block; height: 4px; overflow: hidden; border-radius: 5px; background: #e9eae4; }.prob-row > i b { display: block; height: 100%; background: #9aa992; }.prob-row > small { text-align: right; }.decision-body p { margin: 5px 0 0; color: #a0a198; line-height: 1.45; }
.saved-strip { justify-content: center; flex-wrap: wrap; gap: 5px; margin: 4px auto 0; }.saved-strip > span { color: #a0a198; font-size: 8px; }.saved-item { border: 1px solid #e8e8e1; border-radius: 999px; padding: 3px 7px; background: #fbfbf8; color: #777970; font: inherit; font-size: 8px; cursor: pointer; }
.shift-footer { justify-content: space-between; min-height: 22px; padding: 0 19px; border-top: 1px solid #e9e7e0; color: #a0a198; font-size: 8px; }.shift-footer kbd { padding: 1px 4px; }
.toast { position: absolute; right: 14px; bottom: 31px; border-radius: 7px; padding: 6px 10px; color: #fff; background: #596a52; box-shadow: 0 4px 12px #0002; font-size: 9px; }
.palette-backdrop { position: absolute; z-index: 20; inset: 0; display: grid; place-items: center; padding: 15px; background: rgba(41, 43, 37, .22); backdrop-filter: blur(3px); }.palette { box-sizing: border-box; width: min(400px, 100%); max-height: 90%; overflow: hidden; border: 1px solid #e6e6df; border-radius: 12px; background: #fff; box-shadow: 0 20px 55px rgba(28, 30, 24, .18); }.palette > header, .palette > footer { display: flex; justify-content: space-between; padding: 10px 12px; color: #74776e; font-size: 9px; }.palette > header { border-bottom: 1px solid #efefe9; }.palette > header button { border: 0; background: transparent; color: #999b92; font: inherit; font-size: 9px; cursor: pointer; }.palette-search { box-sizing: border-box; width: calc(100% - 18px); margin: 9px; border: 1px solid #e7e8e0; border-radius: 7px; outline: 0; padding: 7px 9px; color: #4c4f47; background: #fbfbf8; font: inherit; font-size: 10px; }.palette-list { max-height: 270px; overflow-y: auto; padding: 0 7px; }.palette-option { display: flex; align-items: center; gap: 8px; width: 100%; border: 0; border-radius: 6px; padding: 6px 8px; background: transparent; color: #5e6058; font: inherit; font-size: 10px; text-align: left; cursor: pointer; }.palette-option.focused, .palette-option:hover { background: #f2f4ef; }.palette-option > span { width: 19px; font-size: 13px; }.palette-option > small { margin-left: auto; color: #a4a69d; font: 8px ui-monospace, monospace; }.palette-option > kbd { min-width: 10px; text-align: center; }.palette-empty { padding: 10px; color: #a0a198; text-align: center; font-size: 9px; }.palette > footer { border-top: 1px solid #efefe9; color: #a0a198; }.palette > footer span { display: flex; align-items: center; gap: 3px; }
.card-morph-enter-active, .card-morph-leave-active { transition: opacity .18s ease, transform .24s cubic-bezier(.2,.85,.35,1), filter .2s; }.card-morph-enter-from { opacity: 0; transform: scale(.97) translateY(7px); filter: blur(3px); }.card-morph-leave-to { opacity: 0; transform: scale(1.015); filter: blur(2px); }.palette-fade-enter-active, .palette-fade-leave-active { transition: opacity .16s; }.palette-fade-enter-from, .palette-fade-leave-to { opacity: 0; }
@keyframes pulse { to { opacity: .3; transform: scale(.7); } }

@media (max-width: 760px) {
  .shift-shell { height: 510px; border-radius: 10px; }.shift-top { padding: 0 10px; }.top-controls { gap: 7px; }.mode-pill { font-size: 8px; }.mode-pill small { display: none; }
  .shift-main { padding: 11px 10px 7px; }.headline { flex-direction: column; align-items: center; gap: 1px; margin-bottom: 7px; }.headline span { font-size: 14px; }.headline small { font-size: 8px; }
  .examples { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; padding-bottom: 3px; scrollbar-width: thin; }.example-chip { flex: 0 0 auto; }.result-stage { min-height: 196px; }.result-card { padding: 11px 12px 9px; }.detail-grid { gap: 5px 11px; }.detail-grid.three { grid-template-columns: 1fr 1fr; }.decision-details { margin-top: 2px; }
  .shift-footer { padding: 0 9px; font-size: 7px; }.shift-footer span:nth-child(2) { max-width: 48%; text-align: center; }
}
@media (max-width: 430px) {
  .shift-shell { height: 540px; }.brand { font-size: 10px; }.brand i { display: none; }.shift-main { padding-right: 8px; padding-left: 8px; }.headline span { font-size: 13px; }.input-wrap { height: 40px; gap: 7px; padding: 0 8px; }.shift-input { font-size: 11px; }.examples { margin-bottom: 7px; }.example-chip { font-size: 8px; }.result-stage { min-height: 206px; }.result-card { padding: 9px 10px 8px; }.detail-grid, .detail-grid.two { grid-template-columns: 1fr; gap: 2px; }.detail-grid.three { grid-template-columns: 1fr 1fr; }.detail-grid > div { flex-direction: row; justify-content: space-between; gap: 6px; }.detail-grid b { text-align: right; }.choose-options { grid-template-columns: 1fr; gap: 5px; }.choice-card { padding: 6px 8px; }.timezone-compare { gap: 5px; }.timezone-compare b { font-size: 15px; }.confidence-line { flex-wrap: wrap; }.shift-footer span:nth-child(2) { display: none; }.saved-strip { justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; }
}
@media (max-width: 1024px) {
  .shift-shell { height: 560px; border-radius: 12px; font-size: 14px; }
  .shift-top { height: 49px; min-height: 49px; padding: 0 15px; }
  .brand { font-size: 14px; }.brand-mark { width: 23px; height: 23px; font-size: 16px; }.brand i { font-size: 11px; }
  .top-controls { gap: 10px; }.mode-pill { font-size: 11px; }
  .shift-main { padding: 14px 18px 10px; }
  .headline { gap: 7px; margin-bottom: 11px; }.headline span { font-size: 20px; }.headline small { font-size: 12px; }
  .input-wrap { height: 52px; gap: 10px; padding: 0 13px; }.shift-input { font-size: 15px; }.input-hint { min-height: 26px; font-size: 11px; }
  .examples { flex-wrap: wrap; justify-content: flex-start; overflow: visible; gap: 6px; margin-bottom: 10px; }.example-chip, .all-examples { white-space: normal; padding: 5px 9px; font-size: 10px; }
  .result-stage { min-height: 224px; }.result-card, .empty-result { min-height: 194px; padding: 15px 17px 12px; }
  .card-kind small { font-size: 10px; }.card-kind h2 { font-size: 16px; }.kind-icon { width: 36px; height: 36px; font-size: 20px; }
  .card-title { font-size: 18px; }.detail-grid { gap: 7px 15px; }.detail-grid small, .timezone-compare small { font-size: 10px; }.detail-grid b { font-size: 13px; }
  .task-row, .poll-option, .travel-checks, .saved-link { font-size: 12px; }.task-row { min-height: 31px; }.task-row input, .travel-checks input { width: 16px; height: 16px; }
  .save-button, .primary-action, .secondary-action, .soft-action { min-height: 34px; padding: 7px 11px; font-size: 11px; }.habit-days button { width: 31px; height: 31px; font-size: 11px; }.travel-checks { flex-wrap: wrap; gap: 10px; }
  .empty-card, .fine-print, .money-hero small, .calculation small { font-size: 10px; }.conversion { font-size: 19px; }.goal-count small { font-size: 11px; }
  .confidence-line { font-size: 10px; }.empty-result b { font-size: 14px; }.empty-result small { font-size: 11px; }
  .decision-details { font-size: 10px; }.prob-row { grid-template-columns: 85px 1fr 36px; gap: 8px; }.prob-row > i { height: 6px; }.decision-body p { font-size: 11px; }
  .choose-card h2 { font-size: 18px; }.card-kicker, .card-subtitle { font-size: 11px; }.choice-card { min-height: 42px; padding: 9px 11px; font-size: 12px; }.choice-icon { font-size: 19px; }.choice-card small { font-size: 10px; }
  .palette > header, .palette > footer { padding: 13px 14px; font-size: 12px; }.palette > header button, .palette-option { font-size: 13px; }.palette-search { padding: 10px; font-size: 14px; }.palette-list { max-height: min(52vh, 420px); }.palette-option { min-height: 40px; padding: 9px 10px; }.palette-option > small { font-size: 10px; }.palette-empty { font-size: 12px; }
  .saved-strip > span, .saved-item { font-size: 10px; }.shift-footer { min-height: 31px; padding: 0 12px; font-size: 10px; }
}
@media (max-width: 430px) {
  .shift-shell { height: 590px; }.brand { font-size: 12px; }.brand i { display: none; }.top-controls { gap: 7px; }
  .mode-pill { font-size: 10px; }.shift-main { padding: 12px 10px 9px; }.headline { flex-direction: column; align-items: center; gap: 2px; }.headline span { font-size: 18px; }.headline small { font-size: 10px; }
  .input-wrap { height: 48px; gap: 7px; padding: 0 9px; }.shift-input { font-size: 14px; }.clear-input, .slash-key { width: 32px; height: 32px; font-size: 18px; }.examples { flex-wrap: wrap; overflow: visible; }.example-chip, .all-examples { font-size: 10px; padding: 6px 8px; }
  .result-stage { min-height: 228px; }.result-card, .empty-result { padding: 12px 12px 10px; }.detail-grid, .detail-grid.two { grid-template-columns: 1fr; gap: 4px; }.detail-grid.three { grid-template-columns: 1fr 1fr; }.detail-grid > div { flex-direction: row; justify-content: space-between; gap: 6px; }.detail-grid b { text-align: right; }.choose-options { grid-template-columns: 1fr; gap: 6px; }.choice-card { min-height: 40px; padding: 7px 9px; }.timezone-compare { gap: 5px; }.timezone-compare b { font-size: 15px; }.confidence-line { flex-wrap: wrap; }.shift-footer span:nth-child(2) { display: none; }.saved-strip { justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; }
}
/* 初始画面只呈现输入框；结果出现后沿同一中轴展开。 */
.shift-shell { width: 100%; height: 630px; flex: none; border: 0; border-radius: 0; box-shadow: none; background: #fafaf9; }
.shift-main { padding: 139px 20px 24px; }
.input-wrap { box-sizing: border-box; width: min(375px, 100%); height: 49px; padding: 0 14px; border: 1px solid #e8e7e4; border-radius: 19px; box-shadow: 0 1px 2px #1a1a190a; }
.input-wrap:focus-within, .input-wrap.has-result { border-color: #d6d6d6; box-shadow: 0 1px 3px #00000012; }
.shift-input { min-height: 0; font-size: 16px; }
.shift-input::placeholder { color: #777; opacity: 1; }
.clear-input { border: 0; background: transparent; color: #999; }
.input-hint { min-height: 19px; margin-top: 5px; color: #666; font-size: 10px; text-align: center; }
.palette-hint { color: #666; font-size: 10px; text-align: center; }
.uncertain-hint { width: min(375px, 100%); margin: 8px auto 0; color: #706e68; font-size: 10px; line-height: 1.6; text-align: center; }
.uncertain-hint button { padding: 0; border: 0; background: none; color: #3b5bdb; font: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.uncertain-hint button:focus-visible { outline: 2px solid #3b5bdb; outline-offset: 3px; border-radius: 2px; }
.palette-hint button { border: 0; padding: 0 3px; background: transparent; cursor: pointer; }
.palette-hint kbd { font-size: 10px; }
.result-stage { width: min(400px, 100%); min-height: 0; margin: 14px auto 0; }
.decision-details { width: min(400px, 100%); margin: 8px auto; }
.palette-backdrop { display: block; padding: 0; background: rgba(0, 0, 0, .06); backdrop-filter: none; }
.palette { position: absolute; top: 210px; left: 50%; transform: translateX(-50%); width: min(321px, calc(100% - 40px)); max-height: 313px; padding: 6px; border: 1px solid #e8e7e4; border-radius: 14px; box-shadow: 0 2px 4px #1a1a190a, 0 13px 32px -8px #1a1a1924; }
.palette-search-wrap { display: flex; align-items: center; height: 22px; padding: 0 7px; border-radius: 12px; background: #f4f4f2; color: #a4a39e; }
.search-icon { width: 12px; height: 12px; flex: none; stroke-width: 1.75; }
.palette-search { width: 100%; margin: 0; padding: 0 4px; border: 0; border-radius: 0; background: transparent; font-size: 10px; }
.palette-list { max-height: 280px; padding: 3px 0 0; overflow-y: auto; scrollbar-width: none; overscroll-behavior: contain; }
.palette-list::-webkit-scrollbar { display: none; }
.palette-option { min-height: 32px; gap: 8px; padding: 4px 5px; border-radius: 11px; color: #1a1a19; font-size: 9.4px; }
.palette-option.focused, .palette-option:hover { background: #f4f4f2; }
.palette-option .palette-icon { display: grid; place-items: center; flex: 0 0 22px; width: 22px; height: 22px; border-radius: 6px; background: #f4f4f2; }
.palette-icon svg { width: 12px; height: 12px; stroke-width: 1.75; }
.palette-option b { flex: 0 0 54px; color: #1a1a19 !important; font-weight: 500; }
.palette-option > small { min-width: 0; margin: 0; overflow: hidden; color: #706e68; font: inherit; font-size: 8.7px; text-overflow: ellipsis; white-space: nowrap; }
.morph-shell { box-sizing: border-box; width: min(375px, 100%); margin: 0 auto; overflow: hidden; border: 1px solid #e8e7e4; border-radius: 19px; background: white; box-shadow: 0 1px 2px #1a1a190a; transition: border-color .2s, box-shadow .2s; }
.morph-shell:focus-within, .morph-shell.expanded { border-color: #526aff; box-shadow: 0 0 0 3px #eef1fd; }
.morph-shell .input-wrap, .morph-shell .input-wrap:focus-within, .morph-shell .input-wrap.has-result { width: 100%; border: 0; border-radius: 0; box-shadow: none; background: transparent; }
.result-stage { width: 100%; margin: 0; }
.result-card { min-height: 0; padding: 3px 14px 14px; border: 0; border-radius: 0; box-shadow: none; background: transparent; }
.result-card.ghost { opacity: .55; }
.result-card.ghost button, .result-card.ghost input, .result-card.ghost select { pointer-events: none; }
.card-topline { min-height: 29px; margin: 0 0 12px; }
.card-kind { gap: 8px; }.kind-icon { width: 30px; height: 30px; border-radius: 8px; background: #f4f4f2; color: #1a1a19; }.kind-icon svg { width: 16px; height: 16px; stroke-width: 1.75; }
.slidev-layout .card-kind h2 { margin: 0; color: #57564f; font-size: 10px; font-weight: 500; }
.slidev-layout .card-title { margin: 0 0 10px; color: #1a1a19; font-size: 12px; font-weight: 600; }
.card-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 23px; margin-top: 14px; color: #706e68; font-size: 9px; }
.card-actions kbd { font-size: 8px; background: #f4f4f2; border: 0; }
.save-button { min-height: 22px; padding: 4px 10px; border: 0; border-radius: 999px; color: #fff; background: #1a1a19; font-size: 9px; }
.event-fields { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: #57564f; font-size: 10px; }
.event-chip { position: relative; display: inline-flex; align-items: center; min-height: 20px; padding: 3px 7px; border-radius: 999px; background: #f4f4f2; color: #57564f; font-size: 9px; }
.event-chip svg, .event-line svg { width: 12px; height: 12px; margin-right: 3px; stroke-width: 1.75; color: #706e68; }
.event-chip input[type=date] { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }.event-line { display: flex; align-items: center; gap: 6px; width: 100%; }
.missing-chip { padding: 3px 7px; border: 1px dashed #d6d4cf; border-radius: 999px; background: transparent; color: #706e68; font: inherit; font-size: 9px; cursor: pointer; }
.reminder-body, .edit-controls, .color-preview { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.reminder-body .card-title { margin: 0; }.edit-controls { color: #706e68; font-size: 9px; }.edit-controls input, .edit-controls select, .conversion select { max-width: 85px; border: 0; border-radius: 7px; padding: 4px; background: #f4f4f2; color: #57564f; font: inherit; }.edit-controls button, .conversion button { border: 0; border-radius: 6px; padding: 4px 6px; background: #f4f4f2; color: #57564f; cursor: pointer; }
.color-preview { justify-content: flex-start; }.color-preview div { width: 44px; height: 44px; border-radius: 8px; }.slidev-layout .color-preview b { color: #1a1a19; }.shade-list { display: flex; gap: 4px; margin: 10px 0; }.shade-list button { width: 27px; height: 27px; border: 0; border-radius: 5px; cursor: pointer; }.slider-label { display: flex; align-items: center; gap: 8px; color: #706e68; font-size: 9px; }.slider-label input { width: 140px; accent-color: #1a1a19; }
.choice-inline { width: min(375px, 100%); margin: 8px auto; }.source-hint { width: min(375px, 100%); margin: 6px auto; text-align: right; color: #706e68; font-size: 8px; }.source-hint button { margin-left: 5px; }
.saved-stack { width: min(375px, 100%); margin: 8px auto; display: grid; gap: 5px; }.saved-row { display: flex; align-items: center; border: 1px solid #e8e7e4; border-radius: 12px; background: #fff; }.saved-open { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; padding: 9px; border: 0; background: transparent; color: #57564f; text-align: left; cursor: pointer; }.saved-open svg { width: 16px; height: 16px; flex: none; }.saved-open span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.saved-delete { border: 0; padding: 8px 12px; background: transparent; color: #888; cursor: pointer; }.toast button { margin-left: 8px; color: white; text-decoration: underline; }
.primary-action { border-color: #1a1a19; background: #1a1a19; }.secondary-action, .soft-action { border-color: #e8e7e4; color: #57564f; background: #f4f4f2; }.habit-days button.checked { color: #fff; border-color: #1a1a19; background: #1a1a19; }.task-row input { accent-color: #1a1a19; }.goal-track { background: #f4f4f2; }.goal-track i { background: #1a1a19; }.money-hero, .conversion, .calculation, .timer-time, .random-view b, .goal-count, .timezone-compare b { color: #1a1a19; }.detail-grid b { color: #57564f !important; }
</style>
