import test from 'node:test'
import assert from 'node:assert/strict'
import { callBox, callJev } from '../utils/jev.ts'
import { batchQuestions, batchSamples, moderateExamples, moderateQuestions, scenarios } from '../utils/scenarios.ts'
import { boxImages, typeTabs, typeDemoExamples } from '../utils/typeDemos.ts'
import { shiftExamples, shiftQuestions, initialMemory, decide, force, promote } from '../utils/shift.ts'

test('all presets return deterministic mock answers in the expected shape without network', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('unexpected network request') }
  try {
    const cases = [
      ...typeTabs.flatMap((tab) => tab.examples.map((example) => [example.state, tab.questions] as const)),
      ...scenarios.flatMap((scenario) => scenario.examples.map((example) => [example.state, scenario.questions] as const)),
      ...moderateExamples.map((example) => [example.state, moderateQuestions] as const),
      ...batchSamples(100).map((sample) => [sample.text, batchQuestions] as const),
      ...shiftExamples.map((state) => [state, shiftQuestions] as const),
    ]
    for (const [state, questions] of cases) {
      const result = await callJev(state, questions)
      assert.equal(result.ok, true, state)
      assert.equal(result.mode, 'mock')
      assert.deepEqual(result, await callJev(state, questions))
      for (const [key, question] of Object.entries<any>(questions)) {
        const answer = result.data.answers[key]
        assert.equal(answer.type, question.type, key)
        if (question.type === 'noul') assert.ok(answer.noul >= 0 && answer.noul <= 1, key)
        if (question.type === 'choice') {
          assert.ok(Object.hasOwn(question.criteria, answer.choice), key)
          assert.deepEqual(Object.keys(answer.probabilities), Object.keys(question.criteria))
          assert.ok(Math.abs(Object.values<number>(answer.probabilities).reduce((sum, value) => sum + value, 0) - 1) < 1e-9)
        }
        if (question.type === 'score') {
          assert.ok(Number.isFinite(answer.score), key)
          assert.ok(answer.score >= 0 && answer.score < question.criteria.length, key)
          assert.equal(Object.keys(answer.legend).length, question.criteria.length)
          assert.ok(Math.abs(Object.values<number>(answer.probabilities).reduce((sum, probability) => sum + probability, 0) - 1) < 1e-9, key)
          assert.equal(answer.probabilities[Math.round(answer.score)], answer.confidence, key)
        }
      }
    }
    for (const sample of batchSamples(100)) assert.equal((await callJev(sample.text, batchQuestions)).data.answers.category.choice, sample.expected)
    for (const target of boxImages[0].targets) {
      const result = await callBox('agent.jpg', target.target)
      assert.equal(result.mode, 'mock')
      assert.deepEqual(result, await callBox('agent.jpg', target.target))
      const box = result.data.answers.target.box
      assert.ok(box.left >= 0 && box.left < box.right && box.right <= 1 && box.top >= 0 && box.top < box.bottom && box.bottom <= 1)
    }
  } finally { globalThis.fetch = originalFetch }
})

test('presentation presets share one ticket across all three text question types', async () => {
  assert.equal(typeDemoExamples.length, 3)
  assert.equal(new Set(typeDemoExamples.map((example) => example.state)).size, 1)
  assert.ok(typeDemoExamples.every((example) => example.label === '礼包扣款'))
  const results = await Promise.all(typeTabs.map((tab, index) => callJev(typeDemoExamples[index].state, tab.questions)))
  assert.ok(results.every((result) => result.ok))
  assert.equal(results[0].data.answers.is_urgent.noul, 0.95)
  assert.equal(results[1].data.answers.department.choice, 'billing')
  assert.equal(results[2].data.answers.frustration.score, 2)
  const ticket = scenarios[0]
  assert.deepEqual(Object.assign({}, ...typeTabs.map((tab) => tab.questions)), ticket.questions)
  assert.equal(ticket.examples[1].state, typeDemoExamples[0].state)
  const clear = await callJev(ticket.examples[1].state, ticket.questions)
  assert.deepEqual(clear.data.answers.is_urgent, results[0].data.answers.is_urgent)
  assert.deepEqual(clear.data.answers.department, results[1].data.answers.department)
  assert.deepEqual(clear.data.answers.frustration, results[2].data.answers.frustration)
  const ambiguous = await callJev(ticket.examples[3].state, ticket.questions)
  assert.ok(clear.ok && ambiguous.ok)
  assert.ok(clear.data.answers.department.confidence >= 0.9)
  assert.ok(ambiguous.data.answers.department.confidence < 0.7)
})

test('unsupported input, changed questions and boxes fail honestly', async () => {
  for (const result of [
    await callJev('自定义内容', moderateQuestions),
    await callJev(typeTabs[0].examples[0].state, { is_urgent: { ...typeTabs[0].questions.is_urgent, instructions: '不同题目' } }),
    await callBox('agent.jpg', 'custom target'),
    await callBox('other.jpg', boxImages[0].targets[0].target),
  ]) {
    assert.equal(result.ok, false)
    assert.equal(result.mode, 'mock')
    assert.match(result.error!, /离线模拟/)
    assert.equal(result.data, undefined)
  }
  const controller = new AbortController()
  controller.abort()
  assert.equal((await callJev('', {}, controller.signal)).ok, false)
  assert.equal((await callBox('', '', controller.signal)).ok, false)
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
  assert.equal((await callJev('自定义内容', shiftQuestions)).ok, false)
  const selected = force('note', '自定义内容')
  assert.deepEqual(selected.ui, { kind: 'committed', intent: 'note', forced: true })
  assert.equal(selected.forcedText, '自定义内容')
})

test('equivalent JSON state matches VIP fixtures', async () => {
  const scenario = scenarios[2]
  const state = JSON.stringify(JSON.parse(scenario.examples[1].state))
  assert.equal((await callJev(state, scenario.questions)).data.answers.route.choice, 'auto_refund')
})
