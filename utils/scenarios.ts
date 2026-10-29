// 演示用的"场景"：题目（questions）+ 示例材料（state）+ 参考答案（人工标注）
export type Expected = Record<string, boolean | string | number | undefined>
export interface Example {
  label: string
  state: string
  expected?: Expected // 参考答案；没有就是"没有标准答案"
  note?: string
}
export interface Scenario {
  id: string
  name: string
  intro: string
  questions: Record<string, any>
  examples: Example[]
  main?: string // 用于"按把握分流"的那道单选题
}

export const ticketQuestions = {
  is_urgent: { type: 'noul', instructions: '这条消息是否要求必须马上处理？' },
  department: {
    type: 'choice',
    instructions: '应该由哪个团队处理？',
    criteria: { billing: '付款、扣费、退款、对账', technical: '故障、连不上、集成报错', sales: '价格、套餐、新签约', other: '以上都不是' },
  },
  frustration: { type: 'score', instructions: '客户有多沮丧？', criteria: ['冷静陈述', '不满但礼貌', '非常愤怒'] },
}

export const refundQuestions = {
  request_type: { type: 'choice', instructions: '根据 message，判断用户的主要诉求。', criteria: { refund: '要求退款', repair: '要求维修', other: '其他诉求' } },
  wants_refund: { type: 'noul', instructions: 'message 中的用户是否明确要求退款？' },
}

export const vipQuestions = {
  wants_refund: { type: 'noul', instructions: '用户是否明确要求退款？' },
  churn_risk: { type: 'score', instructions: '这位用户流失（不再购买）的风险有多高？综合他说的话和 customer 信息判断。', criteria: ['低', '中', '高'] },
  route: {
    type: 'choice',
    instructions: '这条退款请求应走哪个处理渠道？',
    criteria: { vip_agent: 'VIP 或高价值客户，转专属客服优先处理', auto_refund: '普通客户的简单退款，走自动退款流程', human: '情况复杂或信息不足，转人工客服' },
  },
}

export const moderateQuestions = {
  harassment: { type: 'noul', instructions: '这条内容是否在辱骂或威胁他人？' },
  scam: { type: 'noul', instructions: '这条内容是否包含诈骗、钓鱼或要求转账？' },
  action: {
    type: 'choice',
    instructions: '建议的处理方式？',
    criteria: { allow: '正常内容，放行', hide: '辱骂等违规内容，折叠隐藏', escalate: '疑似诈骗，交人工' },
  },
}

export const batchQuestions = {
  category: {
    type: 'choice',
    instructions: '这条用户反馈属于哪一类？',
    criteria: { praise: '表扬、满意', bug: '故障、报错、功能异常', feature: '功能建议、新需求', complaint: '对服务、价格、收费的不满' },
  },
}

// 客户信息压成一行，材料框里一眼看全；真实系统里这些字段由你的代码查出来再放进材料
const vipState = (message: string, level: string, orders: number, spent: number) =>
  `{
  "message": ${JSON.stringify(message)},
  "customer": ${JSON.stringify({ level, orders_last_year: orders, total_spent_cny: spent }).replace(/,/g, ', ').replace(/:/g, ': ')}
}`

export const demoTicketExamples = {
  clear: { label: '礼包扣款', state: '买礼包扣了两次钱，道具还没到账！活动马上结束了，赶紧处理，太让人失望了！', expected: { is_urgent: true, department: 'billing', frustration: 2 }, note: '预设演示：账单诉求明确，同时包含时间压力与不满情绪' },
  ambiguous: { label: '礼包异常', state: '礼包好像不对，价格变了，东西也找不到，帮我看看。', note: '预设演示：涉及价格、内容或功能，模拟低置信度并建议人工复核' },
}

