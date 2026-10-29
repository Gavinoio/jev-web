// 「会变形的输入框」演示：思路来自开源项目 anishfn/shapeshift（MIT），这里改成中文输入。
// 分工：Jev 只判断"想建哪种卡片 + 几个信号"，日期、金额、单位、算术都由下面的代码确定性地算出来。
// ——"Jev decides, code computes."

// ───────────────────────── 题目：一次请求，14 道题并行 ─────────────────────────
export const shiftQuestions = {
  intent: {
    type: 'choice',
    instructions: '用户在输入框里打这段话，最想创建的是哪一种卡片？',
    criteria: {
      event: '约别人在某个时间见面、吃饭、开会或通话',
      reminder: '让系统提醒自己做某一件事，例如"提醒我……""记得……"',
      todo: '列出好几件要做或要买的东西',
      timer: '计时、倒计时、专注或休息一段时间',
      habit: '想养成、定期重复做的习惯，例如每天、每周几次',
      color: '提到一个颜色：色号、rgb 值或用文字描述的颜色',
      split: '几个人分摊一笔钱，AA',
      expense: '记录自己花掉的一笔钱',
      convert: '把一个数值从一种计量单位换算成另一种',
      calc: '数学计算、百分比或打折，不是分钱也不是单位换算',
      poll: '让一群人在几个选项里投票选择',
      travel: '计划去某个目的地旅行、乘坐航班或火车、安排住宿',
      contact: '保存联系人的姓名、电话号码或电子邮箱',
      link: '保存一个网址，可附上说明',
      countdown: '想知道距离某个日子、节日还有几天',
      timezone: '查询不同城市的当地时间，或在时区之间换算时间',
      random: '要一个随机结果：掷骰子、抛硬币、随机数或随机挑一个',
      goal: '记录数字目标的当前进度，例如读书数量或储蓄金额',
      note: '记下一个想法、灵感或笔记，不属于以上任何一种',
      none: '太短、没写完或看不出想做什么',
    },
  },
  readiness: { type: 'score', instructions: '这段输入对于要创建的东西来说，信息完整到什么程度？', criteria: ['刚开始写，关键信息缺失', '写了一部分，有些细节', '信息完整，可以直接创建'] },
  isQuestion: { type: 'noul', instructions: '这段文字是在提出问题，而不是下达指令或陈述事实吗？' },
  recurring: { type: 'noul', instructions: '这段文字描述的事情是否会按计划重复？' },
  urgency: { type: 'score', instructions: '这段话听起来有多紧急？', criteria: ['完全不急', '有点赶时间', '非常紧急，要马上处理'] },
  tone: { type: 'choice', instructions: '这段文字表达了什么情绪？', criteria: { neutral: '平实、中性', positive: '开心、感谢或满意', excited: '兴奋、期待', stressed: '担心、烦躁或有压力', reflective: '平静、思考或回顾' } },
  eventMode: {
    type: 'choice',
    instructions: '如果是见面或开会，会以什么方式进行？',
    criteria: { in_person: '线下见面', video_call: '视频会议，如 Zoom、腾讯会议、飞书', phone_call: '打电话', unspecified: '没提到，或者不是见面' },
  },
  transport: { type: 'choice', instructions: '这次出行采用什么交通方式？', criteria: { flight: '飞机', train: '火车或高铁', bus: '公交或长途巴士', car: '汽车或自驾', unspecified: '没有说明，或与出行无关' } },
  tripType: { type: 'choice', instructions: '这次行程主要是什么目的？', criteria: { work: '工作或商务出行', leisure: '度假、旅游或探亲', unspecified: '没有说明，或与出行无关' } },
  expenseCategory: {
    type: 'choice',
    instructions: '如果是记账，这笔钱花在哪一类？',
    criteria: { food: '吃饭、外卖、饮料、买菜', transport: '打车、地铁、加油、车票', shopping: '衣服、数码、日用品等购物', bills: '房租、水电、话费、会员订阅', entertainment: '电影、游戏、演出、出去玩', health: '药品、看病、健身', other: '其他，或者不是记账' },
  },
  colorMood: { type: 'choice', instructions: '描述的颜色整体有什么感觉？', criteria: { warm: '红色、橙色、黄色等暖色', cool: '蓝色、绿色、紫色等冷色', neutral: '灰色、米色、偏白等中性色', vivid: '明亮、鲜艳、高饱和', pastel: '柔和、浅淡', dark: '深色、暗色' } },
  timerKind: {
    type: 'choice',
    instructions: '如果是计时，想要哪一种？',
    criteria: { countdown: '普通倒计时', focus: '专注、番茄钟、深度工作', break: '休息一下', stopwatch: '正向计时，不设结束时间', unspecified: '没说清，或者不是计时' },
  },
  hasExplicitOptions: { type: 'noul', instructions: '这段文字是否明确列出了两个或更多可选项？' },
  isShoppingList: { type: 'noul', instructions: '列出来的东西是否是要去买的物品？' },
}

