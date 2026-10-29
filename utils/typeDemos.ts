// 「四种题型」演示的数据：是非 / 单选 / 打分 各一组题 + 示例材料 + 参考答案；框选（box）用图片 + 目标描述
import { demoTicketExamples, ticketQuestions, type Expected } from './scenarios.ts'

export interface TypeEx { label: string; state: string; expected?: Expected; note?: string }
export interface TypeTab {
  id: 'noul' | 'choice' | 'score'
  name: string
  intro: string
  questions: Record<string, any>
  examples: TypeEx[]
}

export const typeTabs: TypeTab[] = [
  {
    id: 'noul',
    name: '是非题 Noul',
    intro: '问一个"是不是"，返回"是"的概率（0–1）',
    questions: { is_urgent: ticketQuestions.is_urgent },
    examples: [
      { ...demoTicketExamples.clear, expected: { is_urgent: true } },
      { label: '扣了两次款', state: '我的月订阅被扣了两次款。可以帮我核对这两笔付款吗？', expected: { is_urgent: false } },
      { label: '随便问问', state: '请问你们的套餐下个月会有活动吗？', expected: { is_urgent: false }, note: '看点：不急的事，概率很低' },
    ],
  },
  {
    id: 'choice',
    name: '单选题 Choice',
    intro: '从你给的选项里选一个，并给每个选项的概率和把握度',
    questions: { department: ticketQuestions.department },
    examples: [
      { label: '扣了两次款', state: '我的月订阅被扣了两次款。可以帮我核对这两笔付款吗？', expected: { department: 'billing' } },
      { ...demoTicketExamples.clear, expected: { department: 'billing' } },
      { label: '店铺几点关门', state: '请问你们的店铺几点关门？', expected: { department: 'other' }, note: '看点：有 other 这个出口，它就不用硬选' },
    ],
  },
  {
    id: 'score',
    name: '打分题 Score',
    intro: '在一把有顺序的"尺子"上打分，分数可以是小数',
    questions: { frustration: ticketQuestions.frustration },
    examples: [
      { label: '冷静', state: '我的月订阅被扣了两次款。可以帮我核对这两笔付款吗？', expected: { frustration: 0 } },
      { label: '不满但礼貌', state: '这已经是第二次出问题了，希望你们能认真处理一下，谢谢。', expected: { frustration: 1 } },
      { label: '很生气', state: '你们这个产品太垃圾了，退款流程还要等三天，真是浪费时间！', expected: { frustration: 2 } },
      { ...demoTicketExamples.clear, expected: { frustration: 2 } },
    ],
  },
]

export const typeDemoExamples = typeTabs.map((tab) => tab.examples.find((example) => example.label === demoTicketExamples.clear.label)!)

export interface BoxImage { id: string; name: string; src: string; targets: { label: string; target: string; note?: string }[] }

export const boxImages: BoxImage[] = [
  {
    id: 'agent',
    name: '网页界面示意图',
    src: '/img/box/agent.jpg',
    targets: [
      { label: '搜索栏', target: '网页顶部的搜索栏' },
      { label: '7 号区块', target: '标有数字 7 的区块' },
      { label: '拿清单的机器人', target: '手里拿着编号清单的机器人' },
    ],
  },
]