export const scenarios: Scenario[] = [
  {
    id: 'ticket',
    name: '工单分流',
    intro: '客服消息 → 紧急吗 / 归哪个部门 / 多沮丧',
    questions: ticketQuestions,
    main: 'department',
    examples: [
      { label: '扣了两次款', state: '我的月订阅被扣了两次款。可以帮我核对这两笔付款吗？', expected: { is_urgent: false, department: 'billing', frustration: 0 }, note: '看点：很笃定 → 自动分流' },
      demoTicketExamples.clear,
      { label: '骂产品+退款慢', state: '你们这个产品太垃圾了，退款流程还要等三天，真是浪费时间。', expected: { is_urgent: false, department: 'billing', frustration: 2 }, note: '看点：部门明确，但情绪最高档 → 该有人出面' },
      demoTicketExamples.ambiguous,
      { label: '帮我看看这个', state: '帮我看看这个。', note: '没有标准答案：材料太短，它也会硬选一个，而且可能很自信 → 要留"其他"出口，要先检查材料够不够' },
    ],
  },
  {
    id: 'refund',
    name: '退款诉求',
    intro: '与官方控制台截图一致：两道题（单选 + 是非）',
    questions: refundQuestions,
    main: 'request_type',
    examples: [
      { label: '要退款', state: '我买的耳机用了两天就坏了，请帮我退款。', expected: { request_type: 'refund', wants_refund: true } },
      { label: '要维修', state: '耳机坏了，能帮我修一下吗？', expected: { request_type: 'repair', wants_refund: false } },
      { label: '无关问题', state: '请问你们的店铺几点关门？', expected: { request_type: 'other', wants_refund: false }, note: '看点：选项里有 other，它就不用硬选' },
      { label: '含糊', state: '东西坏了，你们看着办吧。', note: '没有标准答案：没说要退还是要修 → 把握度明显下降' },
    ],
  },
  {
    id: 'vip',
    name: 'VIP 路由',
    intro: '材料里放客户信息（JSON），让 Jev 综合判断走哪个渠道',
    questions: vipQuestions,
    main: 'route',
    examples: [
      { label: 'VIP · 很生气', state: vipState('这是我这个月第二次收到坏的耳机了，我要退款，再这样我就不用你们家了。', 'VIP', 18, 12600), expected: { wants_refund: true, route: 'vip_agent' }, note: '看点：VIP + 要退款 + 有流失风险 → 专属客服' },
      { label: '普通 · 简单退款', state: vipState('耳机用了两天就坏了，请帮我退款。', '普通', 1, 199), expected: { wants_refund: true, route: 'auto_refund' }, note: '看点：同一句话，客户等级不同 → 走不同渠道' },
      { label: 'VIP · 同一句话', state: vipState('耳机用了两天就坏了，请帮我退款。', 'VIP', 18, 12600), expected: { wants_refund: true, route: 'vip_agent' }, note: '看点：和上一条材料的"话"完全一样，只有客户信息不同' },
      { label: '普通 · 含糊', state: vipState('东西有点问题，你们看着办吧。', '普通', 2, 450), expected: { wants_refund: false, route: 'human' }, note: '看点：信息不足 → 转人工' },
    ],
  },
]

export const moderateExamples: Example[] = [
  { label: '正常', state: '今天这个活动办得真不错，下次还来！', expected: { harassment: false, scam: false, action: 'allow' } },
  { label: '辱骂', state: '你这个人真是个傻子，别让我再看到你', expected: { harassment: true, scam: false, action: 'hide' } },
  { label: '诈骗', state: '恭喜中奖！加微信 xxx 领取，先转账 100 元手续费', expected: { harassment: false, scam: true, action: 'escalate' } },
  { label: '反讽', state: '你这个方案真是太“有想法”了', note: '没有标准答案：反讽很难判，概率会停在中间' },
]