export type IntentKey = keyof typeof shiftQuestions.intent.criteria
export type CardKey = Exclude<IntentKey, 'none'>

export const CARDS: Record<CardKey, { name: string; icon: string }> = {
  event: { name: '日程', icon: '📅' }, reminder: { name: '提醒', icon: '⏰' }, todo: { name: '清单', icon: '☑️' },
  timer: { name: '计时器', icon: '⏱️' }, habit: { name: '习惯', icon: '🔁' }, color: { name: '颜色', icon: '🎨' },
  split: { name: 'AA 分账', icon: '🧾' }, expense: { name: '记账', icon: '💸' }, convert: { name: '单位换算', icon: '📏' },
  calc: { name: '计算', icon: '🧮' }, poll: { name: '投票', icon: '🗳️' }, countdown: { name: '倒数日', icon: '⏳' },
  travel: { name: '行程', icon: '🧳' }, contact: { name: '联系人', icon: '👤' }, link: { name: '链接', icon: '🔗' },
  timezone: { name: '时区', icon: '🌐' }, random: { name: '随机', icon: '🎲' }, goal: { name: '目标', icon: '🎯' }, note: { name: '笔记', icon: '📝' },
}

export const shiftExamples = [
  '明天中午和小王、小李吃饭',
  '周五晚上8点和产品组开腾讯会议',
  '提醒我明天交房租，很急',
  '买牛奶、鸡蛋、面包和咖啡',
  '25分钟专注',
  '每周健身3次',
  '蒂芙尼蓝',
  '2400块3个人AA',
  '打车花了45元',
  '5英里是多少公里',
  '3450的18%是多少',
  '计划下月坐高铁去杭州玩两天',
  '周五团建吃火锅还是烧烤？',
  '保存张宁，手机13800138000',
  '收藏这个链接：https://example.com/产品说明',
  '距离春节还有几天',
  '纽约上午9点，北京现在几点？',
  '掷两个骰子',
  '我已经读完4本书，目标是12本',
  '灵感：周报改成先写结论再写过程',
  '活动页可以加个倒计时',
]

// ───────────────────────── 结果 → 平稳的界面状态（移植自 shapeshift 的 decide.ts） ─────────────────────────
export interface IntentAnswer { value: IntentKey; probabilities: Record<string, number>; confidence: number }
export type UiState =
  | { kind: 'input' }
  | { kind: 'ghost'; intent: CardKey }
  | { kind: 'choose'; options: [CardKey, CardKey] }
  | { kind: 'committed'; intent: CardKey; forced?: boolean }

export const TH = { inputBelow: 0.4, commitAt: 0.7, chooseGap: 0.15, chooseFloor: 0.25, challengerOverride: 0.85, challengerWins: 2, dropBelow: 0.3 }

export interface Memory { ui: UiState; challenger: { intent: CardKey; wins: number } | null; forcedText: string | null }
export const initialMemory: Memory = { ui: { kind: 'input' }, challenger: null, forcedText: null }

/** Tab 确认预览，不改变当前输入或卡片类型。 */
export function promote(memory: Memory): Memory {
  return memory.ui.kind === 'ghost'
    ? { ui: { kind: 'committed', intent: memory.ui.intent }, challenger: null, forcedText: null }
    : memory
}

const ranked = (a: IntentAnswer) => Object.entries(a.probabilities).sort((x, y) => y[1] - x[1]) as [IntentKey, number][]

function nearTie(a: IntentAnswer): [CardKey, CardKey] | null {
  const r = ranked(a).filter(([k]) => k !== 'none')
  if (r.length < 2) return null
  const [[x, px], [y, py]] = r
  return px > TH.chooseFloor && py > TH.chooseFloor && px - py < TH.chooseGap ? [x as CardKey, y as CardKey] : null
}

/** 单次结果 → 界面状态：低把握留在输入态，中等把握显示虚影，前两名太接近就让用户二选一 */
export function rawState(a: IntentAnswer): UiState {
  const tie = nearTie(a)
  if (a.value === 'none' || a.confidence < TH.inputBelow) return tie && a.value !== 'none' ? { kind: 'choose', options: tie } : { kind: 'input' }
  if (tie) return { kind: 'choose', options: tie }
  if (a.confidence < TH.commitAt) return { kind: 'ghost', intent: a.value as CardKey }
  return { kind: 'committed', intent: a.value as CardKey }
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[b.length]
}

