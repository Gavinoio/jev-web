# Jev 分享会演讲站（Slidev）

## 启动

```bash
npm install            # 首次
copy .env.example .env # 然后在 .env 里填 TYPESAFE_API_KEY（别提交、别截图）
npm run dev            # http://localhost:3030
```

- **只开一个 `npm run dev`**：旧窗口没关时，旧进程会占着 3030 端口，新代码不生效（Demo 会报"本地接口不存在，请重启"）
- 全屏 `F` · 总览 `O` · 演讲者视图 `http://localhost:3030/presenter`（备注、计时只有你看到）
- 共 32 页，四个主要现场 Demo：第 10 页（四种题型，含框选 Box）/ 第 15 页（工单分流）/ 第 18 页（100 条并行分类）/ 第 29 页（会变形的输入框）。输入即判组件保留作备选，需要单独接入页面才能展示
- 主要 Demo 都调用 Jev；未配置 Key、网络异常或调用失败时显示错误，可检查配置后重试。可在 TypeSafe 控制台 Usage 页核对用量。
- 点击页面里的图片可放大，再点或按 Esc 关闭

## 网络稳定性（本机走代理时）

`vite.config.ts` 里的本地中间件做了两件事，专门对付"偶尔卡几十秒"：

- **对冲重试**：请求 1.5 秒没回（带图 3.5 秒），就并行再发一次，谁先成功用谁，最多 3 次；每次有超时
- **连接保温**：有 Key 时每 2.5 秒发一个不带 Key 的 `GET /`（返回 404，不计费），防止代理掐掉闲置连接；30 分钟没人用 Demo 就停

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
- `vite.config.ts` 本地中间件：`/api/jev`、`/api/jev-box` 代调 Jev（Key 只在服务端）

## PPT（.pptx）

```bash
NODE_PATH=./node_modules node pptx/build.cjs   # 生成 Jev分享会.pptx（按讲稿页码一一对应，备注取自 speech.md）
```

- 现有 PPT 是旧版 42 页，尚未与 32 页网页同步；Demo 页是"步骤 + 真实实测结果"，现场请切到网页版演讲站
- 页面里的图表、对比条都是原生形状，可在 PowerPoint / WPS 里直接改