// 100 条互不重复的用户反馈（每类 24 条 + 4 条"先夸后骂"的转折句，看它能不能抓住"但是"后面的重点）
const praise = [
  '这个功能太好用了，节省了我一半时间', '价格比竞品便宜，性价比高', '新版界面清爽多了，找东西快很多', '客服小姐姐回复超快，问题十分钟就解决了',
  '用了三个月，一次都没崩过，很稳', '导出的报表格式很专业，老板很满意', '新手引导做得很贴心，第一次用就上手了', '同步速度比以前快太多了',
  '这次更新的搜索终于好用了', '夜间模式做得很舒服，眼睛不累', '退款处理得很利索，好评', '文档写得清楚，照着做一次就成功',
  '快捷键设计得很顺手', '手机端和电脑端体验一致，很省心', '模板很丰富，省了很多设计时间', '加载速度明显变快了，点赞',
  '数据看板一目了然，开会直接投屏', '权限设置很细，安全感满满', '团队协作功能太方便了', '这个价格能有这么多功能，值',
  '提醒功能救了我好几次', '图表配色很好看', '升级以后电池也不怎么耗了', '你们的产品让我准时下班了', '整体体验很流畅，推荐给同事了',
]
const bug = [
  '登录页一直转圈，根本进不去', '导出 Excel 的时候中文全是乱码', '上传超过 10M 的文件就报错', '点保存没反应，内容全丢了',
  '安卓手机上按钮被键盘挡住了', '搜索结果分页点到第二页就空白', '消息通知重复推送了三遍', '日期选择器选不了 31 号',
  '切换账号后还显示上一个人的数据', '图片预览是黑屏', '打开设置页直接闪退', '时区不对，会议时间差了 8 小时',
  '复制粘贴表格格式全乱了', '验证码一直收不到', '支付成功了订单还显示未付款', '深色模式下有些字看不见',
  '筛选条件一多页面就卡死', '导入 CSV 后最后一行丢了', '语音输入识别完就自动清空', '二维码扫出来是个 404',
  '批量删除只删掉了第一条', '分享链接别人打不开', '图表的数字和明细对不上', '退出登录后返回键还能回到主页', 'iPad 上横屏布局错位',
]
const feature = [
  '能不能加一个暗色模式？', '希望支持批量导入', '能不能支持导出成 PDF？', '希望可以自定义快捷键',
  '建议加一个回收站，误删能找回', '能不能和企业微信打通？', '希望表格支持冻结首行', '可以加个定时发送吗',
  '建议增加多语言版本', '希望能按标签筛选', '能不能出个 Mac 客户端', '希望评论里能 @ 同事',
  '建议加一个操作日志', '能不能支持 Markdown', '希望能设置提醒的重复周期', '可以给仪表盘加个全屏模式吗',
  '建议支持手机号一键登录', '希望能批量修改状态', '能不能开放 API 给我们对接', '希望可以拖拽排序',
  '建议加个暂停订阅的选项', '能不能把常用功能放到首页', '希望导出时可以选字段', '可以支持离线使用吗', '建议加一个夜间免打扰',
]
const complaint = [
  '客服态度很差，等了三天没人理', '又扣费了，说好的免费试用呢', '价格一年涨了两次，太离谱了', '退款拖了两周还没到账',
  '会员权益缩水了，感觉被坑', '电话客服永远占线', '自动续费不提醒，一下扣了 699', '发票申请了一个月还没开',
  '客服只会复制粘贴模板回复', '取消订阅的入口藏得太深了', '同样的套餐新用户比老用户便宜', '承诺的上门服务放了我鸽子',
  '广告越来越多，付费了还有', '投诉了三次都石沉大海', '收费项目说明不清楚，结账才知道', '升级要求加钱，之前没说过',
  '售后推来推去没人负责', '赠送的额度突然被收回了', '工单显示已解决，问题根本没处理', '退订后还在继续扣钱',
  '在线客服是机器人，转人工要排一小时', '合同里的条款和销售说的不一样', '活动价说好保留一年，三个月就涨了', '账单明细看不懂，问了也没人解释', '充值后余额迟迟不到账',
]
const tricky: [string, string][] = [
  ['功能挺好用的，就是价格涨得有点狠', 'complaint'],
  ['界面很漂亮，但是导出一直报错', 'bug'],
  ['客服很耐心，可惜问题还是没解决', 'complaint'],
  ['希望修一下闪退，修好了我就续费', 'bug'],
]
const base: [string, string][] = [
  ...praise.slice(0, 24).map((t) => [t, 'praise'] as [string, string]),
  ...bug.slice(0, 24).map((t) => [t, 'bug'] as [string, string]),
  ...feature.slice(0, 24).map((t) => [t, 'feature'] as [string, string]),
  ...complaint.slice(0, 24).map((t) => [t, 'complaint'] as [string, string]),
]
// 交错排列：四类轮流出现，"最近完成"那一栏不会一片同类
const mixed = Array.from({ length: 24 }, (_, i) => [base[i], base[24 + i], base[48 + i], base[72 + i]]).flat().concat(tricky)
export const batchSamples = (n: number) => mixed.slice(0, n).map(([text, expected]) => ({ text, expected }))
