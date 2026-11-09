# Jev 分享会演讲站

网页版演讲幻灯片，Vite + Vue。

## 启动

```bash
npm install            # 首次
npm run dev            # 开发预览，自动打开 http://localhost:5180
npm run build          # 打包到 dist/，部署时上传这个目录
npm run preview        # 本地预览打包结果
npm test               # 输入框演示的离线模拟与解析器单元测试
```

## 部署

推送到 GitHub `main` 分支后，Cloudflare Pages 项目 `jev-talk` 自动执行 `npm run build` 并发布 `dist/`，几十秒后 https://jev.huangguanhao.com 就是新版。不需要手动部署。

## 两种模式

同一份页面按屏幕宽度自动切换：

- **演讲模式**（宽度 > 1024px）：一屏一页，画布按窗口等比缩放。方向键 / PageUp / PageDown / 空格翻页，Home / End 首尾页，`F` 全屏，页码在地址栏 `#/3`。
- **阅读模式**（手机、平板竖屏 ≤ 1024px）：27 页连成一条竖向长页面，按屏幕宽度自然排版，顶部有阅读进度条。
- 地址加 `?mode=present` 或 `?mode=read` 可强制指定模式，方便在电脑上看手机效果。
- 点击页面里的任意图片可放大（价格页的小 logo 除外），再点或按 Esc 关闭。

## 文件

- `src/slides/S01.vue` … `S28.vue`：每页一个文件，顺序在 `src/slides/index.ts`。改内容直接改对应页面；新增页面就新建文件并加到 `index.ts`。
- `src/App.vue`：翻页、缩放、阅读模式、图片放大。
- `src/styles/`：`theme.css` 页面主题（深色网格背景、各页版式）；`typography.css`、`utils.css`、`reset.css` 基础排版；`base.css` 演讲模式与手机阅读模式的外壳样式。
- `components/`：Demo 与示意图组件，全局注册，页面里直接用。
- `utils/shift.ts`：压轴 Demo 的题目、状态机和中文解析器（日期、金额、单位、算式……）；思路来自 [anishfn/shapeshift](https://github.com/anishfn/shapeshift)（MIT，许可证在 `licenses/`）。
- `utils/jev.ts`：第 25 页输入框演示的浏览器内离线模拟。
- `components/ShotTabs.vue`：第 10、19 页的截图切换组件；截图在 `public/img/playground/`。
- `public/`：图片、视频、标签页图标（取自 typesafe.ai）。`public/img/judgment-flow.svg`、`validation-loop.svg`、`intent-to-card.svg`、`news-filter.svg` 为本项目自绘的流程示意，不是模型测量结果。

## 内容说明

- 共 27 页，6 个章节：
  1. AI 基础（第 3–7 页）：大模型、Token、Prompt、Agent / Harness、MCP / Skill。
  2. 认识 Jev（第 8–10 页）：定位、四种题型、Playground 实测 1。
  3. 动手调用（第 11–15 页）：建 Key、一次请求、三页写题规则。
  4. 为什么选 Jev（第 16–19 页）：快、省、可控，以及 Playground 实测 2。
  5. 用在哪里（第 20–24 页）：三个外部案例、客服流程选型、8 个应用方向。
  6. 演示与总结（第 25–26 页）：会变形的输入框、带走三句话；第 27 页致谢。
- 第 10 页（四种输出，含实验性 Box）、第 19 页（明确 / 含糊两条工单的分流）为官方 Playground 真实调用截图，可切换题型和 JSON 视图。
- 第 17 页为多家模型 API 费用对比（`components/PriceCompare.vue`，价格数据在文件顶部，logo 在 `public/img/logos/`）。
- 第 25 页输入框使用浏览器内的离线模拟，不调用 Jev、无需 Key；只支持预设示例，自定义内容按本地规则解析。
- 价格和外部案例数字沿用已有资料并保留来源，未重新核验原文，不应作为当前报价或通用性能承诺。
