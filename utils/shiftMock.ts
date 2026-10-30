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
  const participant = /(?:和|跟|与|约)\s*[^\s,，。]{1,}/.test(text)
  let choice: IntentKey = 'none'
  let confidence = 0.9
  let alternatives: Record<string, number> | undefined

  if (note) choice = 'note'
  else if (reminder && text.replace(/提醒我|提醒一下|提醒|记得|别忘了?|[\s,，。!！]/g, '').length > 0) choice = 'reminder'
  else if (recurring && /健身|运动|跑步|读书|阅读|喝水|学习|练习|打卡|坚持|习惯|次/.test(text)) choice = 'habit'
  else if (/AA|均摊|平摊|分摊|分账|平分/i.test(text)) choice = 'split'
  else if (/花了|花费|付了|支出|消费|记账|买了.+(?:元|块)|[¥￥]\s*\d/.test(text)) choice = 'expense'
  else if (/骰子|硬币|随机|抽签|抽一个|帮我选/.test(text)) choice = 'random'
  else if (/(?:距离|距|还有|倒数日|倒计时).*(?:几天|多少天|天|春节|元旦|国庆|生日)|(?:春节|元旦|国庆|生日).*还有/.test(text)) choice = 'countdown'
  else if (/时区|当地时间|现在几点|对应.*几点|几点.*(?:北京|上海|东京|纽约|伦敦)|(?:北京|上海|东京|纽约|伦敦).*几点/.test(text)) choice = 'timezone'
  else if (/https?:\/\/|www\./i.test(text)) choice = 'link'
  else if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b1[3-9]\d{9}\b/i.test(text) || /(?:保存|添加|新增).*(?:联系人|电话|手机|邮箱)/.test(text)) choice = 'contact'
  else if (/目标|进度/.test(text) && /\d|[一二三四五六七八九十百千万]/.test(text)) choice = 'goal'
  else if (/投票|还是|或者|\s+vs\s+/i.test(text)) choice = 'poll'
  else if (/(?:倒计时|计时|番茄钟|专注|秒表|休息)/.test(text) && (parseDuration(text) > 0 || /^(?:请|帮我|设置|开始|开个|一个|\s)*(?:倒计时|计时器?|番茄钟|秒表)$/.test(text))) choice = 'timer'
  else if (/旅行|旅游|度假|出差|探亲|机票|航班|酒店|住宿|(?:坐|乘|搭).*(?:高铁|火车|飞机)|(?:去|到|前往).+玩/.test(text)) choice = 'travel'
  else if (/换算|换成|转换|等于多少|是多少|多少(?:公里|米|斤|克|磅|升|度)/.test(text) && parseConvert(text)) choice = 'convert'
  else if (shopping && list || /待办|清单/.test(text)) choice = 'todo'
  else if (event) choice = 'event'
  else if (parseColor(text)) choice = 'color'
  else if (parseCalc(text)) choice = 'calc'
  else if (when.hasDay || when.hasTime) {
    if (participant) {
      choice = 'event'
      confidence = 0.6
      alternatives = { event: 0.6, reminder: 0.2, none: 0.2 }
    } else if (when.hasTime) {
      choice = 'event'
      confidence = 0.45
      alternatives = { event: 0.45, reminder: 0.4, none: 0.15 }
    }
  }

  if (choice === 'none') confidence = 0.8
  const keys = Object.keys(shiftQuestions.intent.criteria)
  const probabilities = Object.fromEntries(keys.map((key) => [key, alternatives ? alternatives[key] ?? 0 : key === choice ? confidence : (1 - confidence) / (keys.length - 1)]))
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
