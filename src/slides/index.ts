import type { Component } from 'vue'
import S01 from './S01.vue'
import S02 from './S02.vue'
import S03 from './S03.vue'
import S04 from './S04.vue'
import S05 from './S05.vue'
import S06 from './S06.vue'
import S07 from './S07.vue'
import S08 from './S08.vue'
import S09 from './S09.vue'
import S10 from './S10.vue'
import S11 from './S11.vue'
import S12 from './S12.vue'
import S13 from './S13.vue'
import S14 from './S14.vue'
import S15 from './S15.vue'
import S16 from './S16.vue'
import S17 from './S17.vue'
import S18 from './S18.vue'
import S19 from './S19.vue'
import S20 from './S20.vue'
import S21 from './S21.vue'
import S22 from './S22.vue'
import S23 from './S23.vue'
import S24 from './S24.vue'
import S25 from './S25.vue'
import S26 from './S26.vue'
import S27 from './S27.vue'

// 页面顺序就是这个数组的顺序。每页是一个 .vue 文件，根元素为 <section class="slide ...">。
export const slides: { title: string; component: Component }[] = [
  { title: "一个不写字的 AI", component: S01 },
  { title: "今天的路线", component: S02 },
  { title: "大模型的本质：猜下一个词", component: S03 },
  { title: "Token 与上下文：模型按片段读、按片段计费", component: S04 },
  { title: "Prompt 与幻觉：问法决定答案，答案未必是真的", component: S05 },
  { title: "Agent（智能体）：大模型 + Harness", component: S06 },
  { title: "MCP 与 Skill：给 Agent 接工具、教方法", component: S07 },
  { title: "Jev 是什么：专门做判断的 AI", component: S08 },
  { title: "四种题型：是非、单选、打分、图像", component: S09 },
  { title: "真实调用 1：四种题型的真实输出", component: S10 },
  { title: "怎么上手：从 Key 到第一次请求", component: S11 },
  { title: "一次调用：发请求、拿响应、读结果", component: S12 },
  { title: "写题规则 ①：哪些固定，哪些自己定义", component: S13 },
  { title: "写题规则 ②：题型决定 criteria 和返回值", component: S14 },
  { title: "写题规则 ③：把模糊边界写清楚", component: S15 },
  { title: "为什么快：直接给答案，不用逐字生成", component: S16 },
  { title: "为什么省：100 万次判断，各家要花多少", component: S17 },
  { title: "为什么可控：按把握度安排复核", component: S18 },
  { title: "真实调用 2：两条工单，按把握度分流", component: S19 },
  { title: "案例 1：Browser Use 浏览器 Agent", component: S20 },
  { title: "案例 2：批量筛新闻，为品牌找相关话题", component: S21 },
  { title: "案例 3：招聘初筛，先筛选再深入评估", component: S22 },
  { title: "怎么选：一条客服流程，哪些步骤交给 Jev", component: S23 },
  { title: "应用方向：8 个可以先试的场景", component: S24 },
  { title: "交互演示：会变形的输入框", component: S25 },
  { title: "带走三句话：模型判断，代码计算，用户确认", component: S26 },
  { title: "谢谢大家", component: S27 },
]
