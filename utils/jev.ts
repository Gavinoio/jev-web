import { batchQuestions, batchSamples, moderateExamples, moderateQuestions, scenarios, demoTicketExamples } from './scenarios.ts'
import { boxImages, typeTabs } from './typeDemos.ts'
import { shiftExamples, shiftQuestions } from './shift.ts'

export type Mode = 'mock'
export interface JevResult { ok: boolean; mode?: Mode; ms?: number; error?: string; data?: any; wall?: number }

const canonical = (value: any): string => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item)
const normalizeState = (state: string) => {
  try { return canonical(JSON.parse(state)) } catch { return state }
}

function answer(question: any, value: boolean | string | number, confidence = 0.95) {
  if (question.type === 'noul') return { type: 'noul', noul: typeof value === 'boolean' ? (value ? 0.95 : 0.05) : value }
  if (question.type === 'choice') {
    const keys = Object.keys(question.criteria)
    const probabilities = Object.fromEntries(keys.map((key) => [key, keys.length === 1 ? 1 : key === value ? confidence : (1 - confidence) / (keys.length - 1)]))
    return { type: 'choice', choice: value, confidence: keys.length === 1 ? 1 : confidence, probabilities }
  }
  const levels: string[] = question.criteria
  const index = Math.max(0, Math.min(levels.length - 1, Math.round(Number(value))))
  const scoreConfidence = levels.length === 1 ? 1 : confidence
  return { type: 'score', score: Number(value), confidence: scoreConfidence, legend: Object.fromEntries(levels.map((level, i) => [i, level])), probabilities: Object.fromEntries(levels.map((_, i) => [i, i === index ? scoreConfidence : (1 - scoreConfidence) / (levels.length - 1)])) }
}

const fixtures: { state: string; questions: Record<string, any>; values: Record<string, boolean | string | number>; confidence?: number }[] = []
for (const tab of typeTabs) for (const example of tab.examples) if (example.expected) fixtures.push({ state: example.state, questions: tab.questions, values: example.expected as Record<string, boolean | string | number> })
for (const scenario of scenarios) for (const example of scenario.examples) {
  let values = example.expected as Record<string, boolean | string | number> | undefined
  if (scenario.id === 'ticket' && example.label === demoTicketExamples.ambiguous.label) values = { is_urgent: false, department: 'sales', frustration: 1 }
  if (scenario.id === 'ticket' && example.label === '帮我看看这个') values = { is_urgent: false, department: 'technical', frustration: 0 }
  if (scenario.id === 'refund' && example.label === '含糊') values = { request_type: 'other', wants_refund: false }
  if (scenario.id === 'vip' && values) values = { churn_risk: example.label.includes('很生气') ? 2 : 0, ...values }
  if (values) fixtures.push({ state: example.state, questions: scenario.questions, values, confidence: example.expected ? 0.95 : 0.5 })
}
for (const example of moderateExamples) fixtures.push({ state: example.state, questions: moderateQuestions, values: example.expected as Record<string, boolean | string | number> || { harassment: 0.45, scam: 0.1, action: 'allow' }, confidence: example.expected ? 0.95 : 0.5 })
for (const sample of batchSamples(100)) fixtures.push({ state: sample.text, questions: batchQuestions, values: { category: sample.expected } })

const shiftIntents = ['event', 'event', 'reminder', 'todo', 'timer', 'habit', 'color', 'split', 'expense', 'convert', 'calc', 'travel', 'poll', 'contact', 'link', 'countdown', 'timezone', 'random', 'goal', 'note', 'none']
for (const [index, state] of shiftExamples.entries()) {
  const values: Record<string, boolean | string | number> = { intent: shiftIntents[index], readiness: 2, isQuestion: /[？?]|多少|几天|几点/.test(state), recurring: index === 5, urgency: index === 2 ? 2 : 0, tone: 'neutral', eventMode: index === 1 ? 'video_call' : index === 0 ? 'in_person' : 'unspecified', transport: index === 11 ? 'train' : 'unspecified', tripType: index === 11 ? 'leisure' : 'unspecified', expenseCategory: index === 8 ? 'transport' : 'other', colorMood: 'cool', timerKind: index === 4 ? 'focus' : 'unspecified', hasExplicitOptions: index === 12, isShoppingList: index === 3 }
  fixtures.push({ state, questions: shiftQuestions, values })
}

function cancelled(signal?: AbortSignal): JevResult | undefined {
  return signal?.aborted ? { ok: false, mode: 'mock', error: '操作已取消' } : undefined
}

export async function callJev(state: string, questions: Record<string, any>, signal?: AbortSignal): Promise<JevResult> {
  const aborted = cancelled(signal)
  if (aborted) return aborted
  const shiftStages: Record<string, { choice: string; probabilities: Record<string, number> }> = {
    '明天': { choice: 'none', probabilities: { none: 0.8, event: 0.1, reminder: 0.1 } },
    '明天中午': { choice: 'event', probabilities: { event: 0.45, reminder: 0.4, none: 0.15 } },
    '明天中午和小王': { choice: 'event', probabilities: { event: 0.6, reminder: 0.2, none: 0.2 } },
  }
  const stage = canonical(questions) === canonical(shiftQuestions) ? shiftStages[state] : undefined
  const fixture = fixtures.find((item) => normalizeState(item.state) === normalizeState(stage ? shiftExamples[0] : state) && canonical(item.questions) === canonical(questions))
  if (!fixture) return { ok: false, mode: 'mock', error: '离线模拟仅支持预设材料和原始题目；自定义内容无法判断。' }
  const answers = Object.fromEntries(Object.entries(questions).map(([key, question]) => [key, answer(question, fixture.values[key], fixture.confidence)]))
  if (stage) answers.intent = { type: 'choice', choice: stage.choice, confidence: stage.probabilities[stage.choice], probabilities: Object.fromEntries(Object.keys(shiftQuestions.intent.criteria).map((key) => [key, stage.probabilities[key] ?? 0])) }
  return { ok: true, mode: 'mock', data: { model: 'offline-mock', answers }, ms: 0, wall: 0 }
}

const boxes = [
  { left: 0.301, top: 0.127, right: 0.566, bottom: 0.197 },
  { left: 0.275, top: 0.528, right: 0.399, bottom: 0.644 },
  { left: 0.045, top: 0.305, right: 0.224, bottom: 0.88 },
]
export async function callBox(image: string, target: string, signal?: AbortSignal): Promise<JevResult> {
  const aborted = cancelled(signal)
  if (aborted) return aborted
  const index = image === 'agent.jpg' ? boxImages[0].targets.findIndex((item) => item.target === target) : -1
  if (index < 0) return { ok: false, mode: 'mock', error: '离线模拟仅支持预设图片和目标；无法定位自定义目标。' }
  return { ok: true, mode: 'mock', ms: 0, wall: 0, data: { model: 'offline-mock', answers: { visible: { type: 'noul', noul: 0.95 }, target: { type: 'box', box: { ...boxes[index] }, confidence: 0.95 } } } }
}

export function estTokens(s: string) {
  const cjk = (s.match(/[一-鿿]/g) || []).length
  return Math.round(cjk + (s.length - cjk) / 4)
}
export const estCost = (tokens: number) => (tokens * 0.042) / 1e6
export const MODE_LABEL: Record<string, string> = { mock: '离线模拟' }
export const pct = (x: number) => `${Math.round(x * 100)}%`
