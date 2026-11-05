import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CARDS, shiftExamples, shiftQuestions, initialMemory, decide, force, promote, rawState,
  parseEvent, parseReminder, parseTodo, parseDuration, parseHabit, parseColor, parseSplit,
  parseExpense, parseConvert, parseCalc, parsePoll, parseTravel, parseContact, parseLink,
  parseCountdown, parseTimezone, parseRandom, parseGoal,
} from '../utils/shift.ts'

const examples: [string, string][] = [
  ['event', '明天下午3点和小王吃饭'],
  ['reminder', '提醒我明天交房租'],
  ['todo', '买牛奶、鸡蛋和面包'],
  ['timer', '25分钟专注'],
  ['habit', '每周健身3次'],
  ['color', '蒂芙尼蓝'],
  ['split', '240元3个人AA'],
  ['expense', '打车花了45元'],
  ['convert', '5英里是多少公里'],
  ['calc', '3450的18%是多少'],
  ['poll', '周五吃火锅还是烧烤？'],
  ['travel', '下周坐高铁去杭州玩两天'],
  ['contact', '保存张宁，手机13800138000'],
  ['link', '收藏这个链接：https://example.com/产品说明'],
  ['countdown', '距离春节还有几天'],
  ['timezone', '纽约上午9点，北京现在几点？'],
  ['random', '掷两个骰子'],
  ['goal', '我已经读完4本书，目标是12本'],
  ['note', '灵感：周报改成先写结论再写过程'],
]

test('Jev questions define all 19 card intents and an unknown option', () => {
  assert.equal(Object.keys(CARDS).length, 19)
  assert.equal(Object.keys(shiftQuestions).length, 14)
  for (const [expected] of examples) assert.ok(expected in shiftQuestions.intent.criteria, expected)
  assert.ok('none' in shiftQuestions.intent.criteria)
})

