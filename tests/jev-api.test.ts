import test from 'node:test'
import assert from 'node:assert/strict'
import { callJev } from '../utils/jev.ts'
import { shiftExamples, shiftQuestions, initialMemory, decide, force, promote } from '../utils/shift.ts'

test('input-box presets return deterministic mock answers in the expected shape without network', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('unexpected network request') }
  try {
    for (const state of shiftExamples) {
      const result = await callJev(state, shiftQuestions)
      assert.equal(result.ok, true, state)
      assert.equal(result.mode, 'mock')
      assert.deepEqual(result, await callJev(state, shiftQuestions))
      for (const [key, question] of Object.entries<any>(shiftQuestions)) {
        const answer = result.data.answers[key]
        assert.equal(answer.type, question.type, key)
        if (question.type === 'noul') assert.ok(answer.noul >= 0 && answer.noul <= 1, key)
        if (question.type === 'choice') {
          assert.ok(Object.hasOwn(question.criteria, answer.choice), key)
          assert.ok(Math.abs(Object.values<number>(answer.probabilities).reduce((sum, value) => sum + value, 0) - 1) < 1e-9, key)
        }
        if (question.type === 'score') {
          assert.ok(answer.score >= 0 && answer.score < question.criteria.length, key)
          assert.ok(Math.abs(Object.values<number>(answer.probabilities).reduce((sum, value) => sum + value, 0) - 1) < 1e-9, key)
        }
      }
    }
  } finally { globalThis.fetch = originalFetch }
})

test('other questions and cancelled calls fail honestly', async () => {
  const other = await callJev('自定义内容', { is_urgent: { type: 'noul', instructions: '是否紧急？' } })
  assert.equal(other.ok, false)
  assert.match(other.error!, /离线模拟/)
  const controller = new AbortController()
  controller.abort()
  assert.equal((await callJev(shiftExamples[0], shiftQuestions, controller.signal)).ok, false)
})

test('scripted typing reaches simulated states and manual selection retains custom text', async () => {
  let memory = initialMemory
  for (const [text, expected] of [['明天', 'input'], ['明天中午', 'choose'], ['明天中午和小王', 'ghost'], [shiftExamples[0], 'committed']] as const) {
    const result = await callJev(text, shiftQuestions)
    assert.equal(result.ok, true)
    const intent = result.data.answers.intent
    assert.ok(Math.abs(Object.values<number>(intent.probabilities).reduce((sum, probability) => sum + probability, 0) - 1) < 1e-9)
    memory = decide(memory, { value: intent.choice, confidence: intent.confidence, probabilities: intent.probabilities }, text)
    assert.equal(memory.ui.kind, expected)
    if (expected === 'ghost') assert.equal(promote(memory).ui.kind, 'committed')
  }
  // 无法识别的自定义文本：本地规则判为 none，界面停在输入态，等用户补充或手动选类型
  const custom = await callJev('自定义内容', shiftQuestions)
  assert.equal(custom.ok, true)
  const customIntent = custom.data.answers.intent
  assert.equal(customIntent.choice, 'none')
  const customMemory = decide(initialMemory, { value: customIntent.choice, confidence: customIntent.confidence, probabilities: customIntent.probabilities }, '自定义内容')
  assert.equal(customMemory.ui.kind, 'input')
  const selected = force('note', '自定义内容')
  assert.deepEqual(selected.ui, { kind: 'committed', intent: 'note', forced: true })
  assert.equal(selected.forcedText, '自定义内容')
})
