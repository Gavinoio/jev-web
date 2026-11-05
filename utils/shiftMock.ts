import { parseCalc, parseColor, parseConvert, parseDuration, parseWhen, shiftQuestions, type IntentKey } from './shift.ts'

export function classifyShift(input: string) {
  const text = input.normalize('NFKC').trim()
  const when = parseWhen(text)
  const recurring = /每天|每日|天天|每周|每星期|每个星期|工作日|周末|每月/.test(text)
  const reminder = /提醒|记得|别忘/.test(text)
  const note = /^(?:记下|记一下|笔记|灵感|想法|备忘|记录一下想法)/.test(text)
  const shopping = /(?:买|采购|购物清单)/.test(text)
  const list = /[、,，;；\n]|以及|还有|和/.test(text)
  const event = /吃饭|午饭|晚饭|聚餐|开会|会议|见面|面试|喝咖啡|喝茶|看电影|打球|评审|复盘|对需求|通话|视频|约.+(?:吃|喝|聊|见)/i.test(text)
  const participant = /(?:和|跟|与|(?<![纽大])约)\s*[^\s,，。]{1,}/.test(text)
  // 打分制：每种卡片按命中的信号累加分数，"看不出来"固定 1 分；按分数占比换算成概率。
  // 强信号（如"AA""花了""提醒我"）一条约 4 分 → 约 0.8，直接成卡片；
  // 只有弱信号（只写了时间、只写了和谁）分数低 → 把握度在 0.4–0.7 显示虚影，或前两名接近时让用户二选一。
  const STRONG = 4
  const score: Partial<Record<IntentKey, number>> = {}
  const add = (key: IntentKey, points: number) => { score[key] = Math.max(0, (score[key] ?? 0) + points) }
  const num = '(?:\\d+(?:\\.\\d+)?|[两二三四五六七八九十百千万]+)'
  const amount = new RegExp(`${num}\\s*(?:元|块|rmb)|[¥￥]\\s*\\d|(?:一共|总共|合计|共)\\s*\\d`, 'i').test(text)
  const headcount = new RegExp(`${num}\\s*(?:个)?人|我们\\s*${num}\\s*个`).test(text)
  const duration = parseDuration(text) > 0
  const itemCount = text.split(/[、,，;；\n]|以及|还有|和|\s+/).map((part) => part.replace(/^.*[：:]/, '').trim()).filter(Boolean).length

  if (note) add('note', STRONG + 1)
  if (reminder && text.replace(/提醒我|提醒一下|提醒|记得|别忘了?|[\s,，。!！]/g, '').length > 0) add('reminder', STRONG)
  if (recurring && /健身|运动|跑步|读书|阅读|喝水|学习|练习|打卡|坚持|习惯|次/.test(text)) add('habit', STRONG)
  if (/AA|均摊|平摊|分摊|分账|平分/i.test(text)) add('split', STRONG)
  if (amount && headcount) add('split', STRONG)
  const calcLike = !!parseCalc(text) && /折|%|％|百分|[+\-*/×÷]|乘|除以|加上|减去/.test(text)
  if (/花了|花费|付了|支出|消费|记账|买了.+(?:元|块)/.test(text)) add('expense', STRONG)
  else if (amount && !headcount && !calcLike) add('expense', 2.5)
  if (score.expense && amount && /打车|地铁|车票|加油|吃|饭|餐|咖啡|奶茶|外卖|买菜|房租|水电|话费|电影|门票/.test(text)) add('expense', 0.8)
  if (/骰子|硬币|随机|抽签|抽一个|帮我选/.test(text)) add('random', STRONG)
  if (/(?:距离|距|还有|倒数日|倒计时).*(?:几天|多少天|天|春节|元旦|国庆|生日)|(?:春节|元旦|国庆|生日).*还有/.test(text)) add('countdown', STRONG)
  if (/时区|当地时间|现在几点|对应.*几点|几点.*(?:北京|上海|东京|纽约|伦敦)|(?:北京|上海|东京|纽约|伦敦).*几点/.test(text)) add('timezone', STRONG)
  if (/https?:\/\/|www\./i.test(text)) add('link', STRONG + 1)
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b1[3-9]\d{9}\b/i.test(text) || /(?:保存|添加|新增).*(?:联系人|电话|手机|邮箱)/.test(text)) add('contact', STRONG)
  if (/目标|进度/.test(text) && /\d|[一二三四五六七八九十百千万]/.test(text)) add('goal', STRONG)
  if (/投票|还是|或者|\s+vs\s+/i.test(text)) add('poll', STRONG + (/[?？]/.test(text) ? 0.5 : 0))
  if (/(?:倒计时|计时|番茄钟|专注|秒表|休息)/.test(text) && (duration || /^(?:请|帮我|设置|开始|开个|一个|\s)*(?:倒计时|计时器?|番茄钟|秒表)$/.test(text))) add('timer', STRONG)
  else if (duration && /后(?:叫我|喊我|提醒|通知)|到点|闹钟/.test(text)) { add('timer', 3); add('reminder', 1.5) }
  if (/旅行|旅游|度假|出差|探亲|机票|航班|酒店|住宿|(?:坐|乘|搭).*(?:高铁|火车|飞机)|(?:去|到|前往).+玩/.test(text)) add('travel', STRONG)
  if (/换算|换成|转换|等于多少|是多少|多少(?:公里|米|斤|克|磅|升|度)/.test(text) && parseConvert(text)) add('convert', STRONG + 0.5)
  if (shopping && list || /待办|清单|要做的事|要买的|要办的/.test(text)) add('todo', STRONG)
  if (parseColor(text)) add('color', STRONG - 0.5)
  if (parseCalc(text) && !score.split && !score.convert) add('calc', STRONG - 0.5)

  // 日程：有时间、有对象、有"吃饭 / 开会"这类动作，三类信号叠加；只有动作、没有时间和对象时只算弱信号
  const strongOther = Math.max(0, ...Object.entries(score).filter(([key]) => key !== 'event' && key !== 'reminder').map(([, value]) => value ?? 0))
  const timeBelongsElsewhere = !!(score.timezone || score.countdown || score.timer || score.travel)
  if (!timeBelongsElsewhere) {
    if (when.hasDay) { add('event', 0.4); add('reminder', 0.3) }
    if (when.hasTime) { add('event', 0.8); add('reminder', 0.7) }
  }
  if (participant && !(shopping && list)) { add('event', 1.2); add('reminder', -0.4) }
  if (event && (when.hasDay || when.hasTime || participant)) add('event', STRONG)
  else if (event && strongOther < STRONG - 0.5) add('event', 0.9)
  if (/腾讯会议|飞书|钉钉|zoom|teams/i.test(text)) add('event', 1)

  // 弱信号：只在没有更明确的类型时才计分
  const strongest = Math.max(0, ...Object.values(score).map((value) => value ?? 0))
  if (strongest < STRONG - 0.5) {
    if (recurring) { add('habit', 1); add('reminder', 0.5) }
    if (itemCount >= 3 && !amount && !participant && !event) add('todo', 1.2)
    if (text.length >= 12 && strongest === 0) add('note', 0.8)
  }

  const keys = Object.keys(shiftQuestions.intent.criteria) as IntentKey[]
  const raw = Object.fromEntries(keys.map((key) => [key, key === 'none' ? 1 + (text.length <= 1 ? 1 : 0) : score[key] ?? 0])) as Record<IntentKey, number>
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0)
  const probabilities = Object.fromEntries(keys.map((key) => [key, raw[key] / total]))
  const [choice] = keys.reduce((best, key) => (probabilities[key] > best[1] ? [key, probabilities[key]] : best), ['none', -1] as [IntentKey, number])
  const confidence = Math.round(probabilities[choice] * 100) / 100
  const values: Record<string, boolean | string | number> = {
    intent: choice,
    readiness: choice === 'none' ? 0 : confidence < 0.7 ? 1 : 2,
    isQuestion: /[?？]|多少|几天|几点/.test(text),
    recurring,
    urgency: /很急|紧急|马上|尽快|赶紧|立刻/.test(text) ? 2 : 0,
    tone: /担心|烦躁|压力|生气/.test(text) ? 'stressed' : /开心|感谢|满意/.test(text) ? 'positive' : 'neutral',
    eventMode: /腾讯会议|飞书|钉钉|zoom|teams|视频/i.test(text) ? 'video_call' : /电话|通话/.test(text) ? 'phone_call' : participant && event ? 'in_person' : 'unspecified',
    transport: /飞机|航班|机票/.test(text) ? 'flight' : /高铁|火车/.test(text) ? 'train' : /公交|大巴|巴士/.test(text) ? 'bus' : /汽车|自驾|开车/.test(text) ? 'car' : 'unspecified',
    tripType: /出差|商务|工作/.test(text) ? 'work' : /旅游|旅行|度假|探亲|玩/.test(text) ? 'leisure' : 'unspecified',
    expenseCategory: /打车|地铁|车票|加油/.test(text) ? 'transport' : /吃|饭|餐|咖啡|饮料|买菜/.test(text) ? 'food' : /房租|水电|话费|会员/.test(text) ? 'bills' : /看病|药品|健身/.test(text) ? 'health' : /电影|游戏|演出/.test(text) ? 'entertainment' : /购物|买了/.test(text) ? 'shopping' : 'other',
    colorMood: /红|橙|黄/.test(text) ? 'warm' : /蓝|绿|紫/.test(text) ? 'cool' : 'neutral',
    timerKind: /专注|番茄钟/.test(text) ? 'focus' : /休息/.test(text) ? 'break' : /秒表|正向计时/.test(text) ? 'stopwatch' : choice === 'timer' ? 'countdown' : 'unspecified',
    hasExplicitOptions: choice === 'poll' && /还是|或者|[、,，]/.test(text),
    isShoppingList: choice === 'todo' && shopping,
  }
  return { values, intent: { type: 'choice', choice, confidence, probabilities } }
}