test('the local parsers produce usable values for all card types', () => {
  const event = parseEvent('明天下午3点和小王吃饭')
  assert.match(event.when, /明天|\d+月\d+日/)
  assert.deepEqual(event.people, ['小王'])
  assert.equal(parseReminder('提醒我明天交房租').task, '交房租')
  assert.deepEqual(parseTodo('买牛奶、鸡蛋和面包').items, ['牛奶', '鸡蛋', '面包'])
  assert.equal(parseDuration('25分钟专注'), 1500)
  assert.equal(parseHabit('每周健身3次').perWeek, 3)
  assert.match(parseColor('蒂芙尼蓝')?.hex || '', /^#/) 
  assert.equal(parseSplit('240元3个人AA')?.each, 80)
  assert.equal(parseExpense('打车花了45元')?.amount, 45)
  assert.equal(parseConvert('5英里是多少公里')?.out, 8.05)
  assert.equal(parseCalc('3450的18%是多少')?.result, '621')
  assert.equal(parsePoll('周五吃火锅还是烧烤？')?.options.length, 2)
  assert.equal(parseTravel('下周坐高铁去杭州玩两天').destination, '杭州')
  assert.equal(parseTravel('下周坐高铁去杭州玩两天').duration, '2 天')
  assert.equal(parseContact('保存张宁，手机13800138000').phone, '13800138000')
  assert.equal(parseLink('收藏这个链接：https://example.com/产品说明').url, 'https://example.com/产品说明')
  assert.equal(parseCountdown('距离春节还有几天', new Date('2026-10-28T12:00:00')).days, 101)
  assert.equal(parseTimezone('纽约上午9点，北京现在几点？', new Date('2026-10-28T12:00:00Z')).to, '北京')
  assert.equal(parseRandom('掷两个骰子').n, 2)
  assert.equal(parseGoal('我已经读完4本书，目标是12本').percent, 33)
})

test('the card state machine handles input, ghost, near ties, confirmation, and empty input', () => {
  const probabilities = (values: Record<string, number>) => ({ event: 0, reminder: 0, todo: 0, timer: 0, habit: 0, color: 0, split: 0, expense: 0, convert: 0, calc: 0, poll: 0, travel: 0, contact: 0, link: 0, countdown: 0, timezone: 0, random: 0, goal: 0, note: 0, none: 0, ...values })
  assert.equal(rawState({ value: 'none', probabilities: probabilities({ none: 0.8 }), confidence: 0.2 }).kind, 'input')
  assert.equal(rawState({ value: 'event', probabilities: probabilities({ event: 0.55 }), confidence: 0.55 }).kind, 'ghost')
  const preview = decide(initialMemory, { value: 'event', probabilities: probabilities({ event: 0.55 }), confidence: 0.55 }, '明天见面')
  const confirmed = promote(preview)
  assert.deepEqual(confirmed.ui, { kind: 'committed', intent: 'event' })
  assert.equal(promote(confirmed), confirmed)
  assert.equal(promote(initialMemory), initialMemory)
  assert.deepEqual(rawState({ value: 'event', probabilities: probabilities({ event: 0.42, reminder: 0.35 }), confidence: 0.6 }), { kind: 'choose', options: ['event', 'reminder'] })

  const forced = force('event', '明天和小王吃饭')
  assert.deepEqual(decide(forced, { value: 'reminder', probabilities: probabilities({ reminder: 0.95 }), confidence: 0.95 }, '明天和小王吃饭'), forced)
  assert.deepEqual(decide(forced, { value: 'none', probabilities: probabilities({ none: 0.9 }), confidence: 0.1 }, ''), initialMemory)
})

// 本地打分分类器：日常说法的回归样本。[输入, 期望类型, 期望界面状态]
const everyday: [string, string, string][] = [
  ['明天中午和小王吃饭', 'event', 'committed'], ['下周三下午三点开会', 'event', 'committed'], ['约小王周五吃饭', 'event', 'committed'],
  ['提醒我周五交周报', 'reminder', 'committed'], ['周五别忘了交周报', 'reminder', 'committed'],
  ['买牛奶、鸡蛋、面包', 'todo', 'committed'], ['周末要做的事：洗车 理发', 'todo', 'committed'],
  ['午饭花了35', 'expense', 'committed'], ['打车 28 块', 'expense', 'committed'], ['咖啡 ¥32', 'expense', 'committed'],
  ['360元4人平摊', 'split', 'committed'], ['晚饭一共480，我们5个人', 'split', 'committed'],
  ['5公里是多少英里', 'convert', 'committed'], ['1999元打八五折', 'calc', 'committed'], ['23*47', 'calc', 'committed'],
  ['番茄钟25分钟', 'timer', 'committed'], ['10分钟后叫我', 'timer', 'ghost'],
  ['每天跑步30分钟', 'habit', 'committed'], ['周五吃火锅还是烧烤', 'poll', 'committed'],
  ['距离春节还有几天', 'countdown', 'committed'], ['纽约现在几点', 'timezone', 'committed'], ['帮我掷个骰子', 'random', 'committed'],
  ['今年读书目标12本，已经读了4本', 'goal', 'committed'], ['张三 13812345678', 'contact', 'committed'],
  ['https://jev.huangguanhao.com', 'link', 'committed'], ['天蓝色', 'color', 'committed'],
  ['下个月去杭州玩两天', 'travel', 'committed'], ['想法：给工单系统加自动分类', 'note', 'committed'],
  ['我想吃饭', 'none', 'input'], ['明天', 'none', 'input'], ['明天中午', 'event', 'choose'], ['100美元换成人民币', 'none', 'input'],
]

test('the scoring classifier handles everyday phrasing and reports graded confidence', async () => {
  const { classifyShift } = await import('../utils/shiftMock.ts')
  for (const [text, intent, kind] of everyday) {
    const { intent: answer } = classifyShift(text)
    assert.equal(answer.choice, intent, text)
    const sum = Object.values<number>(answer.probabilities).reduce((total, p) => total + p, 0)
    assert.ok(Math.abs(sum - 1) < 1e-9, `${text} 概率之和应为 1`)
    const memory = decide(initialMemory, { value: answer.choice, confidence: answer.confidence, probabilities: answer.probabilities }, text)
    assert.equal(memory.ui.kind, kind, `${text} 的界面状态`)
  }
  // 把握度不再是固定值：强信号、弱信号、看不出来应得到不同的把握度
  const levels = new Set(everyday.map(([text]) => classifyShift(text).intent.confidence))
  assert.ok(levels.size >= 5, '把握度应随信号强弱变化')
})