/** 把一串忽高忽低的结果变成"不闪"的界面：已定型的卡片，要被挑战者连赢两次或被高把握（≥0.85）压过才会换 */
export function decide(mem: Memory, a: IntentAnswer, text: string): Memory {
  if (!text.trim()) return initialMemory
  const prev = mem.ui
  if (prev.kind === 'committed' && prev.forced && mem.forcedText !== null) {
    if (levenshtein(mem.forcedText, text) <= 0.3 * Math.max(mem.forcedText.length, text.length, 1)) return mem
  }
  const raw = rawState(a)
  if (prev.kind === 'committed' && !prev.forced) {
    const cur = prev.intent
    const curP = a.probabilities[cur] ?? 0
    if (a.value === cur) return { ui: prev, challenger: null, forcedText: null }
    if (a.value === 'none') return curP < TH.dropBelow ? initialMemory : { ...mem, challenger: null }
    if (a.confidence >= TH.challengerOverride) return { ui: { kind: 'committed', intent: a.value as CardKey }, challenger: null, forcedText: null }
    const wins = mem.challenger?.intent === a.value ? mem.challenger.wins + 1 : 1
    if (wins >= TH.challengerWins && a.confidence >= TH.inputBelow) return { ui: raw, challenger: null, forcedText: null }
    if (curP < TH.dropBelow && a.confidence < TH.inputBelow) return initialMemory
    return { ui: prev, challenger: { intent: a.value as CardKey, wins }, forcedText: null }
  }
  return { ui: raw, challenger: null, forcedText: null }
}
export const force = (intent: CardKey, text: string): Memory => ({ ui: { kind: 'committed', intent, forced: true }, challenger: null, forcedText: text })

/** 信号带"滞回"：越过 on 才亮，跌破 off 才灭，中间保持原样，徽章不会一闪一闪 */
export const hysteresis = (v: number, prev: boolean, on: number, off: number) => (v >= on ? true : v <= off ? false : prev)

// ───────────────────────── 代码负责算：中文数字、日期、单位…… ─────────────────────────
const D: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
const U: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000 }
export const NUM = '(\\d+(?:\\.\\d+)?|[零〇一二两三四五六七八九十百千万]+)'

/** "25" / "二十五" / "两" / "一百二十" → 数字 */
export function toNum(s: string): number {
  if (/^\d/.test(s)) return parseFloat(s)
  let total = 0, section = 0, n = 0
  for (const ch of s) {
    if (ch in D) n = D[ch]
    else if (ch in U) {
      const u = U[ch]
      if (u === 10000) { total += (section + n) * u; section = 0 }
      else section += (n || 1) * u
      n = 0
    }
  }
  return total + section + n
}

const WEEK = '日一二三四五六'
const pad = (n: number) => String(n).padStart(2, '0')
export const fmtDate = (d: Date, withTime = true) =>
  `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}` + (withTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : '')

/** 从中文里找"什么时候"：今天 / 明天 / 周五 / 下周三 / 10月30日 / 晚上8点半…… */
export function parseWhen(text: string, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let hasDay = false, hasTime = false
  const parts: string[] = []
  const rel = text.match(/今天|明天|后天|大后天/)
  if (rel) { d.setDate(d.getDate() + { 今天: 0, 明天: 1, 后天: 2, 大后天: 3 }[rel[0]]!); hasDay = true; parts.push(rel[0]) }
  const wk = text.match(/(下|这|本)?(?:周|星期|礼拜)([一二三四五六日天])/)
  if (wk && !rel) {
    const target = wk[2] === '天' ? 0 : WEEK.indexOf(wk[2])
    const today = d.getDay()
    if (wk[1] === '下') {
      const monday = new Date(d); monday.setDate(d.getDate() - ((today + 6) % 7) + 7)
      d.setTime(monday.getTime()); d.setDate(monday.getDate() + ((target + 6) % 7))
    } else d.setDate(d.getDate() + ((target - today + 7) % 7))
    hasDay = true; parts.push(wk[0])
  }
  const md = text.match(new RegExp(`${NUM}月${NUM}[日号]`))
  if (md) {
    d.setMonth(toNum(md[1]) - 1, toNum(md[2]))
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d.setFullYear(d.getFullYear() + 1)
    hasDay = true; parts.push(md[0])
  }
  const tm = text.match(new RegExp(`(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上)?\\s*${NUM}\\s*[点:：]\\s*(半|${NUM}\\s*分?)?`))
  const period = text.match(/凌晨|早上|早晨|上午|中午|下午|傍晚|晚上/)
  if (tm) {
    let h = toNum(tm[2])
    const p = tm[1] || period?.[0]
    if (p && /下午|傍晚|晚上/.test(p) && h < 12) h += 12
    if (p === '中午' && h < 11) h += 12
    const m = tm[3] === '半' ? 30 : tm[4] ? toNum(tm[4]) : 0
    d.setHours(h, m); hasTime = true; parts.push(tm[0])
    if (period && !tm[1]) parts.push(period[0])
  } else if (period) {
    d.setHours({ 凌晨: 6, 早上: 8, 早晨: 8, 上午: 10, 中午: 12, 下午: 15, 傍晚: 18, 晚上: 19 }[period[0]]!, 0)
    hasTime = true; parts.push(period[0])
  }
  return { date: hasDay || hasTime ? d : null, hasDay, hasTime, parts }
}
const strip = (text: string, parts: string[]) => parts.reduce((t, p) => t.replace(p, ' '), text)
const clean = (s: string) => s.replace(/^[\s，,。:：、和跟与]+|[\s，,。:：！!？?、]+$/g, '').replace(/\s+/g, ' ').trim()

