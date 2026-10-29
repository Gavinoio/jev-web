# Jev 分享会演讲站（Slidev）

## 启动

```bash
npm install            # 首次（需要网络）
npm run dev            # http://localhost:3030
```

- **只开一个 `npm run dev`**：旧窗口没关时，旧进程会占着 3030 端口，新代码可能不生效。
- 全屏 `F` · 总览 `O` · 演讲者视图 `http://localhost:3030/presenter`（备注、计时只有你看到）
- 共 32 页，四个主要现场 Demo：第 10 页（四种题型，含框选 Box）/ 第 15 页（工单分流）/ 第 18 页（100 条并行分类）/ 第 29 页（会变形的输入框）。输入即判组件保留作备选，需要单独接入页面才能展示
- 演示全部使用浏览器内的确定性离线模拟，不调用 Jev、无需 Key，也不产生 API 费用。概率、把握度、框坐标均为演示数据，不是模型测量结果。
- 仅支持预设材料及原始题目、预设图片及目标；自定义内容或修改题目会明确提示不支持。Shift 支持预设示例，卡片内日期等仍按本地时间解析。
- 批量答案直接来自预设标签，一致率不代表模型准确率；模拟结果不包含真实 token 用量或网络延迟。
- 点击页面里的图片可放大，再点或按 Esc 关闭

## 导出 PDF（会后分发 / 断网备份）

```bash
npx playwright-chromium install chromium   # 首次，需要下载浏览器
npm run export
```

## 文件

- `slides.md` 幻灯片（32 页，每页 `<!-- -->` 里是演讲者备注）
- `speech.md` 完整演讲稿 + 数字速查表 + Q&A（自己看），页码与幻灯片一一对应
- `components/` Demo 与示意图组件，`styles/index.css` 深色科技主题
- `utils/shift.ts` 压轴 Demo 的题目、状态机和中文解析器（日期、金额、单位、算式……）；思路来自 [anishfn/shapeshift](https://github.com/anishfn/shapeshift)（MIT）
- `utils/jev.ts` 浏览器内的离线模拟；`functions/api/` 为保留的独立线上接口，演示不会调用它们

## PPT（.pptx）

```bash
NODE_PATH=./node_modules node pptx/build.cjs   # 生成 Jev分享会.pptx（按讲稿页码一一对应，备注取自 speech.md）
```

- 现有 PPT 是旧版 42 页，尚未与 32 页网页同步；Demo 页是"步骤 + 真实实测结果"，现场请切到网页版演讲站
- 页面里的图表、对比条都是原生形状，可在 PowerPoint / WPS 里直接改
