// 第 25 页输入框演示用的浏览器内离线模拟：本地规则判断意图，按 Jev 的返回格式包装结果，不调用网络。
import { shiftQuestions } from './shift.ts'
import { classifyShift } from './shiftMock.ts'

export interface JevResult { ok: boolean; mode?: 'mock'; ms?: number; error?: string; data?: any; wall?: number }

const canonical = (value: any): string => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item)

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

export async function callJev(state: string, questions: Record<string, any>, signal?: AbortSignal): Promise<JevResult> {
  if (signal?.aborted) return { ok: false, mode: 'mock', error: '操作已取消' }
  if (canonical(questions) !== canonical(shiftQuestions)) return { ok: false, mode: 'mock', error: '离线模拟只支持输入框演示的题目。' }
  const classified = classifyShift(state)
  const answers: Record<string, any> = Object.fromEntries(Object.entries(questions).map(([key, question]) => [key, answer(question, classified.values[key])]))
  answers.intent = classified.intent
  return { ok: true, mode: 'mock', data: { model: 'offline-rules', answers }, ms: 0, wall: 0 }
}

export const pct = (x: number) => `${Math.round(x * 100)}%`