// ───────────────────────── 每种卡片一个解析器 ─────────────────────────
export function parseEvent(text: string) {
  const w = parseWhen(text)
  const body = strip(text, w.parts)
  const pm = body.match(/(?:和|跟|与|约)([^，,。]+?)(?=一起|吃|喝|开|见|聊|打|去|看|在|过|讨论|对|$)/)
  const people = pm ? pm[1].split(/[、,，和跟与]/).map(clean).filter(Boolean) : []
  const act = body.match(/吃午饭|吃晚饭|吃早饭|吃饭|午饭|晚饭|聚餐|开会|会议|喝咖啡|喝茶|喝酒|面试|看电影|打球|评审|复盘|见面|聊聊|对需求/)
  const app = body.match(/腾讯会议|飞书|钉钉|zoom|teams|视频/i)
  const place = body.match(/在([^，,。]{1,12}?)(?=吃|开|见|喝|聊|$)/)
  const title = act ? act[0].replace(/^会议$/, '开会') : clean(body.replace(pm?.[0] ?? '', '').replace(app?.[0] ?? '', '')) || '见面'
  const appTitle = app ? (app[0].includes('会议') ? app[0] : `${app[0]} 会议`) : ''
  return { when: w.date ? fmtDate(w.date, w.hasTime) : '时间待定', hasTime: w.hasTime, people, title: appTitle && /会/.test(title) ? appTitle : title, place: place ? clean(place[1]) : '' }
}

export function parseReminder(text: string) {
  const w = parseWhen(text)
  const task = clean(strip(text, w.parts).replace(/提醒我|提醒一下|记得要?|别忘了?|一定要|很急|紧急|十万火急|马上|尽快|赶紧/g, ' ')) || '（写下要做的事）'
  return { task, when: w.date ? fmtDate(w.date, w.hasTime) : '未设时间' }
}

export function parseTodo(text: string) {
  const body = text.replace(/^(帮我)?(去)?(超市)?(要买|买|采购|待办|清单|今天要做|要做)[:：]?/, '')
  const items = body.split(/[，,、;；\n]|以及|还有|和/).map(clean).filter(Boolean)
  return { items }
}

export function parseDuration(text: string) {
  let sec = 0
  if (/半小时|半个小时/.test(text)) sec += 1800
  for (const m of text.matchAll(new RegExp(`${NUM}\\s*(个?小时|h|分钟|分|min|秒|s)`, 'gi'))) {
    const v = toNum(m[1]), u = m[2].toLowerCase()
    sec += /小时|h/.test(u) ? v * 3600 : /秒|^s$/.test(u) ? v : v * 60
  }
  return sec
}

export function parseHabit(text: string) {
  let perWeek = 0
  const weekly = /每周|一周|每星期|每个星期/.test(text)
  const m = text.match(new RegExp(`${NUM}\\s*[次天回]`))
  if (weekly && m) perWeek = toNum(m[1])
  else if (/每天|天天|每日/.test(text)) perWeek = 7
  else if (/工作日/.test(text)) perWeek = 5
  else if (/周末/.test(text)) perWeek = 2
  const action = clean(text.replace(weekly && m ? m[0] : '', ' ').replace(/每周|一周|每星期|每个星期|每天|天天|每日|工作日|周末|坚持|要|我想|养成/g, ' ')) || '新习惯'
  return { perWeek: Math.min(perWeek || 3, 7), action }
}

const COLOR_NAMES: Record<string, string> = {
  蒂芙尼蓝: '#81d8d0', 克莱因蓝: '#002fa7', 普鲁士蓝: '#003153', 天空蓝: '#87ceeb', 海军蓝: '#000080', 宝石蓝: '#0f52ba', 雾霾蓝: '#8fa3b8',
  中国红: '#e60012', 勃艮第红: '#800020', 酒红: '#8b0000', 玫瑰红: '#e11d74', 珊瑚红: '#ff6f61',
  爱马仕橙: '#f37021', 珊瑚橙: '#ff7f50', 橘色: '#ffa500', 柠檬黄: '#fff44f', 鹅黄: '#fff143', 芥末黄: '#d4a017',
  薄荷绿: '#98ff98', 牛油果绿: '#9cba5f', 墨绿: '#0b3d2e', 橄榄绿: '#808000', 草绿: '#7cfc00',
  樱花粉: '#ffb7c5', 少女粉: '#f9c6d0', 薰衣草紫: '#b57edc', 香芋紫: '#a68bc1', 莫兰迪灰: '#a39e93', 高级灰: '#8e8e8e',
  奶油白: '#fffdd0', 象牙白: '#fffff0', 炭黑: '#222222', 红色: '#ef4444', 蓝色: '#3b82f6', 绿色: '#22c55e', 黄色: '#eab308', 紫色: '#a855f7', 粉色: '#ec4899', 橙色: '#f97316', 黑色: '#000000', 白色: '#ffffff', 灰色: '#9ca3af',
}
export function parseColor(text: string) {
  let hex = ''
  const h = text.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)
  const rgb = text.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  if (h) hex = h[1].length === 3 ? '#' + [...h[1]].map((c) => c + c).join('') : '#' + h[1]
  else if (rgb) hex = '#' + [rgb[1], rgb[2], rgb[3]].map((v) => pad2(Math.min(255, +v))).join('')
  else {
    const name = Object.keys(COLOR_NAMES).sort((a, b) => b.length - a.length).find((n) => text.includes(n) || text.includes(n.replace(/色$/, '')))
    if (name) hex = COLOR_NAMES[name]
  }
  if (!hex) return null
  hex = hex.toLowerCase()
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const comp = '#' + [r, g, b].map((v) => pad2(255 - v)).join('')
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return { hex, rgb: `rgb(${r}, ${g}, ${b})`, hsl: toHsl(r, g, b), comp, textOn: lum > 0.6 ? '#111' : '#fff' }
}
const pad2 = (v: number) => v.toString(16).padStart(2, '0')
function toHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

const money = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
export { money }

/** 金额：优先找带"块 / 元 / ¥"的数，找不到再退回第一个阿拉伯数字（避免把"一杯"的"一"当成金额） */
function findAmount(text: string) {
  return text.match(new RegExp(`[¥￥]\\s*${NUM}|${NUM}\\s*(?:块钱|块|元|rmb)`, 'i')) || text.match(/(\d+(?:\.\d+)?)/)
}
const amountOf = (m: RegExpMatchArray) => toNum(m[1] ?? m[2])

export function parseSplit(text: string) {
  const people = text.match(new RegExp(`${NUM}\\s*(?:个人|人|位|个)`))
  const n = people ? toNum(people[1]) : 0
  const rest = people ? text.replace(people[0], ' ') : text
  const amt = findAmount(rest)
  const total = amt ? amountOf(amt) : 0
  if (!total || !n) return null
  const each = Math.floor((total / n) * 100) / 100
  const diff = +(total - each * n).toFixed(2)
  return { total, n, each, diff }
}

const EXPENSE_ICON: Record<string, string> = { food: '🍜', transport: '🚕', shopping: '🛍️', bills: '🏠', entertainment: '🎬', other: '💰' }
const EXPENSE_NAME: Record<string, string> = { food: '餐饮', transport: '交通', shopping: '购物', bills: '账单', entertainment: '娱乐', other: '其他' }
export function parseExpense(text: string, category?: string | null) {
  const amt = findAmount(text)
  if (!amt) return null
  const item = clean(text.replace(amt[0], ' ').replace(/今天|昨天|刚才|花了|花费|付了|买了|消费|一共|总共|了/g, ' ')) || '一笔支出'
  const c = category || 'other'
  return { amount: amountOf(amt), item, icon: EXPENSE_ICON[c], cat: EXPENSE_NAME[c] }
}

interface Unit { names: string[]; dim: string; k?: number; to?: (v: number) => number; from?: (v: number) => number; label: string; pair: string }
const UNITS: Unit[] = [
  { names: ['公里', '千米', 'km'], dim: 'len', k: 1000, label: '公里', pair: '英里' },
  { names: ['英里', 'mile', 'miles'], dim: 'len', k: 1609.344, label: '英里', pair: '公里' },
  { names: ['厘米', 'cm'], dim: 'len', k: 0.01, label: '厘米', pair: '英寸' },
  { names: ['毫米', 'mm'], dim: 'len', k: 0.001, label: '毫米', pair: '英寸' },
  { names: ['英尺', 'ft'], dim: 'len', k: 0.3048, label: '英尺', pair: '米' },
  { names: ['英寸', '寸', 'inch'], dim: 'len', k: 0.0254, label: '英寸', pair: '厘米' },
  { names: ['米', 'm'], dim: 'len', k: 1, label: '米', pair: '英尺' },
  { names: ['公斤', '千克', 'kg'], dim: 'mass', k: 1, label: '公斤', pair: '斤' },
  { names: ['斤'], dim: 'mass', k: 0.5, label: '斤', pair: '公斤' },
  { names: ['磅', 'lb', 'lbs'], dim: 'mass', k: 0.45359237, label: '磅', pair: '公斤' },
  { names: ['克', 'g'], dim: 'mass', k: 0.001, label: '克', pair: '盎司' },
  { names: ['盎司', 'oz'], dim: 'mass', k: 0.028349523125, label: '盎司', pair: '克' },
  { names: ['摄氏度', '摄氏', '℃', '°c'], dim: 'temp', to: (v) => v, from: (v) => v, label: '摄氏度', pair: '华氏度' },
  { names: ['华氏度', '华氏', '℉', '°f'], dim: 'temp', to: (v) => ((v - 32) * 5) / 9, from: (v) => (v * 9) / 5 + 32, label: '华氏度', pair: '摄氏度' },
  { names: ['毫升', 'ml'], dim: 'vol', k: 0.001, label: '毫升', pair: '升' },
  { names: ['加仑', 'gallon'], dim: 'vol', k: 3.785411784, label: '加仑', pair: '升' },
  { names: ['升', 'l'], dim: 'vol', k: 1, label: '升', pair: '加仑' },
]
const unitRe = new RegExp(UNITS.flatMap((u) => u.names).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi')
const findUnit = (s: string) => UNITS.find((u) => u.names.some((n) => n.toLowerCase() === s.toLowerCase()))
export function parseConvert(text: string) {
  const vm = text.match(new RegExp(NUM))
  if (!vm) return null
  const v = toNum(vm[1])
  const after = text.slice((vm.index ?? 0) + vm[0].length)
  const found = [...after.matchAll(unitRe)].map((m) => findUnit(m[0])).filter(Boolean) as Unit[]
  const from = found[0]
  if (!from) return null
  // 目标单位：句子里第二个同量纲的单位；没写就用默认搭档（公里↔英里、斤↔公斤……）
  const to = found.find((u, i) => i > 0 && u.dim === from.dim && u !== from) || UNITS.find((u) => u.label === from.pair && u.dim === from.dim)
  if (!to) return null
  // 温度：先转到摄氏再转目标；其他：乘到基本单位再除
  const out = from.dim === 'temp' ? to.from!(from.to!(v)) : (v * from.k!) / to.k!
  const r = Math.abs(out) >= 100 ? out.toFixed(1) : Math.abs(out) >= 1 ? out.toFixed(2) : out.toPrecision(3)
  return { v, from: from.label, to: to.label, out: +r, formula: from.dim === 'temp' ? (from.label === '华氏度' ? '(°F − 32) × 5/9' : '°C × 9/5 + 32') : `1 ${from.label} = ${+(from.k! / to.k!).toPrecision(6)} ${to.label}` }
}

// 小型四则运算解析器（不用 eval）
function evalExpr(src: string): number | null {
  const s = src.replace(/\s+/g, '')
  let i = 0
  const peek = () => s[i]
  function num(): number {
    if (peek() === '(') { i++; const v = add(); if (peek() === ')') i++; return v }
    if (peek() === '-') { i++; return -num() }
    const m = s.slice(i).match(/^\d+(\.\d+)?/)
    if (!m) throw new Error('bad')
    i += m[0].length
    let v = parseFloat(m[0])
    if (peek() === '%') { i++; v /= 100 }
    return v
  }
  function mul(): number { let v = num(); while (peek() === '*' || peek() === '/') { const op = s[i++]; const r = num(); v = op === '*' ? v * r : v / r } return v }
  function add(): number { let v = mul(); while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = mul(); v = op === '+' ? v + r : v - r } return v }
  try { const v = add(); return i === s.length && isFinite(v) ? v : null } catch { return null }
}
const fmtNum = (n: number) => (Number.isInteger(n) ? n.toLocaleString('zh-CN') : (+n.toFixed(4)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }))
export function parseCalc(text: string) {
  const t = text.replace(/，/g, ',')
  let m = t.match(new RegExp(`${NUM}\\s*的\\s*(?:百分之\\s*${NUM}|${NUM}\\s*%)`))
  if (m) { const base = toNum(m[1]), p = toNum(m[2] ?? m[3]); return { expr: `${fmtNum(base)} × ${p}%`, result: fmtNum(base * p / 100) } }
  m = t.match(new RegExp(`${NUM}\\s*%\\s*(?:的|of)\\s*${NUM}`, 'i'))
  if (m) { const p = toNum(m[1]), base = toNum(m[2]); return { expr: `${fmtNum(base)} × ${p}%`, result: fmtNum(base * p / 100) } }
  m = t.match(new RegExp(`${NUM}\\s*(?:元|块)?\\s*打\\s*([零一二三四五六七八九\\d]{1,2})\\s*折`))
  if (m) {
    const base = toNum(m[1])
    const digits = [...m[2]].map((c) => (c in D ? D[c] : +c)).join('')
    const rate = digits.length === 1 ? +digits / 10 : +digits / 100
    return { expr: `${fmtNum(base)} × ${rate}`, result: fmtNum(base * rate) }
  }
  const e = t.replace(/乘以|乘/g, '*').replace(/除以/g, '/').replace(/加上?/g, '+').replace(/减去?/g, '-').replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/（/g, '(').replace(/）/g, ')')
  const em = e.match(/[\d.()+\-*/%\s]{3,}/g)?.sort((a, b) => b.length - a.length)[0]
  if (em && /[+\-*/]/.test(em)) {
    const v = evalExpr(em)
    if (v !== null) return { expr: em.trim().replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\s+/g, ' '), result: fmtNum(v) }
  }
  return null
}

export function parsePoll(text: string) {
  const q = text.replace(/[?？。!！]+$/, '').replace(/^(投票|大家投个票|来投票)[:：]?/, '')
  const parts = q.split(/还是|或者|、|，|,|\bor\b|\s+vs\s+/i).map(clean).filter(Boolean)
  if (parts.length < 2) return null
  let title = '大家选哪个？'
  const others = parts.slice(1)
  const len = Math.round(others.reduce((s, p) => s + p.length, 0) / others.length)
  if (parts[0].length > len + 1) { title = parts[0].slice(0, parts[0].length - len) + '……？'; parts[0] = parts[0].slice(-len) }
  return { title, options: parts.slice(0, 6) }
}

export function parseTravel(text: string) {
  const w = parseWhen(text)
  const transport = /飞机|航班|机票|飞往/.test(text) ? '飞机' : /高铁|火车|铁路/.test(text) ? '火车 / 高铁' : /公交|大巴|巴士/.test(text) ? '公交 / 巴士' : /自驾|开车|汽车/.test(text) ? '自驾' : '待定'
  const tripType = /出差|商务|客户|工作/.test(text) ? '商务' : /旅行|旅游|度假|玩|探亲/.test(text) ? '休闲' : '未说明'
  const destination = clean(text.match(/(?:去|到|前往|飞往|抵达)([^，,。！？?\s]{1,12}?)(?=玩|出差|旅行|旅游|度假|住|停留|$)/)?.[1] || '') || '目的地待定'
  const duration = text.match(new RegExp(`${NUM}\\s*(天|晚)`))
  const title = `${destination}${tripType === '商务' ? '出差' : '行程'}`
  return { title, destination, when: w.date ? fmtDate(w.date, w.hasTime) : '日期待定', transport, tripType, duration: duration ? `${toNum(duration[1])} ${duration[2]}` : '时长待定' }
}

export function parseContact(text: string) {
  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || ''
  const phone = text.match(/(?:\+?\d[\d\s-]{7,}\d)/)?.[0]?.replace(/[\s-]/g, '') || ''
  const name = clean(text.replace(/(?:保存|新增|添加|联系人|电话|手机|邮箱|电子邮件|号码|：|:)/g, ' ').replace(email, ' ').replace(phone, ' ').replace(/[，,。]/g, ' ')) || '新联系人'
  return { name, phone, email }
}

export function parseLink(text: string) {
  const url = text.match(/(?:https?:\/\/|www\.)[^\s，,。！？?]+/i)?.[0] || ''
  const title = clean(text.replace(/https?:\/\//i, '').replace(url, ' ').replace(/(?:收藏|保存|记下|这个|链接|网址|网页|链接到)/g, ' ')) || (url ? new URL(url.startsWith('www.') ? `https://${url}` : url).hostname : '新链接')
  return { title, url: url ? (url.startsWith('www.') ? `https://${url}` : url) : '' }
}

const CITY_ZONES: Record<string, { label: string; zone: string }> = {
  北京: { label: '北京', zone: 'Asia/Shanghai' }, 上海: { label: '上海', zone: 'Asia/Shanghai' }, 深圳: { label: '深圳', zone: 'Asia/Shanghai' }, 香港: { label: '香港', zone: 'Asia/Hong_Kong' }, 台北: { label: '台北', zone: 'Asia/Taipei' },
  东京: { label: '东京', zone: 'Asia/Tokyo' }, 首尔: { label: '首尔', zone: 'Asia/Seoul' }, 新加坡: { label: '新加坡', zone: 'Asia/Singapore' }, 曼谷: { label: '曼谷', zone: 'Asia/Bangkok' },
  伦敦: { label: '伦敦', zone: 'Europe/London' }, 巴黎: { label: '巴黎', zone: 'Europe/Paris' }, 柏林: { label: '柏林', zone: 'Europe/Berlin' },
  纽约: { label: '纽约', zone: 'America/New_York' }, 洛杉矶: { label: '洛杉矶', zone: 'America/Los_Angeles' }, 旧金山: { label: '旧金山', zone: 'America/Los_Angeles' }, 多伦多: { label: '多伦多', zone: 'America/Toronto' }, 悉尼: { label: '悉尼', zone: 'Australia/Sydney' },
}
function zonedParts(date: Date, zone: string) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map((p) => [p.type, p.value]))
}
function zoneOffset(date: Date, zone: string) {
  const p = zonedParts(date, zone)
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(date.getTime() / 60000) * 60000
}
function wallTimeInZone(y: number, m: number, d: number, h: number, min: number, zone: string) {
  const wall = Date.UTC(y, m - 1, d, h, min)
  let guess = new Date(wall)
  for (let i = 0; i < 3; i++) guess = new Date(wall - zoneOffset(guess, zone))
  return guess
}
const clockFmt = (date: Date, zone: string) => new Intl.DateTimeFormat('zh-CN', { timeZone: zone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', month: 'numeric', day: 'numeric' }).format(date)
export function parseTimezone(text: string, now = new Date()) {
  const matches = Object.entries(CITY_ZONES).flatMap(([name, info]) => [...text.matchAll(new RegExp(name, 'g'))].map((m) => ({ name, info, at: m.index ?? 0 }))).sort((a, b) => a.at - b.at)
  const from = matches[0] || { name: '北京', info: CITY_ZONES.北京, at: 0 }
  const to = matches[1] || { name: '伦敦', info: CITY_ZONES.伦敦, at: 0 }
  const time = text.match(/(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上)?\s*(\d{1,2}|[一二两三四五六七八九十]+)\s*(?:点|时)(?:\s*(半|\d{1,2}分?))?/) 
  let instant = now
  if (time) {
    let hour = toNum(time[2]), minute = time[3] === '半' ? 30 : time[3] ? toNum(time[3].replace(/分$/, '')) : 0
    if (time[1] && /下午|傍晚|晚上/.test(time[1]) && hour < 12) hour += 12
    if (time[1] === '中午' && hour < 11) hour += 12
    const p = zonedParts(now, from.info.zone)
    instant = wallTimeInZone(+p.year, +p.month, +p.day, hour, minute, from.info.zone)
  }
  return { from: from.name, to: to.name, sourceTime: clockFmt(instant, from.info.zone), targetTime: clockFmt(instant, to.info.zone), timeZone: to.info.zone, hasExplicitTime: !!time }
}

export function parseGoal(text: string) {
  const values = [...text.matchAll(new RegExp(NUM, 'g'))].map((m) => toNum(m[1]))
  const current = values[0] ?? 0
  const target = values[1] ?? 0
  const unit = text.match(/本书|本|页|公里|千米|元|块|次|个/)?.[0] || '项'
  const label = clean(text.replace(/(?:我|已经|已|目前|目前已|读完|读了|完成|存了|已存|目标是?|计划|想要|达到|本书|本|页|公里|千米|元|块|次|个|\d+(?:\.\d+)?)/g, ' ')) || (unit === '元' || unit === '块' ? '储蓄目标' : '进度目标')
  return { label, current, target, unit, percent: target ? Math.min(100, Math.round((current / target) * 100)) : 0, remaining: Math.max(0, target - current) }
}

// 农历节日按年份写死（只演示 2026–2028）
const LUNAR: Record<string, string[]> = {
  春节: ['2026-02-17', '2027-02-06', '2028-01-26'], 除夕: ['2026-02-16', '2027-02-05', '2028-01-25'],
  端午: ['2026-06-19', '2027-06-09', '2028-05-28'], 中秋: ['2026-09-25', '2027-09-15', '2028-10-03'], 元宵: ['2026-03-03', '2027-02-20', '2028-02-09'],
}
const SOLAR: Record<string, [number, number]> = { 元旦: [1, 1], 情人节: [2, 14], 劳动节: [5, 1], 五一: [5, 1], 国庆: [10, 1], 十一: [10, 1], 双十一: [11, 11], 圣诞: [12, 25], 平安夜: [12, 24], 儿童节: [6, 1], 七夕: [8, 19] }
export function parseCountdown(text: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let name = '', target: Date | null = null
  for (const [k, list] of Object.entries(LUNAR)) if (text.includes(k)) { name = k; target = list.map((s) => new Date(s + 'T00:00:00')).find((d) => d >= today) ?? null }
  if (!target) for (const [k, [m, d]] of Object.entries(SOLAR)) if (text.includes(k)) { name = k; target = new Date(today.getFullYear(), m - 1, d); if (target < today) target.setFullYear(target.getFullYear() + 1) }
  if (!target) {
    const md = text.match(new RegExp(`${NUM}月${NUM}[日号]?`))
    if (md) { target = new Date(today.getFullYear(), toNum(md[1]) - 1, toNum(md[2])); if (target < today) target.setFullYear(target.getFullYear() + 1); name = clean(text.replace(md[0], '').replace(/距离|距|到|还有|几天|多少天|倒数日|[?？]/g, '')) || md[0] }
  }
  if (!target) return null
  const days = Math.round((target.getTime() - today.getTime()) / 86400000)
  return { name, date: fmtDate(target, false) + ` · ${target.getFullYear()}`, days }
}

export function parseRandom(text: string) {
  const dice = text.match(new RegExp(`(?:掷|扔|摇|投)?\\s*${NUM}?\\s*个?骰子`)) || text.match(/(\d+)d(\d+)/i)
  if (dice) {
    if (/d/i.test(dice[0]) && dice[2]) return { kind: 'dice' as const, n: Math.min(+dice[1], 6), sides: +dice[2] }
    return { kind: 'dice' as const, n: Math.min(dice[1] ? toNum(dice[1]) : 1, 6), sides: 6 }
  }
  if (/硬币|正反面/.test(text)) return { kind: 'coin' as const }
  const range = text.match(new RegExp(`${NUM}\\s*(?:到|-|~|至)\\s*${NUM}`))
  if (range) return { kind: 'range' as const, lo: toNum(range[1]), hi: toNum(range[2]) }
  const pick = text.match(/(?:从|在)(.+?)(?:里|中|之间)/) || text.match(/(?:随机选|帮我选|抽一个|选一个)[一个]*[:：]?(.+)/)
  if (pick) {
    const options = pick[1].split(/[、，,和或\s]|还是/).map(clean).filter(Boolean)
    if (options.length >= 2) return { kind: 'pick' as const, options }
  }
  return { kind: 'dice' as const, n: 1, sides: 6 }
}
