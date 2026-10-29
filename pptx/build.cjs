// 按定稿大纲 v4 生成 PPT：node pptx/build.js  →  Jev分享会.pptx
const fs = require('fs')
const path = require('path')
const pptxgen = require('pptxgenjs')
const { applyTheme } = require('C:/Users/Administrator/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/local-agent-mode-sessions/skills-plugin/9d219032-0861-4670-a1f2-ebfee073a57f/16f61fe8-7509-4e59-ab87-e06839f39938/skills/pptx/scripts/apply_theme.js')

const ROOT = path.resolve(__dirname, '..')
const IMG = (n) => path.join(ROOT, 'public', 'img', n)
const OUT = path.join(ROOT, 'Jev分享会.pptx')

// ---------- 主题：深色科技风（沿用参考站 WebGPU 范例） ----------
const SANS = 'Microsoft YaHei'
const MONO = 'Consolas'
const THEME = {
  name: 'Jev Dark Tech',
  headFontFace: SANS,
  bodyFontFace: SANS,
  colors: {
    dk1: 'E8EEF9', lt1: '070B14', // 本稿为深色底：background1=深色，text1=浅色
    dk2: '8DA2C0', lt2: '0F1C33', // text2=灰蓝，background2=卡片底
    accent1: '38BDF8', accent2: 'A78BFA', accent3: '34D399',
    accent4: 'F87171', accent5: 'FBBF24', accent6: '6F8399',
    hlink: '38BDF8', folHlink: 'A78BFA',
  },
}

const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE' // 13.33 x 7.5
pres.title = 'Jev：给程序做判断的模型'
pres.author = '分享人'
pres.theme = { headFontFace: SANS, bodyFontFace: SANS }
const C = pres.SchemeColor
const LINE = '1B2942'

const L = 0.6, W = 12.13

// ---------- 版式 ----------
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: '070B14' },
  slideNumber: { x: 12.3, y: 7.05, w: 0.6, h: 0.3, fontFace: MONO, fontSize: 10, color: '6F8399', align: 'right' },
  objects: [],
  slideNumber_: undefined,
})
pres.defineSlideMaster({ title: 'COVER', background: { color: '070B14' }, objects: [] })

// pptxgenjs 会在一个段落的每个 run 前都写一份 <a:pPr>（后面的还带 buNone），
// 段落里只应保留第一份，否则项目符号会被后面的覆盖，PowerPoint 也可能提示修复。
async function fixParagraphProps(file) {
  const JSZip = require('jszip')
  const zip = await JSZip.loadAsync(fs.readFileSync(file))
  const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
  for (const n of names) {
    let x = await zip.file(n).async('string')
    x = x.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (m, inner) => {
      let seen = false
      const cleaned = inner.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (pp) => {
        if (!seen) { seen = true; return pp }
        return ''
      })
      return '<a:p>' + cleaned + '</a:p>'
    })
    zip.file(n, x)
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

// ---------- 来自讲稿的备注 ----------
const speech = fs.readFileSync(path.join(ROOT, 'speech.md'), 'utf8')
const notes = {}
{
  const parts = speech.split(/^## 第 (\d+) 页 · .*$/m)
  for (let i = 1; i < parts.length; i += 2) {
    const n = Number(parts[i])
    let body = parts[i + 1].split(/\n---\s*\n/)[0]
    // 只取"口播稿"那一段（详细讲稿里还有背景、Q&A 等，放进备注会太长）
    const m = body.match(/\*\*③ 口播稿\*\*\n([\s\S]*?)(?=\n\*\*④|$)/) || body.match(/\*\*口播\*\*\n([\s\S]*?)(?=\n\*\*|$)/)
    if (m) body = m[1]
    body = body.replace(/\*\*/g, '').replace(/^> ?/gm, '').replace(/\*（?([^*]+?)）?\*/g, '（$1）').trim()
    notes[n] = body
  }
}

// ---------- 工具 ----------
const warns = []
function textW(str, pt) {
  let w = 0
  for (const ch of str) w += (/[\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F]/.test(ch) ? 1 : 0.52) * pt / 72
  return w
}
function lines(str, pt, boxW) {
  let n = 0
  for (const para of str.split('\n')) n += Math.max(1, Math.ceil(textW(para, pt) / Math.max(boxW, 0.1)))
  return n
}
function check(label, str, pt, w, h) {
  const need = lines(str, pt, w - 0.12) * pt * 1.3 / 72 + 0.08
  if (need > h + 0.02) warns.push(`${label}: need ${need.toFixed(2)}in > box ${h.toFixed(2)}in  [${str.slice(0, 24)}]`)
}

// "**粗体**" → runs
function rich(str, base = {}) {
  const out = []
  const parts = String(str).split(/(\*\*[^*]+\*\*)/)
  for (const p of parts) {
    if (!p) continue
    if (p.startsWith('**')) out.push({ text: p.slice(2, -2), options: { ...base, bold: true, color: C.text1 } })
    else out.push({ text: p, options: { ...base } })
  }
  return out
}
function plain(str) { return String(str).replace(/\*\*/g, '') }

function imgSize(file) {
  const b = fs.readFileSync(file)
  if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
  let i = 2
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue }
    const m = b[i + 1]
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }
    i += 2 + b.readUInt16BE(i + 2)
  }
  throw new Error('size ' + file)
}

// 在 (x,y,w,h) 内等比放入图片，水平居中，顶部对齐
function pic(s, name, x, y, w, h, { name: objectName, align = 'center' } = {}) {
  const f = IMG(name)
  const d = imgSize(f)
  const k = Math.min(w / d.w, h / d.h)
  const pw = d.w * k, ph = d.h * k
  const px = align === 'left' ? x : x + (w - pw) / 2
  s.addImage({ path: f, x: px, y, w: pw, h: ph, objectName: objectName || name, altText: name, rounding: false })
  s.addShape(pres.ShapeType.roundRect, { x: px, y, w: pw, h: ph, fill: { type: 'none' }, line: { color: LINE, width: 0.75 }, rectRadius: 0.06, objectName: name + '-frame' })
  return { x: px, y, w: pw, h: ph }
}

function title(s, t, eyebrow) {
  s.addText(t, { x: L, y: 0.38, w: W, h: 0.75, fontFace: SANS, fontSize: 30, bold: true, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: 'title', fit: 'none' })
  check('title', t, 30, W, 0.75)
  if (eyebrow) s.addText(eyebrow, { x: L, y: 1.12, w: W, h: 0.3, fontFace: MONO, fontSize: 11, color: C.accent1, margin: 0, charSpacing: 2, isTextBox: true, objectName: 'eyebrow' })
}

function card(s, x, y, w, h, o = {}) {
  const ac = o.accent || null
  const col = ac === 'cy' ? C.accent1 : ac === 'pu' ? C.accent2 : ac === 'gn' ? C.accent3 : ac === 'rd' ? C.accent4 : ac === 'am' ? C.accent5 : null
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, fill: { color: C.background2 }, line: { color: col || LINE, width: col ? 1 : 0.75 }, rectRadius: 0.1, objectName: 'card',
  })
  const runs = []
  const bs = o.bodySize || 16
  if (o.tag) runs.push({ text: o.tag, options: { fontFace: MONO, fontSize: 10, color: col || C.accent1, charSpacing: 1, breakLine: true, paraSpaceAfter: 3 } })
  if (o.title) runs.push({ text: plain(o.title), options: { fontSize: o.titleSize || 16, bold: true, color: C.text1, breakLine: true, paraSpaceAfter: 3 } })
  const body = Array.isArray(o.body) ? o.body : o.body ? [o.body] : []
  body.forEach((b, i) => {
    const rs = rich(b, { fontSize: bs, color: o.dim ? C.text2 : C.text1 })
    if (i < body.length - 1) { rs[0].options.paraSpaceAfter = 4; rs[rs.length - 1].options.breakLine = true }
    runs.push(...rs)
  })
  s.addText(runs, { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2, fontFace: SANS, valign: o.valign || (o.tag || o.title ? 'top' : 'middle'), align: o.align || 'left', margin: 0, isTextBox: true, objectName: 'card-text' })
  const all = [o.tag || '', plain(o.title || ''), ...body.map(plain)].filter(Boolean).join('\n')
  check('card ' + (o.title || o.tag || ''), all, bs, w - 0.3, h - 0.2)
}

function kpi(s, x, y, w, h, num, label, color = 'cy', numSize = 36) {
  const col = color === 'gn' ? C.accent3 : color === 'pu' ? C.accent2 : color === 'rd' ? C.accent4 : color === 'am' ? C.accent5 : C.accent1
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.background2 }, line: { color: LINE, width: 0.75 }, rectRadius: 0.1, objectName: 'kpi' })
  s.addText([
    { text: num, options: { fontFace: MONO, fontSize: numSize, bold: true, color: col, breakLine: true } },
    { text: plain(label), options: { fontSize: 12, color: C.text2 } },
  ], { x: x + 0.15, y: y + 0.08, w: w - 0.3, h: h - 0.16, valign: 'middle', margin: 0, isTextBox: true, objectName: 'kpi-text' })
  check('kpi ' + num, num + '\n' + plain(label), 12, w - 0.3, h - 0.16)
}

function take(s, text, kind = 'cy', y = 6.2, x = L, w = W, size = 16) {
  const col = kind === 'am' ? C.accent5 : kind === 'rd' ? C.accent4 : C.accent1
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.62, fill: { color: col, transparency: 88 }, line: { color: col, width: 0.75, transparency: 50 }, rectRadius: 0.08, objectName: 'takeaway' })
  s.addText(rich(text, { fontSize: size, color: C.text1 }), { x: x + 0.2, y, w: w - 0.4, h: 0.62, valign: 'middle', margin: 0, isTextBox: true, objectName: 'takeaway-text' })
  check('take', plain(text), size, w - 0.4, 0.62)
}

function mkRuns(items, { size = 16, bullet = true, after = 8, color } = {}) {
  const runs = []
  items.forEach((it, i) => {
    const rs = rich(it, { fontSize: size, color: color || C.text1 })
    // 段落级属性（项目符号、间距）只能写在段落的第一个 run 上，否则会被拆成多个段落
    const r0 = rs[0]
    if (bullet === 'number') r0.options.bullet = { type: 'number' }
    else if (bullet) r0.options.bullet = { indent: 18 }
    r0.options.paraSpaceAfter = after
    r0.options.lineSpacingMultiple = 1.1
    rs[rs.length - 1].options.breakLine = i < items.length - 1
    runs.push(...rs)
  })
  return runs
}
function bullets(s, items, x, y, w, h, size = 16, bullet = true) {
  s.addText(mkRuns(items, { size, bullet }), { x, y, w, h, fontFace: SANS, valign: 'top', margin: 0, isTextBox: true, objectName: 'bullets' })
  check('bullets', items.map(plain).join('\n'), size, w - 0.35, h - 0.1 - items.length * 0.12)
}

function node(s, x, y, w, h, text, col, align = 'center') {
  const c = col === 'gn' ? C.accent3 : col === 'rd' ? C.accent4 : col === 'am' ? C.accent5 : col === 'pu' ? C.accent2 : col === 'cy' ? C.accent1 : null
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.background2 }, line: { color: c || LINE, width: 1 }, rectRadius: 0.08, objectName: 'node' })
  s.addText(text, { x: x + 0.1, y, w: w - 0.2, h, fontSize: 14, color: C.text1, align, valign: 'middle', margin: 0, isTextBox: true, objectName: 'node-text' })
  check('node', text, 14, w - 0.2, h)
}
function arrow(s, x, y, w = 0.4, t = '→') {
  s.addText(t, { x, y, w, h: 0.4, fontFace: MONO, fontSize: 16, color: C.accent1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'arrow' })
}

// 横向对比条（before/after）
function beforeAfter(s, x, y, w, ttl, b, a) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 1.2, fill: { color: C.background2 }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08, objectName: 'ba-card' })
  s.addText(ttl, { x: x + 0.15, y: y + 0.07, w: w - 0.3, h: 0.28, fontSize: 11, color: C.accent1, margin: 0, isTextBox: true, objectName: 'ba-title' })
  check('ba title', ttl, 11, w - 0.3, 0.28)
  const max = Math.max(b.v, a.v)
  const bx = x + 2.1, bw = w - 2.1 - 0.95
  ;[[b, 0.42, false], [a, 0.78, true]].forEach(([r, dy, hot]) => {
    s.addText(r.label, { x: x + 0.15, y: y + dy, w: 1.9, h: 0.3, fontSize: 12, color: C.text2, margin: 0, valign: 'middle', isTextBox: true, objectName: 'ba-label' })
    check('ba label', r.label, 12, 1.9, 0.3)
    s.addShape(pres.ShapeType.roundRect, { x: bx, y: y + dy + 0.07, w: bw, h: 0.16, fill: { color: '0A1426' }, line: { type: 'none' }, rectRadius: 0.08, objectName: 'ba-track' })
    s.addShape(pres.ShapeType.roundRect, { x: bx, y: y + dy + 0.07, w: Math.max(0.1, (bw * r.v) / max), h: 0.16, fill: { color: hot ? C.accent3 : C.accent6 }, line: { type: 'none' }, rectRadius: 0.08, objectName: 'ba-fill' })
    s.addText(r.text, { x: bx + bw + 0.08, y: y + dy, w: 0.85, h: 0.3, fontFace: MONO, fontSize: 12, bold: hot, color: hot ? C.accent3 : C.text2, align: 'right', margin: 0, valign: 'middle', isTextBox: true, objectName: 'ba-value' })
  })
}

// 对数刻度条：v 越大条越长
function logBars(s, x, y, w, items, min, max, rowH = 0.62) {
  const a = Math.log10(min), b = Math.log10(max)
  items.forEach((it, i) => {
    const yy = y + i * rowH
    s.addText(it.label, { x, y: yy, w: 1.75, h: rowH - 0.1, fontSize: 13, color: it.hot ? C.text1 : C.text2, bold: !!it.hot, margin: 0, valign: 'middle', isTextBox: true, objectName: 'lb-label' })
    const bx = x + 1.8, bw = w - 1.8 - 0.95
    s.addShape(pres.ShapeType.roundRect, { x: bx, y: yy + 0.12, w: bw, h: 0.24, fill: { color: '0A1426' }, line: { type: 'none' }, rectRadius: 0.12, objectName: 'lb-track' })
    const k = Math.max(0.03, Math.min(1, (Math.log10(it.v) - a) / (b - a)))
    s.addShape(pres.ShapeType.roundRect, { x: bx, y: yy + 0.12, w: bw * k, h: 0.24, fill: { color: it.hot ? C.accent1 : C.accent6 }, line: { type: 'none' }, rectRadius: 0.12, objectName: 'lb-fill' })
    s.addText(it.fmt, { x: bx + bw + 0.05, y: yy, w: 0.9, h: rowH - 0.1, fontFace: MONO, fontSize: 13, bold: !!it.hot, color: it.hot ? C.text1 : C.text2, align: 'right', margin: 0, valign: 'middle', isTextBox: true, objectName: 'lb-value' })
  })
}

// 概率条
function probBars(s, x, y, w, items, topLabel, rowH = 0.38, size = 13) {
  items.forEach((it, i) => {
    const yy = y + i * rowH
    const hot = it.label === topLabel
    s.addText(it.label, { x, y: yy, w: 1.3, h: rowH - 0.04, fontFace: MONO, fontSize: size, color: hot ? C.text1 : C.text2, margin: 0, valign: 'middle', isTextBox: true, objectName: 'pb-label' })
    const bx = x + 1.35, bw = w - 1.35 - 0.7
    s.addShape(pres.ShapeType.roundRect, { x: bx, y: yy + 0.09, w: bw, h: 0.16, fill: { color: '0A1426' }, line: { type: 'none' }, rectRadius: 0.08, objectName: 'pb-track' })
    s.addShape(pres.ShapeType.roundRect, { x: bx, y: yy + 0.09, w: Math.max(0.08, bw * it.p), h: 0.16, fill: { color: hot ? C.accent1 : C.accent6 }, line: { type: 'none' }, rectRadius: 0.08, objectName: 'pb-fill' })
    s.addText(Math.round(it.p * 100) + '%', { x: bx + bw + 0.05, y: yy, w: 0.65, h: rowH - 0.04, fontFace: MONO, fontSize: size, color: hot ? C.text1 : C.text2, align: 'right', margin: 0, valign: 'middle', isTextBox: true, objectName: 'pb-value' })
  })
}

function newSlide(section, n, ttl, eyebrow) {
  const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: section })
  if (ttl) title(s, ttl, eyebrow)
  if (notes[n]) s.addNotes(notes[n])
  return s
}
function addSec(t) { pres.addSection({ title: t }) }

// =================================================================
(async () => {
  // ---- 1 封面 ----
  addSec('开场')
  {
    const s = pres.addSlide({ masterName: 'COVER', sectionTitle: '开场' })
    s.addText('INTERNAL TECH TALK · JEV · SYSTEM ONE MODEL', { x: L, y: 0.7, w: 8, h: 0.3, fontFace: MONO, fontSize: 11, color: C.accent1, margin: 0, charSpacing: 3, isTextBox: true, objectName: 'eyebrow' })
    s.addText('一个不写字的 AI', { x: L, y: 1.5, w: 6.1, h: 1.0, fontSize: 46, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: 'title' })
    s.addText('Jev：给程序做判断的模型', { x: L, y: 2.55, w: 6.1, h: 0.5, fontSize: 22, color: C.text2, margin: 0, isTextBox: true, objectName: 'subtitle' })
    s.addShape(pres.ShapeType.roundRect, { x: L, y: 3.5, w: 5.8, h: 1.3, fill: { color: C.accent1, transparency: 88 }, line: { color: C.accent1, width: 0.75, transparency: 50 }, rectRadius: 0.1, objectName: 'cover-quote' })
    s.addText(rich('ChatGPT 给人写答案，\nJev 给程序做**判断**。', { fontSize: 22, color: C.text1 }), { x: L + 0.25, y: 3.5, w: 5.4, h: 1.3, valign: 'middle', margin: 0, isTextBox: true, objectName: 'cover-quote-text' })
    pic(s, 'machine.jpeg', 6.9, 2.1, 5.83, 3.3)
    s.addText('Choice · Score · Yes/No —— ONE ANSWER. HOW SURE.', { x: 6.9, y: 5.5, w: 5.83, h: 0.3, fontFace: MONO, fontSize: 10, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    s.addShape(pres.ShapeType.rect, { x: L, y: 5.2, w: 5.8, h: 0.01, fill: { color: C.text2, transparency: 70 }, line: { type: 'none' }, objectName: 'cover-divider' })
    s.addText([{ text: '分享人    ', options: { fontSize: 12, color: C.accent1, charSpacing: 3 } }, { text: '黄冠豪', options: { fontSize: 28, bold: true, color: C.text1 } }], { x: L, y: 5.35, w: 5.8, h: 0.6, valign: 'middle', margin: 0, isTextBox: true, objectName: 'cover-meta-name' })
    s.addText('研发中心 / 游戏平台项目部', { x: L, y: 5.95, w: 5.8, h: 0.4, fontSize: 17, color: C.text2, margin: 0, isTextBox: true, objectName: 'cover-meta' })
    s.addNotes(notes[1] || '')
  }

  // ---- 2 路线 ----
  {
    const s = newSlide('开场', 2, '今天的路线', 'AGENDA')
    const items = [['先备知识', 'cy'], ['认识 Jev', 'cy'], ['为什么值得用\n快 · 省 · 准', 'cy'], ['真实案例', 'pu'], ['以后用在哪', 'pu'], ['上手', 'gn'], ['水分与落地', 'am'], ['压轴演示', 'pu']]
    const nw = 1.3, gap = 0.247
    items.forEach((it, i) => {
      const x = L + i * (nw + gap)
      node(s, x, 1.9, nw, 1.1, it[0], it[1])
      if (i < items.length - 1) arrow(s, x + nw, 2.25, gap)
    })
    card(s, L, 3.35, 3.9, 2.2, { tag: 'LIVE DEMO ×5', title: '现场演示', body: '四种题型 · 工单分流 · 输入即判 · 100 条并行分类 · 会变形的输入框', bodySize: 16 })
    card(s, L + 4.1, 3.35, 3.9, 2.2, { tag: 'THE POINT', title: '一个判断题', body: '你的代码里，有哪些调用**其实只是让模型选一个**？', bodySize: 16 })
    card(s, L + 8.2, 3.35, 3.93, 2.2, { tag: 'HONEST', title: '不神化', body: '官方数字、第三方实测、作者自报，分开讲清楚；Demo 全是现场真实调用', bodySize: 16 })
    take(s, '全场一句话：程序里很多"判断"其实只是**选择题**，交给只会勾选项的模型来做——**更快、更省，还告诉你有几成把握**。', 'cy', 5.85, L, W, 16)
  }

  // ---- 3 A1 ----
  addSec('先备知识')
  {
    const s = newSlide('先备知识', 3, '大模型的本质：猜下一个词', '先备知识 · 大模型')
    bullets(s, [
      '**大模型**（LLM，Large Language Model，如 ChatGPT、Claude）不是"查资料"，而是**续写**：看前文，给每个候选词打概率，挑一个',
      '挑完再来一轮，**每写一个字，就把前面所有内容再算一遍**',
      '所以它能写长文，但也因此**慢、贵**',
      '写 500 个字，这个"重读一遍再接一个字"的循环就要跑几百次',
    ], L, 1.8, 6.4, 4.2, 16)
    card(s, 7.4, 1.8, 5.33, 4.2, { tag: 'INPUT · 情景数据，示意', title: '' })
    s.addText([{ text: '今天天气真', options: { color: C.text1 } }, { text: '▍', options: { color: C.accent1 } }], { x: 7.65, y: 2.2, w: 4.8, h: 0.6, fontFace: MONO, fontSize: 26, margin: 0, isTextBox: true, objectName: 'prefix' })
    probBars(s, 7.65, 3.0, 4.85, [{ label: '好', p: 0.62 }, { label: '不错', p: 0.21 }, { label: '热', p: 0.09 }, { label: '冷', p: 0.05 }, { label: '糟', p: 0.03 }], '好', 0.42, 15)
    s.addText('每写一个字，就把前面所有内容再算一遍', { x: 7.65, y: 5.3, w: 4.85, h: 0.4, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    take(s, 'Jev 只做「打概率」这一步，**一个字也不往下写**。')
  }

  // ---- 4 A2 ----
  {
    const s = newSlide('先备知识', 4, 'Token 与上下文：计费字节和白板', '先备知识 · Token 与上下文')
    card(s, L, 1.8, 5.6, 4.2, { tag: 'TOKENIZER · 示意', title: '' })
    s.addText('原文：我的月订阅被扣了两次款', { x: L + 0.25, y: 2.2, w: 5.1, h: 0.4, fontSize: 14, color: C.text2, margin: 0, isTextBox: true, objectName: 'tok-src' })
    const toks = ['我的', '月', '订阅', '被', '扣', '了', '两次', '款']
    let tx = L + 0.25, ty = 2.8
    const cols = [C.accent1, C.accent2, C.accent3]
    toks.forEach((t, i) => {
      const w = 0.3 + t.length * 0.3
      if (tx + w > L + 5.4) { tx = L + 0.25; ty += 0.6 }
      s.addShape(pres.ShapeType.roundRect, { x: tx, y: ty, w, h: 0.48, fill: { color: cols[i % 3], transparency: 80 }, line: { color: cols[i % 3], width: 0.75 }, rectRadius: 0.06, objectName: 'tok' })
      s.addText(t, { x: tx, y: ty, w, h: 0.48, fontFace: MONO, fontSize: 18, color: C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'tok-text' })
      tx += w + 0.1
    })
    s.addText([{ text: '8', options: { fontFace: MONO, fontSize: 40, bold: true, color: C.accent1 } }, { text: ' 个 token', options: { fontSize: 18, color: C.text2 } }], { x: L + 0.25, y: 4.6, w: 5, h: 0.8, margin: 0, isTextBox: true, objectName: 'tok-count' })
    s.addText('真实切分因模型而异，可在 OpenAI 的切词工具里现场试', { x: L + 0.25, y: 5.4, w: 5.1, h: 0.4, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    const H = (t) => ({ text: t, options: { fontSize: 17, bold: true, color: C.accent1, breakLine: true, paraSpaceAfter: 6 } })
    s.addText([
      H('Token（词元）= 模型的"计费字节"'),
      ...mkRuns(['模型读的不是"字"，是**片段**；计费、长度上限都按它', '中文通常比英文更费；**输出 token 一般比输入贵好几倍**'], { size: 15, after: 6 }),
      { text: ' ', options: { fontSize: 8, breakLine: true } },
      H('上下文窗口（Context Window）= 一块"白板"'),
      ...mkRuns(['一次能看多少，写满就擦最早的', '"它记得你"其实是**每次把历史重发一遍**', '材料越长越杂，反而越不准'], { size: 15, after: 6 }),
    ], { x: 6.5, y: 1.85, w: 6.23, h: 4.2, valign: 'top', margin: 0, isTextBox: true, objectName: 'token-text' })
    take(s, 'Jev：输入 $0.042 / 百万 token，**输出免费**；一次约能看 3.2 万 token（约两三万汉字）的材料。')
  }

  // ---- 5 A3 ----
  {
    const s = newSlide('先备知识', 5, 'Prompt 与幻觉', '先备知识 · Prompt 与幻觉')
    card(s, L, 1.8, 5.95, 4.1, { accent: 'cy', tag: 'PROMPT', title: 'Prompt（提示词）：写给模型的"需求说明"', body: ['写得像给新同事讲判断标准，效果最好。分「系统提示」（定规矩）和「用户提示」（给任务）两层。', '前端类比：接口文档 / 需求单', '**在 Jev 里**：变成"题目说明 + 选项说明"'], bodySize: 19, titleSize: 20, valign: 'middle' })
    card(s, L + 6.18, 1.8, 5.95, 4.1, { accent: 'rd', tag: 'HALLUCINATION · 幻觉', title: '幻觉：不会的题，硬写一个"像对的"', body: ['因为它在**续写**，不是在**查事实**：编事实、编引用、格式飘。', '前端类比：没有类型检查的 any（TS 的"任意类型"），什么都能吐', '**在 Jev 里**："零幻觉"= 答案被锁在你给的选项里。**不等于选对**。'], bodySize: 19, titleSize: 20, valign: 'middle' })
    take(s, '先记住这句：**格式上不会错，不代表内容上不会错**——后面会反复回扣。', 'am')
  }

  // ---- 6 A4 ----
  {
    const s = newSlide('先备知识', 6, 'Agent（智能体）：大模型 + 工具 + 循环', '先备知识 · Agent')
    node(s, 2.2, 1.7, 2.9, 0.62, '想：下一步做什么？', 'cy'); arrow(s, 5.1, 1.8)
    node(s, 5.5, 1.7, 2.4, 0.62, '做：调用工具', 'pu'); arrow(s, 7.9, 1.8)
    node(s, 8.3, 1.7, 2.4, 0.62, '看：返回结果', 'gn')
    s.addText('↺ 重复，直到做完', { x: 10.8, y: 1.7, w: 1.9, h: 0.62, fontSize: 13, color: C.accent1, valign: 'middle', margin: 0, isTextBox: true, objectName: 'loop' })
    bullets(s, [
      '**Agent（智能体）** = 能自己一步步把事做完的 AI 程序',
      '例："订周五去上海的机票"：先搜航班？先问预算？返回 12 条，选哪个？',
      '**模型不会真的点按钮**，它只说"我要调用某个工具"（**工具调用**），真正执行的是**你的代码**',
      '你已在用的：Claude Code、Codex、Cursor（写代码的 AI 助手）',
      '前端类比：dispatch(action) 派发动作，reducer 才真正改状态',
    ], L, 2.6, 6.5, 3.4, 15)
    card(s, 7.5, 2.6, 5.23, 3.4, { accent: 'am', tag: 'THE PAIN · 痛点', title: '' })
    s.addText([{ text: '1–2', options: { fontFace: MONO, fontSize: 48, bold: true, color: C.accent5 } }, { text: ' 秒 / 步', options: { fontSize: 16, color: C.text2, breakLine: true } }, { text: '一个任务几十步，每一步"想下一步做什么"都问一次大模型', options: { fontSize: 15, color: C.text1 } }], { x: 7.75, y: 2.95, w: 4.75, h: 2.0, margin: 0, isTextBox: true, objectName: 'pain' })
    take(s, '每一步都是一道**选择题**，却在用**写作文**的模型来答。', 'am', 5.0 + 0.3, 7.75, 4.75, 15)
  }

  // =================== B ===================
  addSec('认识 Jev')
  // ---- 8 ----
  {
    const s = newSlide('认识 Jev', 7, 'Jev 是什么：只会做选择题的 AI', '认识 Jev · 它是什么')
    pic(s, 'compare.jpg', L, 1.8, 6.6, 4.1)
    card(s, 7.5, 1.8, 5.23, 1.2, { accent: 'cy', body: '**System One（系统一）= 快判断**\n卡尼曼的"快思考"：靠直觉做选择、分流', bodySize: 16 })
    card(s, 7.5, 3.15, 5.23, 1.25, { body: '**不能做**：聊天 · 写文案 · 写代码 · 描述图片\n官网：Not a generative chat model；带图的 Box 题仍是原型', bodySize: 15 })
    card(s, 7.5, 4.55, 5.23, 1.35, { body: '**谁做的**：TypeSafe AI（旧金山），创始人来自 OpenAI（ChatGPT 的公司）', bodySize: 16 })
    take(s, '它不会写，所以**可以又快又便宜**——这是一个取舍，不是缺陷。')
  }
  // ---- 9 ----
  {
    const s = newSlide('认识 Jev', 8, '题型：是非、单选、打分，外加 box', '认识 Jev · 题型')
    pic(s, 'types.jpg', L, 1.8, 6.6, 4.1)
    card(s, 7.5, 1.75, 5.23, 1.0, { accent: 'cy', tag: 'NOUL · 是非题', body: ['只回答"是"的概率', '例：这条工单紧急吗？→ 0.94'], bodySize: 13 })
    card(s, 7.5, 2.85, 5.23, 1.0, { accent: 'pu', tag: 'CHOICE · 单选题', body: ['最多 255 个选项，**不会凭空多出第四个**', '例：该转给哪个部门？→ 账单'], bodySize: 13 })
    card(s, 7.5, 3.95, 5.23, 1.0, { accent: 'gn', tag: 'SCORE · 打分题', body: ['有序等级，可以是小数', '例：客户有多不满？→ 1.7 / 0–2'], bodySize: 13 })
    card(s, 7.5, 5.05, 5.23, 1.0, { accent: 'am', tag: 'BOX · 坐标题', body: ['返回图中目标的位置（四条边的比例）', '官方标注 Dreamer-ready，先当原型玩'], bodySize: 13 })
    take(s, '同一份材料可以**一次问多道题，只读一遍**。决定效果的是题出得清不清楚，而不是换哪个模型。', 'cy', undefined, undefined, undefined, 15)
  }
  // ---- 9 Demo1 四种题型 ----
  {
    const s = newSlide('认识 Jev', 9, '现场演示 1：四种题型（是非 / 单选 / 打分 / 框选）', 'DEMO 1 · 网页版演讲站里现场操作')
    demoSteps(s, [
      '**是非题**：例 1（接口报 500）→ 97% 是；例 2（扣了两次款）→ 约 25%，对照人工参考答案',
      '**单选题**：例 3（店铺几点关门）→ other 约 85%：有 other 出口就不用硬选；例 4（涨价了？）概率分散，该转人工',
      '**打分题**：冷静 0.2 / 不满但礼貌 1.0 / 很生气 2.0，分数可以是小数',
      '**框选题 Box**：JEV 秒表 → 框画在图上，把握度约 80%；"图里没有的东西"照样给框，要靠旁边的是非题（3%）判断',
    ], '本页为 PPT 版：步骤 + 真实实测结果；现场请切换到网页版演讲站（第 9 页）。Box 官方标注 Dreamer-ready，需图片和 Danger-Zone-Images 头，别用在生产里。')
    const pc = pic(s, 'box/stopwatch.jpg', 6.6, 1.75, 6.13, 3.0)
    // JEV 秒表的真实返回（10 月 28 日）：left 0.21 top 0.16 right 0.45 bottom 0.69
    s.addShape(pres.ShapeType.rect, { x: pc.x + 0.21 * pc.w, y: pc.y + 0.16 * pc.h, w: 0.24 * pc.w, h: 0.53 * pc.h, fill: { color: C.accent5, transparency: 85 }, line: { color: C.accent5, width: 2.25 }, objectName: 'box-overlay' })
    s.addText('真实返回的框：JEV 秒表 · 把握度 80%', { x: 6.6, y: 4.78, w: 6.13, h: 0.28, fontSize: 11, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    const rows = [['是非 Noul', '接口报 500 → is_urgent 97% 是'], ['单选 Choice', '店铺几点关门 → other 84%'], ['打分 Score', '很生气 → 1.98 ≈ 非常愤怒（把握度 97%）'], ['框选 Box', 'left 0.21 · top 0.16 · right 0.45 · bottom 0.69']]
    rows.forEach((r, i) => {
      const y = 5.1 + i * 0.27
      s.addText([{ text: r[0] + '  ', options: { bold: true, color: C.accent1, fontFace: MONO } }, { text: r[1], options: { color: C.text1 } }], { x: 6.6, y, w: 6.13, h: 0.26, fontSize: 11, margin: 0, isTextBox: true, objectName: 'real-row' })
    })
  }
  // ---- 10 ----
  {
    const s = newSlide('认识 Jev', 10, '一次调用长什么样', '认识 Jev · 一次调用')
    s.addShape(pres.ShapeType.roundRect, { x: L, y: 1.7, w: 7.9, h: 3.65, fill: { color: '050912' }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08, objectName: 'code-bg' })
    const code = [
      'fetch(".../v1/systemone", {',
      '  method: "POST",   // Key 只放后端！',
      '  body: JSON.stringify({',
      '    model: "jev-latest",',
      '    state: "我的月订阅被扣了两次款。",',
      '    questions: {',
      '      is_urgent:   { type: "noul", instructions: "要马上处理吗？" },',
      '      department:  { type: "choice", instructions: "归哪个团队？",',
      '        criteria: { billing: "付款扣费", technical: "故障报错",',
      '                    other: "以上都不是" } },',
      '      frustration: { type: "score", instructions: "有多不满？",',
      '        criteria: ["冷静", "不满但礼貌", "非常愤怒"] },',
      '    },',
      '  }),',
      '})',
    ]
    s.addText(code.join('\n'), { x: L + 0.2, y: 1.8, w: 7.5, h: 3.45, fontFace: MONO, fontSize: 11.5, color: 'BFD6EE', valign: 'top', margin: 0, isTextBox: true, objectName: 'code' })
    s.addText('model＝用哪个版本　state＝要判断的材料　questions＝题目　criteria＝选项说明\n返回：answers.is_urgent.noul / answers.department.choice / 各项概率 / 把握度', { x: L, y: 5.45, w: 7.9, h: 0.65, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'legend' })
    pic(s, 'firstcode.jpg', 8.9, 1.7, 3.83, 4.4)
    take(s, '代码读键，别去解析散文；**判定之后做什么，由你的 if 决定**，Jev 不会替你执行业务。', 'cy', 6.3)
  }
  // ---- 11 ----
  addSec('为什么值得用')
  {
    const s = newSlide('为什么值得用', 11, '为什么快：不写字，一次算完', '为什么值得用 · 快')
    pic(s, 'fast.jpg', L, 1.7, 5.9, 3.3)
    bullets(s, ['**输出锁在选项里**，一次算出所有选项的概率', '多道题**并行**，共享同一次"读材料"', '官方说是"并行采样 + 新架构"，具体没公开，别当成已证实'], L, 5.15, 5.9, 1.4, 14)
    kpi(s, 6.8, 1.7, 1.88, 1.1, '70–500ms', '官方单次延迟', 'cy', 18)
    kpi(s, 8.825, 1.7, 1.88, 1.1, '~76ms', '网友自报中位数', 'cy', 18)
    kpi(s, 10.85, 1.7, 1.88, 1.1, '~250ms', '本机实测（含跨境网络）', 'gn', 18)
    pic(s, 'stopwatch.jpeg', 6.8, 2.95, 5.93, 2.85)
    s.addText('上海串行实测：Jev 典型 0.7s / 最慢 1.5s；对照轻量大模型最慢 32s。**赢在"稳"：不会偶尔卡几十秒**'.replace(/\*\*/g, ''), { x: 6.8, y: 5.85, w: 5.93, h: 0.7, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
  }
  // ---- 12 ----
  {
    const s = newSlide('为什么值得用', 12, '为什么省：四个地方的账', '为什么值得用 · 省')
    const rows = [
      ['① 输出几乎免费', '大模型输出价常是输入的 **~5 倍**；Jev **输出不计费**，输入 $0.042 / 百万 token'],
      ['② 没有废话 token', '内容审核任务里，输出 **85 token vs 910**（NearHere 实测，对比某轻量大模型）'],
      ['③ 多题合并成一次读', '官方称：同一材料一次问 13 题，比分 13 次问 **便宜 12.2 倍、快 10 倍**（厂商数据）'],
      ['④ 少一类失败', '不用解析 JSON、不用因格式错重试'],
    ]
    rows.forEach((r, i) => card(s, L, 1.7 + i * 1.12, 5.9, 1.02, { accent: 'cy', tag: r[0], body: r[1], bodySize: 13 }))
    card(s, 6.75, 1.7, 5.98, 4.4, { tag: '同一类任务，每个案例的成本（官方自报，对数刻度）', title: '' })
    logBars(s, 6.95, 2.2, 5.6, [
      { label: 'Jev', v: 0.0004, fmt: '$0.0004', hot: true },
      { label: 'GPT-5.6 Terra', v: 0.03, fmt: '$0.03' },
      { label: 'Claude Sonnet 5', v: 0.1174, fmt: '$0.1174' },
      { label: 'Opus 5', v: 0.18, fmt: '$0.18' },
    ], 0.0001, 1, 0.62)
    s.addText('Sonnet、Opus、Terra 都是大模型型号。官方自建 4 条工作流平均：Jev 准确率 68%，和 Terra、Sonnet 相当；最准的 Opus 5 约 73%。标准答案取两个顶级大模型的平均，所以衡量的是"与大模型一致的程度"', { x: 6.9, y: 4.85, w: 5.7, h: 1.2, fontSize: 12, color: C.text2, margin: 0, valign: 'top', isTextBox: true, objectName: 'cost-note' })
  }
  // ---- 13 ----
  {
    const s = newSlide('为什么值得用', 13, '省的边界：别被"400 倍"带跑', '为什么值得用 · 省的边界')
    const p = pic(s, 'billboard.jpeg', L, 1.7, 5.5, 2.4)
    card(s, L, 4.25, 5.5, 1.7, { accent: 'rd', body: ['快：官网 **193×** → 社区中位数 **7×**', '省：官网 **444×** → 社区中位数 **30×**'], bodySize: 16, valign: 'middle' })
    card(s, 6.4, 1.7, 6.33, 2.3, { accent: 'am', tag: '对上轻量大模型', title: '94.7% vs 93.0%', titleSize: 28, body: '100 条中文 × 3 题：准确率、花费都**基本打平**（各 $0.003）。Jev 赢在**稳 + 带把握度**', bodySize: 16 })
    card(s, 6.4, 4.15, 6.33, 1.8, { tag: '什么时候"省"不成立', body: ['订阅制（Claude Code / Codex 按月付费）：判断本来就包在月费里', '材料很长：输入仍按 token 计费', '价格官方承认**可能有补贴**'], bodySize: 15 })
    take(s, '"便宜 400 倍"比的是**前沿大模型**；别拿"便宜"当选它的理由，要拿**稳定低延迟 + 带把握度的答案**。', 'am', 6.15)
  }
  // ---- 14 ----
  {
    const s = newSlide('为什么值得用', 14, '为什么敢信：校准（Calibration）', '为什么值得用 · 准（校准）')
    s.addText('说 90%，就该对 90%', { x: L, y: 1.75, w: 6, h: 0.4, fontSize: 20, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: 'h' })
    s.addText('像天气预报：预报降雨 70% 的那些天，真有七成下了雨，这个预报就叫"校准好"。', { x: L, y: 2.2, w: 6, h: 0.8, fontSize: 15, color: C.text1, margin: 0, isTextBox: true, objectName: 'p' })
    bullets(s, ['以前的小分类模型常"蜜汁自信"：猜错了也标 99%，没法当闸门', 'Jev 的训练方式专门奖励"把握说得准"，而不只是"答对"', '**证据**（垃圾邮件 18,514 封）：得分 ≥0.9 的 **99.9%** 是垃圾；得分 0.5–0.6 的只有 38%'], L, 3.1, 6, 2.9, 15)
    card(s, 6.9, 1.7, 5.83, 4.3, { tag: 'CALIBRATION · 示意曲线', title: '' })
    s.addChart(pres.charts.LINE, [
      { name: '理想', labels: ['0.5', '0.6', '0.7', '0.8', '0.9', '1.0'], values: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0] },
      { name: '校准好', labels: ['0.5', '0.6', '0.7', '0.8', '0.9', '1.0'], values: [0.5, 0.61, 0.7, 0.8, 0.9, 0.99] },
      { name: '过度自信', labels: ['0.5', '0.6', '0.7', '0.8', '0.9', '1.0'], values: [0.5, 0.52, 0.55, 0.6, 0.66, 0.7] },
    ], {
      x: 7.0, y: 2.05, w: 5.6, h: 3.5, chartColors: ['6F8399', '34D399', 'F87171'], lineSize: 3, lineDataSymbol: 'none',
      showLegend: true, legendPos: 'b', legendColor: 'E8EEF9', legendFontSize: 12, catAxisLabelColor: '8DA2C0', valAxisLabelColor: '8DA2C0', catAxisLabelFontSize: 11, valAxisLabelFontSize: 11,
      valAxisMinVal: 0.4, valAxisMaxVal: 1.0, valGridLine: { color: '1B2942', size: 0.75 }, catGridLine: { style: 'none' },
      showCatAxisTitle: true, catAxisTitle: '模型自报的把握', catAxisTitleColor: '8DA2C0', catAxisTitleFontSize: 11,
      showValAxisTitle: true, valAxisTitle: '实际正确率', valAxisTitleColor: '8DA2C0', valAxisTitleFontSize: 11, objectName: 'calib-chart',
    })
    s.addText('说 99% 却只对 70% 的模型，没法当"自动执行"的闸门', { x: 7.05, y: 5.55, w: 5.5, h: 0.35, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    take(s, '**把握度（confidence）≠ 正确率**。它只是"答案有多集中"；也有人转述过不太理想的校准误差（未核对原评测）——必须拿**你自己的数据**验。', 'am', 6.2, L, W, 15)
  }
  // ---- 15 ----
  {
    const s = newSlide('为什么值得用', 15, '最值钱的用法：按把握分流', '为什么值得用 · 按把握分流')
    node(s, L, 2.4, 1.5, 0.8, '一条请求', null); arrow(s, L + 1.5, 2.6, 0.4)
    node(s, L + 1.9, 2.4, 1.9, 0.8, 'Jev 判断\n+ 把握度', 'pu'); arrow(s, L + 3.8, 2.6, 0.4)
    node(s, L + 4.2, 1.8, 2.4, 0.62, '> 0.9　自动执行', 'gn', 'left')
    node(s, L + 4.2, 2.55, 2.4, 0.62, '0.7–0.9　大模型复核', 'am', 'left')
    node(s, L + 4.2, 3.3, 2.4, 0.62, '< 0.7　转人工', 'rd', 'left')
    card(s, L, 4.2, 6.6, 1.7, { accent: 'cy', body: '垃圾邮件测试（Arize，AI 评测公司）：把得分 0.3–0.7 的 **4.6%** 转人工，其余自动处理准确率 **99.5%**', bodySize: 15, valign: 'middle' })
    pic(s, 'podcast.jpg', 7.5, 1.7, 5.23, 3.55)
    s.addText('播客洞察排名器（作者自报）：85 段全由 Jev 打分 $0.0038，仅 36 段低把握的交大模型复核 $0.0087', { x: 7.5, y: 5.3, w: 5.23, h: 0.7, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    take(s, '阈值只是起点，要用自己的数据校准；**退款、删除、对外发送**这类不可逆动作，把握再高也留硬规则。', 'am', 6.2)
  }

  // ---- 演示页辅助 ----
  function demoSteps(s, steps, note) {
    s.addText(mkRuns(steps, { size: 15, bullet: 'number', after: 9 }), { x: L, y: 1.8, w: 5.6, h: 3.9, valign: 'top', margin: 0, isTextBox: true, objectName: 'demo-steps' })
    check('demo-steps', steps.join('\n'), 15, 5.3, 3.8 - steps.length * 0.12)
    take(s, note, 'am', 6.2, L, W, 14)
  }
  // ---- 16 Demo1 ----
  {
    const s = newSlide('为什么值得用', 16, '现场演示 2：Playground（工单分流 / 退款诉求 / VIP 路由）', 'DEMO 2 · 网页版演讲站里现场操作')
    demoSteps(s, [
      '先看界面：左上材料、下面示例（带**绿色参考答案框**）、左下题目 JSON、右边返回',
      '**工单分流**：例 1 → 账单 100%，与参考答案一致；例 4 → 概率分散，把握度三成左右，转人工；例 5 → 这组题故意没放 other，材料太短也硬选（95%）',
      '拖动"自动放行线"和"复核线"：阈值是**你定的**，不是模型给的',
      '**退款诉求**：和控制台截图完全一样的两道题',
      '**VIP 路由**：材料里放客户信息，**同一句话** VIP → 专属客服，普通 → 自动退款',
    ], '本页为 PPT 版：真实实测结果；现场请切换到网页版演讲站（第 16 页）调用 Jev。')
    card(s, 6.6, 1.8, 6.13, 4.2, { accent: 'cy', tag: '真实调用结果 · VIP 路由（本机实测）', title: '' })
    s.addText('{"message": "这是我这个月第二次收到坏的耳机了，我要退款……",\n "customer": {"level": "VIP", "orders_last_year": 18, "total_spent_cny": 12600}}', { x: 6.85, y: 2.15, w: 5.65, h: 0.75, fontFace: MONO, fontSize: 10.5, color: 'BFD6EE', valign: 'top', margin: 0, isTextBox: true, objectName: 'demo-state' })
    s.addText([{ text: '参考答案（人工标注）  ', options: { bold: true, color: C.accent3 } }, { text: 'wants_refund = 是 · route = vip_agent', options: { fontFace: MONO, color: C.text1 } }], { x: 6.85, y: 2.95, w: 5.65, h: 0.3, fontSize: 12, margin: 0, isTextBox: true, objectName: 'demo-exp' })
    const rows = [['wants_refund', '是非', '98%  是', '参考答案：是 ✓ 一致'], ['churn_risk', '打分', '1.90 ≈ 高', '流失风险 86%'], ['route', '单选', 'vip_agent 98%', 'Confidence 98% · 参考答案 vip_agent ✓']]
    rows.forEach((r, i) => {
      const y = 3.35 + i * 0.72
      s.addShape(pres.ShapeType.roundRect, { x: 6.85, y, w: 5.65, h: 0.64, fill: { color: '0A1426' }, line: { color: LINE, width: 0.75 }, rectRadius: 0.06, objectName: 'row' })
      s.addText([{ text: r[0], options: { fontFace: MONO, bold: true, color: C.text1 } }, { text: '  ' + r[1], options: { fontSize: 10, color: C.accent2 } }], { x: 7.0, y: y + 0.03, w: 2.8, h: 0.3, fontSize: 12.5, margin: 0, isTextBox: true, objectName: 'rk' })
      s.addText(r[2], { x: 9.6, y: y + 0.03, w: 2.8, h: 0.3, fontFace: MONO, fontSize: 12.5, bold: true, color: C.accent1, align: 'right', margin: 0, isTextBox: true, objectName: 'rh' })
      s.addText(r[3], { x: 7.0, y: y + 0.33, w: 5.4, h: 0.28, fontSize: 11, color: i === 1 ? C.text2 : C.accent3, margin: 0, isTextBox: true, objectName: 'rm' })
    })
    s.addShape(pres.ShapeType.roundRect, { x: 6.85, y: 5.52, w: 5.65, h: 0.42, fill: { color: C.accent3, transparency: 88 }, line: { color: C.accent3, width: 0.75 }, rectRadius: 0.06, objectName: 'cmp' })
    s.addText('同一句话（耳机坏了请退款）：VIP → vip_agent 98% ｜ 普通 → auto_refund 88%', { x: 6.95, y: 5.52, w: 5.45, h: 0.42, fontSize: 11, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: 'cmp-text' })
  }

  // =================== C ===================
  addSec('真实案例')
  // ---- 17 ----
  {
    const s = newSlide('真实案例', 17, '案例地图：四种用法，七个案例', '真实案例 · 总览')
    const cs = [['AGENT 决策器', '每一步选哪个', ['案例 1 · 浏览器 Agent'], 'cy'], ['实时闸门', '放行 / 隐藏 / 人工', ['案例 2 · 内容审核', '案例 3 · 垃圾邮件与工单'], 'cy'],
      ['批量处理', '以前不值得上 AI 的判断', ['案例 4 · 海量分类', '案例 5 · 招聘初筛', '案例 6 · 文档处理'], 'pu'], ['开发者工具', '先检索，再判断；给 Agent 装闸门', ['案例 7 · 检索与护栏'], 'pu']]
    cs.forEach((c, i) => card(s, L + (i % 2) * 6.18, 1.75 + Math.floor(i / 2) * 2.2, 5.95, 2.0, { accent: c[3], tag: c[0], title: c[1], titleSize: 20, body: c[2], bodySize: 16, valign: 'middle' }))
    take(s, '共同点：**选项事先存在**，不需要它写一篇话。现场演示穿插在案例 2、案例 4 之后。', 'cy', 6.2)
  }
  // ---- 18 ----
  {
    const s = newSlide('真实案例', 18, '案例 1｜浏览器 Agent：网页拆成"选择题"', '真实案例 · Agent 决策')
    bullets(s, [
      '**Browser Use**（开源的"能操作浏览器的 AI"）做了 jev-ultrafast：不再每步截图给看图的大模型，而是把网页拆成**带编号的元素清单**，让 Jev 选"做什么、对哪个"',
      '单次决策约 **$0.0039**（不到 4 厘钱）；全流程只快了约 25%，**更大的收获是"做得准"**',
      '关键发现：同样用 Jev，**直接喂网页原始代码只做对一半，整理成清单全做对**',
      '**状态怎么"喂"，比换哪个模型更重要**',
    ], L, 1.8, 5.7, 4.5, 16)
    pic(s, 'agent-click.jpeg', 6.6, 1.7, 6.13, 2.35)
    s.addText('网页被拆成 12 个编号元素，Jev 回答"点 7"', { x: 6.6, y: 4.08, w: 6.13, h: 0.3, fontSize: 12, color: C.text2, align: 'center', margin: 0, isTextBox: true, objectName: 'cap' })
    beforeAfter(s, 6.6, 4.5, 6.13, '搜一张机票，全流程耗时', { label: '传统：截图+看图大模型', v: 9.5, text: '9.5 s' }, { label: 'Jev 选元素', v: 7.1, text: '7.1 s' })
    beforeAfter(s, 6.6, 5.8, 6.13, '浏览器任务通过数（共 49 个测试任务）', { label: '喂网页原始代码', v: 25, text: '25 / 49' }, { label: '整理成编号清单', v: 49, text: '49 / 49' })
  }
  // ---- 19 ----
  {
    const s = newSlide('真实案例', 19, '案例 2｜内容审核：快到可以"输入即判"', '真实案例 · 内容审核')
    kpi(s, L, 1.75, 2.9, 1.5, '96%', 'NearHere 活动平台审核\n对比某轻量大模型 86%', 'gn', 34)
    kpi(s, L + 3.1, 1.75, 2.7, 1.5, '58×', '每次判定更便宜', 'gn', 34)
    s.addText('一次请求，三道题同时答：', { x: L, y: 3.45, w: 5.8, h: 0.35, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: 'h' })
    bullets(s, ['harassment 是非题：是不是辱骂？', 'scam 是非题：是不是诈骗？', 'action 单选题：放行 / 隐藏 / 交人工（给运营看的建议）'], L, 3.9, 5.8, 2.2, 16)
    card(s, 6.9, 1.75, 5.83, 4.2, { accent: 'cy', tag: '审核流水线 · 单次约 0.1–0.3 秒', title: '' })
    node(s, 7.5, 2.2, 4.6, 0.55, '用户输入的内容', null); arrow(s, 9.4, 2.78, 0.6, '↓')
    node(s, 7.5, 3.2, 4.6, 0.55, 'Jev 判断（三道题并行）', 'pu')
    s.addText('↓  你的代码按阈值决定', { x: 7.5, y: 3.78, w: 4.6, h: 0.4, fontSize: 12, color: C.accent1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'arrow-label' })
    node(s, 7.5, 4.2, 4.6, 0.5, '辱骂 ≥ 0.5 → 折叠隐藏', 'rd', 'left')
    node(s, 7.5, 4.8, 4.6, 0.5, '诈骗 ≥ 0.7 → 先不发布，交人工', 'am', 'left')
    node(s, 7.5, 5.4, 4.6, 0.5, '其余 → 直接放行', 'gn', 'left')
  }
  // ---- 20 Demo2 ----
  {
    const s = newSlide('真实案例', 20, '现场演示 3：输入即判', 'DEMO 3 · 网页版演讲站里现场操作')
    demoSteps(s, ['左边是题目：辱骂（是非）、诈骗（是非）、建议处理方式（单选）；右边是返回 + 参考答案对照', '点"正常" → **放行**；点"辱骂" → **隐藏**；点"诈骗" → **交人工**', '点"反讽"（你这个方案真是太"有想法"了）：辱骂约 25%、处理建议的把握只有六成——这就是"低把握长什么样"'], '本页为 PPT 版：步骤 + 真实实测结果；现场请切换到网页版演讲站（第 20 页）。')
    card(s, 6.6, 1.8, 6.13, 4.2, { accent: 'cy', tag: '真实调用结果（10 月 28 日本机实测，均与参考答案一致）', title: '' })
    const rows = [['今天这个活动办得真不错，下次还来！', '辱骂 1% · 诈骗 1% · action = allow ✓', '放行', C.accent3], ['你这个人真是个傻子，别让我再看到你', '辱骂 94% · 诈骗 1% · action = hide ✓', '隐藏', C.accent4], ['恭喜中奖！加微信领取，先转账 100 元手续费', '辱骂 3% · 诈骗 99% · action = escalate ✓', '交人工', C.accent5]]
    rows.forEach((r, i) => {
      const y = 2.2 + i * 1.2
      s.addText(r[0], { x: 6.85, y, w: 3.9, h: 0.55, fontSize: 13, color: C.text1, margin: 0, valign: 'top', isTextBox: true, objectName: 'in' })
      s.addText(r[1], { x: 6.85, y: y + 0.55, w: 3.95, h: 0.3, fontFace: MONO, fontSize: 10, color: C.text2, margin: 0, isTextBox: true, objectName: 'sc' })
      s.addShape(pres.ShapeType.roundRect, { x: 10.95, y: y + 0.05, w: 1.5, h: 0.65, fill: { color: r[3], transparency: 85 }, line: { color: r[3], width: 1 }, rectRadius: 0.08, objectName: 'verdict' })
      s.addText(r[2], { x: 10.95, y: y + 0.05, w: 1.5, h: 0.65, fontSize: 16, bold: true, color: r[3], align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'verdict-text' })
    })
  }
  // ---- 21 ----
  {
    const s = newSlide('真实案例', 21, '案例 3｜垃圾邮件与工单：不用训练，也能追平训练好的模型', '真实案例 · 邮件与工单')
    kpi(s, L, 1.75, 2.9, 1.5, '98.3%', 'Jev（不给任何训练例子）\n18,514 封邮件', 'cy', 34)
    kpi(s, L + 3.1, 1.75, 2.9, 1.5, '98.4%', '传统分类模型\n用了约 1.48 万条标注训练', 'pu', 34)
    card(s, L, 3.4, 6.0, 1.5, { accent: 'gn', tag: '转人工后', body: '把中间 4.6% 交人工，其余 **99.5%**。两者意见不同的 466 封，对错各占一半，差距小到可以认为没区别', bodySize: 14 })
    s.addText('注：评判标准写法是看了 1,000 封错例后调过的，并非完全"零训练"', { x: L, y: 5.05, w: 6.0, h: 0.5, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    s.addText('工单分流示例题', { x: 7.0, y: 1.75, w: 5.7, h: 0.35, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: 'h' })
    s.addShape(pres.ShapeType.roundRect, { x: 7.0, y: 2.2, w: 5.73, h: 1.9, fill: { color: '050912' }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08, objectName: 'code-bg' })
    s.addText('category           单选 账单|故障|需求|其他\nrefund_requested   是非 是否要退款，≥0.7 算"是"\nbug_severity       打分 故障严重度 3 档，≥1.5 加急\n// 示例阈值，需用自己的数据校准', { x: 7.2, y: 2.3, w: 5.4, h: 1.7, fontFace: MONO, fontSize: 12.5, color: 'BFD6EE', valign: 'top', margin: 0, isTextBox: true, objectName: 'code' })
    take(s, '每个单选题都留一个**"其他"出口**，不然它会硬选一个最像的。', 'cy', 4.4, 7.0, 5.73, 15)
  }
  // ---- 22 ----
  {
    const s = newSlide('真实案例', 22, '案例 4｜海量分类：以前不值得上 AI 的小判断', '真实案例 · 海量分类')
    kpi(s, L, 1.75, 2.95, 1.75, '$0.08', '1,018 篇论文分 24 类\n（先让大模型写摘要，要 $3.99）', 'cy', 30)
    kpi(s, L + 3.15, 1.75, 2.95, 1.75, '40 s', '724 条广告 / 37 品牌\n花费 $0.09', 'cy', 30)
    kpi(s, L, 3.7, 2.95, 1.75, '$0.13', '3,282 条推文 × 8 题\n8 分 34 秒', 'cy', 30)
    kpi(s, L + 3.15, 3.7, 2.95, 1.75, '14 s', '320 份 Agent 会话日志\n（200 万 token）花费 $0.08', 'cy', 30)
    pic(s, 'pg-jev.jpg', 7.0, 1.7, 5.73, 3.75)
    s.addText('在数据库查询里直接写自然语言条件：WHERE jev(people,\'…\')，129 行约 1 秒 / $0.0009（作者自报）', { x: 7.0, y: 5.5, w: 5.73, h: 0.6, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    take(s, '输入极便宜 + 输出免费 → **逐条判断**可以变成默认选项。下一页现场试 100 条。', 'cy', 6.25)
  }
  // ---- 23 Demo3 ----
  {
    const s = newSlide('真实案例', 23, '现场演示 4：100 条并行分类', 'DEMO 4 · 网页版演讲站里现场操作')
    demoSteps(s, ['100 条**互不重复**的用户反馈，每条都有预设答案：表扬 / 故障 / 建议 / 投诉', '最后 4 条是"功能挺好用的，就是价格涨得有点狠"这类**先夸后骂**的转折句', '点"并行判 100 条"（10 个并发），看总耗时、平均单次、花费、**与预设答案一致**', '花费用接口返回的 token 数算：每条约 380 个，**大部分是题目本身**'], '本页为 PPT 版：真实实测结果；现场请切换到网页版演讲站（第 23 页）。句子是自己写的、意思清楚，别讲成"100% 准确"。')
    card(s, 6.6, 1.8, 6.13, 4.2, { accent: 'cy', tag: '真实调用结果（本机实测）', title: '' })
    kpi(s, 6.85, 2.15, 2.7, 1.0, '~5 s', '总耗时', 'cy', 24)
    kpi(s, 9.75, 2.15, 2.7, 1.0, '~290 ms', '平均单次', 'cy', 24)
    kpi(s, 6.85, 3.25, 2.7, 1.0, '$0.0016', '估算花费（输入）', 'gn', 24)
    kpi(s, 9.75, 3.25, 2.7, 1.0, '100%', '与预设答案一致', 'gn', 24)
    const H = (t) => ({ text: t, options: { bold: true, color: C.accent1, fill: { color: '0F1C33' } } })
    const OK = (t) => ({ text: t, options: { color: C.accent3, fontFace: MONO } })
    s.addTable([
      [H('材料'), H('预设'), H('Jev'), H('把握度')],
      ['功能挺好用的，就是价格涨得有点狠', 'complaint', OK('complaint ✓'), '100%'],
      ['界面很漂亮，但是导出一直报错', 'bug', OK('bug ✓'), '100%'],
      ['客服很耐心，可惜问题还是没解决', 'complaint', OK('complaint ✓'), '95%'],
      ['希望修一下闪退，修好了我就续费', 'bug', OK('bug ✓'), '100%'],
    ], { x: 6.85, y: 4.4, w: 5.65, colW: [2.45, 1.0, 1.4, 0.8], fontSize: 10.5, color: 'E8EEF9', fill: { color: '0A1426' }, border: { type: 'solid', color: '1B2942', pt: 0.5 }, rowH: 0.3, valign: 'middle', objectName: 'batch-table' })
  }
  // ---- 24 ----
  {
    const s = newSlide('真实案例', 24, '案例 5｜招聘初筛：成本降 88%，10 天上线', '真实案例 · 招聘初筛（可跳过）')
    s.addText([{ text: '−88%', options: { fontFace: MONO, fontSize: 66, bold: true, color: C.accent3 } }, { text: ' 每千人筛选成本', options: { fontSize: 18, color: C.text2 } }], { x: L, y: 1.75, w: 6, h: 1.2, margin: 0, isTextBox: true, objectName: 'kpi-big' })
    s.addText(rich('**Jack & Jill**（AI 招聘平台）：每个岗位每天 6,000 名候选人，初筛出 2,000 名。从某轻量大模型换成 Jev，10 天从测试到全量。', { fontSize: 15, color: C.text1 }), { x: L, y: 3.1, w: 5.6, h: 1.6, margin: 0, isTextBox: true, objectName: 'p' })
    take(s, '保留率 93.9% → 94.6%，差异**未达统计显著**，按"持平"理解；年省金额为公司预估（官方自报）。', 'am', 4.9, L, 5.8, 13)
    s.addTable([
      [{ text: '指标', options: { bold: true, color: C.accent1 } }, { text: '替换前', options: { bold: true, color: C.accent1 } }, { text: '替换后', options: { bold: true, color: C.accent1 } }],
      ['每千人成本', '$0.755', '$0.092'], ['单人耗时（中位）', '20.3 s', '10.3 s'], ['资料检查耗时', '3.6 s', '0.2 s'], ['赢家保留率（最终胜出的人没被误筛掉）', '93.9%', '94.6%'],
    ], { x: 6.9, y: 1.85, w: 5.83, colW: [3.1, 1.35, 1.38], fontSize: 14, color: 'E8EEF9', fill: { color: '0F1C33' }, border: { type: 'solid', color: '1B2942', pt: 0.75 }, rowH: 0.62, valign: 'middle', objectName: 'table' })
  }
  // ---- 25 ----
  {
    const s = newSlide('真实案例', 25, '案例 6｜文档处理：DocJev', '真实案例 · 文档处理')
    bullets(s, [
      '**Jerry Liu 开源**：用自然语言告诉 Jev 文档有哪几类，Jev 给 PDF / Word / PPT 分类，或判断多份文档拼在一起时的**分界在哪**',
      '40 份文档分类 **40/40**；8 个五份文档合订包，**7/8** 拆对（对比的大模型 8/8）',
      '输出类别概率、分界分数、**需要复核的标记**',
      '2 天内 400+ 人收藏（GitHub）',
    ], L, 1.8, 6.2, 3.7, 15)
    take(s, '作者自己说明：小样本、描述性结果，**不代表泛化准确率**。', 'am', 5.55, L, 6.2, 14)
    kpi(s, 7.2, 1.8, 2.6, 1.55, '139 ms', 'Jev 分类中位', 'cy', 26)
    kpi(s, 10.0, 1.8, 2.73, 1.55, '794 ms', '某大模型', 'rd', 26)
    kpi(s, 7.2, 3.55, 2.6, 1.55, '210 ms', 'Jev 拆包中位', 'cy', 26)
    kpi(s, 10.0, 3.55, 2.73, 1.55, '1,352 ms', '某大模型', 'rd', 26)
    s.addText('延迟不含"把图片转成文字"的时间。项目自带对比页，可和大模型并排看', { x: 7.2, y: 5.3, w: 5.53, h: 0.6, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
  }
  // ---- 26 ----
  {
    const s = newSlide('真实案例', 26, '案例 7｜开发者工具：检索与护栏', '真实案例 · 开发者工具')
    const c = [['siftr · 按意思搜代码', '82%', '在"找出该改哪个文件"的评测里，**正确文件排进前 5** 的比例；传统关键词搜索只有 52% 和 22%'], ['jgrep · 按意思搜索', '4.6 s', '994 条技术社区的标题，花费 **$0.012**'], ['toolgate · 工具调用防火墙', '~1 s', '给编码 Agent 的每次工具调用判"安全 / 要确认 / 拦截"，每次不到一分钱']]
    c.forEach((x, i) => {
      card(s, L + i * 4.1, 1.8, 3.93, 2.9, { accent: 'cy', tag: x[0], title: '' })
      s.addText(x[1], { x: L + i * 4.1 + 0.2, y: 2.2, w: 3.5, h: 0.8, fontFace: MONO, fontSize: 36, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: 'kpi' })
      s.addText(rich(x[2], { fontSize: 16, color: C.text1 }), { x: L + i * 4.1 + 0.2, y: 3.1, w: 3.55, h: 1.5, margin: 0, valign: 'top', isTextBox: true, objectName: 'kpi-text' })
      check('c8', plain(x[2]), 16, 3.4, 1.5)
    })
    card(s, L, 4.9, 5.95, 1.3, { tag: '主流 Agent 开发框架已集成', body: '能按任务难度在快模型 / 强模型之间选；也能在 AI 动手前拦截高风险动作', bodySize: 16 })
    card(s, L + 6.18, 4.9, 5.95, 1.3, { tag: '模式：先检索，再判断', body: '先用代码把无关内容筛掉，再交给 Jev——**材料越杂越不准**', bodySize: 16 })
  }
  // ---- 27 ----
  {
    const s = newSlide('真实案例', 27, '好玩的演示：看个热闹，别当真', '真实案例 · 好玩的演示（可跳过）')
    const items = [['tetris.jpg', '**俄罗斯方块**：每落一块就是一道单选（放哪列、转几次）'], ['city.jpeg', '**Jevton 小镇**：120 居民、20 家企业，每小时替每个人做一次决定'], ['sim.jpeg', '**仿真与控制**：约 0.1 秒一次决策。官方 Doom 演示每秒约 10 次，**喂的是坐标，不是画面**']]
    items.forEach((it, i) => {
      pic(s, it[0], L + i * 4.1, 1.8, 3.93, 2.7)
      s.addText(rich(it[1], { fontSize: 13, color: C.text2 }), { x: L + i * 4.1, y: 4.65, w: 3.93, h: 1.3, margin: 0, valign: 'top', isTextBox: true, objectName: 'cap' })
      check('c9', plain(it[1]), 13, 3.8, 1.3)
    })
    take(s, '它们说明 Jev 能**高频地做决策**，不说明它会玩游戏。网上"自动驾驶"之类的说法没有可靠依据，当形状探索看就好。', 'am', 6.1, L, W, 15)
  }

  // =================== F ===================
  addSec('以后用在哪')
  // ---- 28 ----
  {
    const s = newSlide('以后用在哪', 28, '以后能用在哪：判断标准', '以后用在哪 · 判断标准')
    take(s, '现在用大模型、但**其实只让它返回一个选项**的地方；或者"以前不值得上 AI"的小判断。', 'cy', 1.8, L, W, 20)
    const f = [['高频', '每秒多次', 'UI、游戏、实时控制'], ['大批量', '百万条', '逐条判，输出免费'], ['要快', '用户在等', '几百毫秒内给结果'], ['要闸门', '按把握分流', '自动 / 复核 / 人工']]
    f.forEach((x, i) => card(s, L + i * 3.07, 2.8, 2.9, 1.9, { accent: 'cy', tag: x[0], title: x[1], titleSize: 19, body: x[2], bodySize: 17 }))
    card(s, L, 4.95, W, 1.2, { accent: 'rd', tag: '不适合', body: '写作、开放问答、看图、要解释理由的场景 · 规则已经能稳定解决的（**别为了用模型而用模型**）', bodySize: 18, valign: 'middle' })
  }
  // ---- 29 ----
  {
    const s = newSlide('以后用在哪', 29, '前端 / 产品视角的 8 个方向', '以后用在哪 · 8 个方向（头脑风暴）')
    card(s, L, 1.8, 5.95, 3.9, { accent: 'gn', tag: '已有人跑通', body: ['**① 评论 / 用户发布内容 / 表单实时初审**（输入即判）', '**② 客服与工单入口分流**：情绪、紧急度、部门', '**③ 自动化测试 / 浏览器 Agent**里"点哪个"', '**④ AI 功能的路由器**：简单问题走小模型，Agent 工具调用护栏'], bodySize: 18, valign: 'middle' })
    card(s, L + 6.18, 1.8, 5.95, 3.9, { accent: 'pu', tag: '我们的设想（待验证）', body: ['**⑤ 搜索 / 筛选**：自然语言 → 筛选项或意图分类', '**⑥ 埋点 / 日志 / 报错**自动分级，告警降噪', '**⑦ 自适应 UI**：预测用户下一步，个性化入口', '**⑧ 研发效率**：代码改动风险分级、Bug / 需求自动打标签'], bodySize: 18, valign: 'middle' })
    take(s, '**游戏平台里的例子：**玩家评论 / 聊天实时审核 · 客服工单（充值、封号、BUG）分流 · 玩家反馈打标签。讨论：我们有哪些调用"只返回一个选项"？', 'cy', 5.95, L, W, 15)
  }
  // ---- 30 ----
  {
    const s = newSlide('以后用在哪', 30, '趋势：AI 调用在分层', '以后用在哪 · 趋势')
    card(s, L, 1.8, 5.5, 1.9, { accent: 'cy', tag: '军师', title: '大模型', body: '拆解复杂任务、写代码、写文案', bodySize: 18 })
    card(s, L, 3.9, 5.5, 1.9, { accent: 'pu', tag: '传令兵', title: 'Jev 这类判断模型', body: '成百上千次的工具分拣、条件路由、合规拦截', bodySize: 18 })
    bullets(s, ['**杰文斯悖论**：东西变便宜以后，用量往往**不降反升**——Jev 的名字就来自它', '同类已经跟进：**OpenAI Decisions API、Cloudflare Clef、微软**', '题目和代码写好后，**换供应商成本很低**：别绑死一家', '更本质的启发：程序之间交互，真的每一步都需要长篇自然语言吗？'], 6.5, 1.85, 6.2, 4.0, 15)
    take(s, '给系统装上一枚枚毫秒级响应的**智能 if**。', 'cy', 6.15)
  }

  // =================== D ===================
  addSec('上手')
  // ---- 31 ----
  {
    const s = newSlide('上手', 31, '怎么上手：从建 Key 到跑通', '上手 · 建 Key 到跑通')
    s.addText(mkRuns(['**建 Key**（接口密钥）：console.typesafe.ai → API Keys → 存成环境变量 TYPESAFE_API_KEY', '**先玩 Playground（试验场）**：左贴材料、右写题目、点 Run', '**发一条请求**：直接调用 API（接口），或用官方 SDK（开发工具包）', '**上生产**：写死模型版本，别用 jev-latest'], { size: 15, bullet: 'number', after: 8 }), { x: L, y: 1.8, w: 5.9, h: 2.7, valign: 'top', margin: 0, isTextBox: true, objectName: 'steps' })
    take(s, '⚠ Key 只放在后端服务里，**不进浏览器、不进代码仓库、不发群**。', 'rd', 4.4, L, 5.9, 14)
    card(s, L, 5.15, 5.9, 0.95, { body: ['**官网** typesafe.ai　**文档** docs.typesafe.ai', '**控制台** console.typesafe.ai/home'], bodySize: 13, valign: 'middle' })
    s.addText('也可以通过 OpenRouter 等第三方平台调用，不用排队；账号政策、赠金变动快，以控制台为准。', { x: L, y: 6.2, w: 5.9, h: 0.5, fontSize: 11, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    pic(s, 'console.jpg', 6.9, 1.7, 5.83, 3.9)
    s.addText('控制台首页：① 复制 Agent 提示　② 查看 Token 用量　③ 核心功能演示', { x: 6.9, y: 5.65, w: 5.83, h: 0.4, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
  }
  // ---- 32 控制台：两张截图并排 ----
  {
    const s = newSlide('上手', 32, '控制台实操：不写代码先跑通', '上手 · console.typesafe.ai 的 Playground')
    s.addText('https://console.typesafe.ai/home', { x: 6.2, y: 0.5, w: 6.53, h: 0.5, fontFace: MONO, fontSize: 12, color: C.accent1, align: 'right', valign: 'middle', margin: 0, isTextBox: true, objectName: 'link' })
    pic(s, 'playground-home.png', L, 1.7, 5.95, 3.0)
    pic(s, 'playground-run.png', L + 6.18, 1.7, 5.95, 3.0)
    card(s, L, 4.8, 5.95, 1.25, { body: '**① 认界面**：左上写 State（材料），左下写 Questions（题目），点 Run request。右边是官方示例：热狗算三明治吗（是非）· 天空什么颜色（单选）· 猴子能创作艺术吗（打分）', bodySize: 12.5, valign: 'middle' })
    card(s, L + 6.18, 4.8, 5.95, 1.25, { body: '**② 用中文跑一次**：材料「我买的耳机用了两天就坏了，请帮我退款。」+ 两道题 → 退款 100%（把握度 100%）· 要退款 98% · 约 43 + 255 ms', bodySize: 12.5, valign: 'middle' })
    take(s, 'Playground 左边的两个框，就是 API 的 state 和 questions——**在这里调好题目，复制进代码就能用**。', 'cy', 6.2, L, W, 15)
  }
  // ---- 34 / 35 写题规则 ----
  {
    const s = newSlide('上手', 33, '写题规则 ①：哪些是固定的，哪些自己起名', '上手 · 写题规则（最外层固定为 model / state / questions）')
    const FX = C.accent1, TV = C.accent2, NM = C.accent5, TX = C.accent3, PU = '6F8399'
    const lines = [
      [['{', PU]],
      [['  "request_type"', NM], [': {', PU]],
      [['    "type"', FX], [': ', PU], ['"choice"', TV], [',', PU]],
      [['    "instructions"', FX], [': ', PU], ['"根据 message，判断用户的主要诉求。"', TX], [',', PU]],
      [['    "criteria"', FX], [': {', PU]],
      [['      "refund"', NM], [': ', PU], ['"要求退款"', TX], [',', PU]],
      [['      "repair"', NM], [': ', PU], ['"要求维修"', TX], [',', PU]],
      [['      "other"', NM], [': ', PU], ['"其他诉求"', TX]],
      [['    }', PU]],
      [['  },', PU]],
      [['  "wants_refund"', NM], [': {', PU]],
      [['    "type"', FX], [': ', PU], ['"noul"', TV], [',', PU]],
      [['    "instructions"', FX], [': ', PU], ['"message 中的用户是否明确要求退款？"', TX]],
      [['  }', PU]],
      [['}', PU]],
    ]
    s.addShape(pres.ShapeType.roundRect, { x: L, y: 1.65, w: 5.75, h: 4.0, fill: { color: '050912' }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08, objectName: 'code-bg' })
    const runs = []
    lines.forEach((ln, i) => ln.forEach(([t, col], j) => runs.push({ text: t, options: { color: col, fontFace: MONO, fontSize: 11.5, breakLine: j === ln.length - 1 && i < lines.length - 1 } })))
    s.addText(runs, { x: L + 0.15, y: 1.75, w: 5.45, h: 3.8, valign: 'top', margin: 0, isTextBox: true, objectName: 'code' })
    s.addText([
      { text: '■ 固定字段名　', options: { color: FX } }, { text: '■ 规定的类型值　', options: { color: TV } },
      { text: '■ 自己起名　', options: { color: NM } }, { text: '■ 自己填写的内容', options: { color: TX } },
    ], { x: L, y: 5.7, w: 5.75, h: 0.35, fontSize: 11, margin: 0, isTextBox: true, objectName: 'legend' })
    const H = (t) => ({ text: t, options: { bold: true, color: C.accent1, fill: { color: '0F1C33' } } })
    const T = (t, c) => ({ text: t, options: { color: c, bold: true } })
    s.addTable([
      [H('内容'), H('是否固定'), H('说明')],
      ['request_type、wants_refund', T('自己命名', NM), '题目的名字，可改成 category 等；结果用同名字段返回'],
      ['type', T('固定字段名', FX), '告诉 Jev 用哪种方式回答'],
      ['"choice"、"noul"', T('规定的类型值', TV), '只能从 choice / noul / score / box 里选，不能随意编'],
      ['instructions', T('固定字段名', FX), '后面的问题内容由你填写'],
      ['criteria', T('固定字段名', FX), '定义选项或评分标准，具体格式取决于 type'],
      ['refund、repair、other', T('自己命名', NM), '选项标识，选中后返回这个名字'],
      ['"要求退款" 等', T('自己填写', TX), '解释每个选项代表什么'],
    ], { x: 6.55, y: 1.65, w: 6.18, colW: [2.0, 1.3, 2.88], fontSize: 12, color: 'E8EEF9', fill: { color: '0F1C33' }, border: { type: 'solid', color: '1B2942', pt: 0.75 }, rowH: 0.5, valign: 'middle', objectName: 'rules-table' })
    take(s, '一句话：**固定的是"形状"（字段名和类型），自己写的是"内容"（题目、选项、说明）。**', 'cy', 6.2, L, W, 16)
  }
  {
    const s = newSlide('上手', 34, '写题规则 ②：type 只能四选一', '上手 · 写题规则（规定回答形式，内容由你写）')
    const H = (t) => ({ text: t, options: { bold: true, color: C.accent1, fill: { color: '0F1C33' } } })
    const K = (t) => ({ text: t, options: { bold: true, color: C.accent2, fontFace: MONO } })
    s.addTable([
      [H('type'), H('回答形式'), H('criteria 怎么写'), H('返回什么')],
      [K('noul'), '是非题', '通常不需要', 'noul：0–1 的"是"的概率'],
      [K('choice'), '单选题', '对象：选项名 → 说明，最多 255 个', 'choice（选中的名字）、probabilities（各项概率）、confidence'],
      [K('score'), '打分题', '数组：从低到高的等级说明', 'score（可为小数）、probabilities、confidence'],
      [K('box'), '框选（需图片）', '不需要，只写 instructions', 'box（top/bottom/left/right，0–1 比例）+ confidence；需图片和 Danger-Zone-Images 请求头'],
    ], { x: L, y: 1.65, w: W, colW: [1.2, 1.5, 4.0, 5.43], fontSize: 13, color: 'E8EEF9', fill: { color: '0F1C33' }, border: { type: 'solid', color: '1B2942', pt: 0.75 }, rowH: 0.62, valign: 'middle', objectName: 'types-table' })
    const rules = [['规矩 1', '选项要**互斥**：别同时写"售后"和"退货"，除非你能一句话说清差别'], ['规矩 2', '单选题留一个 other：不然它会**硬选**一个最像的'], ['规矩 3', '名字用**英文 + 下划线**：代码里要用它读结果'], ['规矩 4', '**一题只问一件事**；同一份材料的多道题，合并成一次请求']]
    rules.forEach((r, i) => card(s, L + i * 3.08, 4.9, 2.93, 1.25, { accent: 'cy', tag: r[0], body: r[1], bodySize: 12.5 }))
    take(s, '报错先查：type 拼写；单选的 criteria 用**对象**、打分的用**数组**。', 'am', 6.3, L, W, 15)
  }
  // ---- 35 MCP / Skill / Harness ----
  {
    const s = newSlide('上手', 35, 'MCP、Skill 与 Harness', '上手 · 先认三个词')
    card(s, L, 1.9, 3.9, 3.9, { accent: 'cy', tag: 'MCP · 管"能连上什么"', title: 'Model Context Protocol\n模型上下文协议', body: '让 AI 连外部系统（数据库、Slack、文档）的统一接口标准，像 AI 的 **USB-C 口**：3 个 AI × 4 个工具，12 套对接变成 3 + 4 = 7。', bodySize: 17, titleSize: 19, valign: 'middle' })
    card(s, L + 4.1, 1.9, 3.9, 3.9, { accent: 'pu', tag: 'SKILL · 管"该怎么做"', title: 'Skill（技能包）\n写给 AI 的操作手册', body: '一个文件夹：说明书 + 脚本示例，**用到才读入**，不撑爆上下文。像新人入职手册。', bodySize: 17, titleSize: 19, valign: 'middle' })
    card(s, L + 8.2, 1.9, 3.93, 3.9, { accent: 'gn', tag: 'HARNESS · 管"怎么跑起来"', title: 'Harness（运行框架）\n包在大模型外的整辆车', body: '大模型是发动机，Harness 负责循环、调工具、管上下文。**Claude Code 本身就是一个。**', bodySize: 17, titleSize: 19, valign: 'middle' })
    take(s, '下一页马上用到：官方 **Skill** 教编码助手怎么写调用代码，文档 **MCP** 让它随时查最新官方文档。')
  }

  // ---- 36 ----
  {
    const s = newSlide('上手', 36, '在 Claude Code / Codex 里用起来', '上手 · 编码助手')
    take(s, '编码助手负责**写调用 Jev 的代码**；Jev 在**你的应用里**做判断。它替换不了助手背后的模型。', 'cy', 1.7, L, W, 16)
    card(s, L, 2.55, 5.95, 2.1, { accent: 'cy', tag: 'CLAUDE CODE · 安装官方 Skill（技能包）', title: '' })
    s.addText('claude plugin marketplace add typesafe-ai/skills\nclaude plugin install typesafe@typesafe-ai\n# 调用：/typesafe:typesafe-ai\n# 或提示词里写 "use the TypeSafe skill"', { x: L + 0.2, y: 3.0, w: 5.55, h: 1.5, fontFace: MONO, fontSize: 12.5, color: 'BFD6EE', valign: 'top', margin: 0, isTextBox: true, objectName: 'code' })
    card(s, L + 6.18, 2.55, 5.95, 2.1, { accent: 'pu', tag: 'CODEX / CURSOR', title: '' })
    s.addText('npx skills add typesafe-ai/skills \\\n  --skill typesafe-ai -a codex -a cursor -y\n# Codex 里：$typesafe-ai\n# Cursor Agent 里：/ 选 typesafe-ai', { x: L + 6.38, y: 3.0, w: 5.55, h: 1.5, fontFace: MONO, fontSize: 12.5, color: 'BFD6EE', valign: 'top', margin: 0, isTextBox: true, objectName: 'code' })
    card(s, L, 4.85, 5.95, 1.6, { tag: '可选：文档 MCP（让助手直接查官方文档）', body: 'claude mcp add --transport http typesafe-docs https://docs.typesafe.ai/mcp\n同一工具只用一种装法，否则 skill 重复加载', bodySize: 13 })
    card(s, L + 6.18, 4.85, 5.95, 1.6, { accent: 'gn', tag: '推荐第一条提示词', body: '"用 TypeSafe skill 扫一遍项目，列出哪些写得很脆弱的文本匹配规则、或要求 AI 输出固定格式的地方，可以换成判断，**先给清单，别改代码**。"', bodySize: 15 })
  }

  // =================== E ===================
  addSec('水分与落地')
  // ---- 33 ----
  {
    const s = newSlide('水分与落地', 37, '挤水分：六个坑', '水分与落地 · 六个坑')
    card(s, L, 1.7, 5.9, 2.35, { accent: 'rd', tag: '宣传 vs 现实', body: ['68% 准确率是"和两个前沿大模型一致的程度"，不是真值', '有标注数据时，**先训一个传统小模型**：在一个银行客服题库上，传统小模型 93.3% 胜过 Jev 83.2%（据转述，未核对原评测）', '简单规则可能更准：识别钓鱼邮件，两条文本匹配规则 91.8% vs Jev 62.6%'], bodySize: 13.5 })
    pic(s, 'projects217.jpeg', L, 4.2, 5.9, 1.5)
    s.addText('217 个 Jev 项目，今天能直接用的只有 15 个', { x: L, y: 5.78, w: 5.9, h: 0.35, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    const hdr = (t) => ({ text: t, options: { bold: true, color: C.accent1, fill: { color: '0F1C33' } } })
    s.addTable([
      [hdr('坑'), hdr('对策')],
      ['数数 / 算术 / 日期不可靠', '代码里算好再给它'], ['材料越杂越不准', '先裁剪，只留判断要用的字段'], ['中文弱于英文', '用中文真实样本盲测'],
      ['提示词注入（输入里夹带指令）', '不可逆动作另设硬规则'], ['偏向第一个选项', '测试时打乱选项顺序'], ['只给概率不给理由', '另记输入、选项、把握日志'],
    ], { x: 6.8, y: 1.7, w: 5.93, colW: [3.0, 2.93], fontSize: 12, color: 'E8EEF9', fill: { color: '0F1C33' }, border: { type: 'solid', color: '1B2942', pt: 0.75 }, rowH: 0.36, valign: 'middle', objectName: 'pitfalls' })
    pic(s, 'fails.jpeg', 6.8, 4.5, 5.93, 1.35)
    s.addText('作者把 Jev 塞进日常工具，四次全败：看不到内容、订阅制没省钱空间', { x: 6.8, y: 5.9, w: 5.93, h: 0.35, fontSize: 12, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
  }
  // ---- 34 ----
  {
    const s = newSlide('水分与落地', 38, '落地三步：盘点、盲测、双轨', '水分与落地 · 三步')
    card(s, L, 1.75, 5.4, 1.5, { accent: 'cy', tag: '01 · 盘点', body: '列出所有**"只要返回一个选项"**的调用：分类、路由、审核、打分。一个都没有，就别追这个热点。', bodySize: 16 })
    card(s, L, 3.4, 5.4, 1.5, { accent: 'pu', tag: '02 · 盲测', body: '**30 条**以上真实旧数据、人工先标答案；按把握度 0.9 / 0.7 切成三档，**看每一档各对多少**；选项打乱顺序再测一遍。', bodySize: 15 })
    card(s, L, 5.05, 5.4, 1.5, { accent: 'gn', tag: '03 · 双轨', body: '旧规则照跑，Jev 只记日志**一周**；只有"高把握档"且和旧结果一致的才切自动，阈值从 0.9 起步。', bodySize: 15 })
    pic(s, 'dual.jpg', 6.3, 1.65, 3.2, 4.95)
    pic(s, 'checklist.jpg', 9.6, 1.65, 3.13, 4.95)
  }

  // =================== 压轴 ===================
  addSec('压轴演示')
  // ---- 39 拆解 ----
  {
    const s = newSlide('压轴演示', 39, '压轴：一个会变形的输入框', '压轴演示 · 把今天讲的串起来')
    node(s, L, 1.75, 1.5, 0.75, '你打一句话', 'cy'); arrow(s, L + 1.5, 1.9, 0.35)
    node(s, L + 1.85, 1.75, 1.75, 0.75, 'Jev：8 道题\n一次请求并行', 'pu'); arrow(s, L + 3.6, 1.9, 0.35)
    node(s, L + 3.95, 1.75, 1.55, 0.75, '代码：解析 + 计算', 'gn'); arrow(s, L + 5.5, 1.9, 0.35)
    node(s, L + 5.85, 1.75, 0.9, 0.75, '卡片', 'am')
    card(s, L, 2.75, 6.75, 1.85, { accent: 'cy', tag: 'JEV 只管"判断"', body: ['**intent** 单选：15 种卡片（日程 / 提醒 / 清单 / 计时 / AA / 换算 / 投票……）+ none 出口', '**readiness / urgency** 打分：写完整了吗、急不急', '**eventMode / expenseCategory / timerKind** 单选，**isShoppingList / recurring** 是非：决定卡片细节'], bodySize: 12.5 })
    card(s, L, 4.75, 6.75, 1.25, { accent: 'gn', tag: '代码负责"计算"', body: '日期、金额、人数、单位、算式全部由代码解析：**不让模型数数、算账、推日期**（对应"六个坑"第一条）', bodySize: 13 })
    card(s, 7.55, 1.75, 5.18, 2.75, { accent: 'pu', tag: '界面上的"按把握分流"', title: '' })
    const H = (t) => ({ text: t, options: { bold: true, color: C.accent1, fill: { color: '0F1C33' } } })
    s.addTable([
      [H('把握度'), H('界面怎么变')],
      ['< 0.4 或 none', '留在输入态，不打扰'], ['0.4 – 0.7', '半透明"虚影"，按 Tab 才确认'], ['≥ 0.7', '直接变成卡片'], ['前两名差 < 0.15', '不替你猜，给两个按钮让你选'],
    ], { x: 7.75, y: 2.15, w: 4.8, colW: [1.7, 3.1], fontSize: 12, color: 'E8EEF9', fill: { color: '0A1426' }, border: { type: 'solid', color: '1B2942', pt: 0.5 }, rowH: 0.42, valign: 'middle', objectName: 'shift-table' })
    card(s, 7.55, 4.65, 5.18, 1.35, { accent: 'am', tag: '防抖：不让界面闪', body: '已定型的卡片，要被另一种**连赢两次**或**把握 ≥ 0.85** 才换；"紧急"越过 1.2 才亮、跌破 1.0 才灭', bodySize: 12.5 })
    take(s, '口号：**Jev decides, code computes.** 思路来自开源项目 anishfn/shapeshift（MIT），这里改成了中文输入。', 'cy', 6.2, L, W, 15)
  }
  // ---- 40 Demo 5 ----
  {
    const s = newSlide('压轴演示', 40, '现场演示 5：会变形的输入框', 'DEMO 5 · 网页版演讲站里现场操作')
    demoSteps(s, [
      '「明天中午和小王、小李吃饭」→ **日程** 98%：日期、人名都是**代码算的**',
      '「周五晚上8点和产品组开腾讯会议」→ 日程，eventMode 信号 = 视频会议',
      '「提醒我明天交房租，很急」→ **提醒**，urgency 越过 1.2，亮"紧急"',
      '连点：AA 分账 / 换算 / 计算 / 投票 / 倒数日 / 掷骰子，卡片都能点',
      '「活动页可以加个倒计时」→ 只有约 50% 把握，只给**虚影**，按 Tab 才确认',
      '自己一个字一个字打：信息不够时不打扰，够了才变形',
    ], '本页为 PPT 版：真实实测结果；现场请切换到网页版演讲站（第 40 页）。Tab 确认虚影 · Enter 保存 · Esc 清空。')
    card(s, 6.6, 1.8, 6.13, 4.2, { accent: 'cy', tag: '真实调用结果（10 月 28 日，单次约 250 ms）', title: '' })
    const OK = (t) => ({ text: t, options: { color: C.accent3, fontFace: MONO } })
    const AM = (t) => ({ text: t, options: { color: C.accent5, fontFace: MONO } })
    const H = (t) => ({ text: t, options: { bold: true, color: C.accent1, fill: { color: '0F1C33' } } })
    s.addTable([
      [H('输入'), H('Jev 判断'), H('代码算出的卡片')],
      ['明天中午和小王、小李吃饭', OK('日程 98%'), '10月29日 周四 12:00 · 小王、小李'],
      ['提醒我明天交房租，很急', OK('提醒 100%'), '交房租 · 明天 · 🔴 紧急'],
      ['2400块3个人AA', OK('AA 100%'), '每人 ¥800'],
      ['5英里是多少公里', OK('换算 100%'), '5 英里 = 8.05 公里'],
      ['3450的18%是多少', OK('计算 100%'), '3,450 × 18% = 621'],
      ['距离春节还有几天', OK('倒数日 100%'), '101 天（2027-02-06）'],
      ['活动页可以加个倒计时', AM('倒数日 ~50%'), '只给虚影，等你确认'],
    ], { x: 6.8, y: 2.2, w: 5.75, colW: [2.15, 1.25, 2.35], fontSize: 10.5, color: 'E8EEF9', fill: { color: '0A1426' }, border: { type: 'solid', color: '1B2942', pt: 0.5 }, rowH: 0.44, valign: 'middle', objectName: 'shift-results' })
  }

  // =================== 收尾 ===================
  addSec('收尾')
  // ---- 41 ----
  {
    const s = newSlide('收尾', 41, '带走三句话', 'TAKEAWAYS')
    card(s, L, 1.8, 3.93, 3.7, { accent: 'cy', tag: '01', title: '不是更便宜的大模型', body: '是只会"涂答题卡"的判断零件：赢在**稳定低延迟 + 带把握度的答案 + 几乎免费的输出**', bodySize: 18, titleSize: 20, valign: 'middle' })
    card(s, L + 4.1, 1.8, 3.93, 3.7, { accent: 'pu', tag: '02', title: '最值钱：按把握分流', body: '高把握自动过，中间交大模型，低把握转人工', bodySize: 18, titleSize: 20, valign: 'middle' })
    card(s, L + 8.2, 1.8, 3.93, 3.7, { accent: 'gn', tag: '03', title: '先盲测，再双轨', body: '别急着 All in；今天好用的多是**接口**，不是成品。不可逆动作始终留硬规则', bodySize: 18, titleSize: 20, valign: 'middle' })
    take(s, 'NEXT ACTION：会后把业务里**"只要返回一个选项"**的场景发给我，一起挑一个做盲测。', 'cy', 5.9, L, W, 17)
  }
  // ---- 42 谢谢 ----
  {
    const s = pres.addSlide({ masterName: 'COVER', sectionTitle: '收尾' })
    pic(s, 'machine.jpeg', L, 2.1, 5.83, 3.3)
    s.addText('ONE ANSWER. HOW SURE.', { x: L, y: 5.5, w: 5.83, h: 0.3, fontFace: MONO, fontSize: 10, color: C.text2, margin: 0, isTextBox: true, objectName: 'cap' })
    s.addText('THANK YOU', { x: 7.1, y: 1.9, w: 5.6, h: 0.3, fontFace: MONO, fontSize: 11, color: C.accent1, margin: 0, charSpacing: 3, isTextBox: true, objectName: 'eyebrow' })
    s.addText('谢谢大家', { x: 7.1, y: 2.4, w: 5.6, h: 1.1, fontSize: 54, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: 'thanks' })
    s.addShape(pres.ShapeType.rect, { x: 7.1, y: 3.9, w: 5.6, h: 0.01, fill: { color: C.text2, transparency: 70 }, line: { type: 'none' }, objectName: 'cover-divider' })
    s.addText([{ text: '分享人    ', options: { fontSize: 12, color: C.accent1, charSpacing: 3 } }, { text: '黄冠豪', options: { fontSize: 28, bold: true, color: C.text1 } }], { x: 7.1, y: 4.05, w: 5.6, h: 0.6, valign: 'middle', margin: 0, isTextBox: true, objectName: 'cover-meta-name' })
    s.addText('研发中心 / 游戏平台项目部', { x: 7.1, y: 4.65, w: 5.6, h: 0.4, fontSize: 17, color: C.text2, margin: 0, isTextBox: true, objectName: 'cover-meta' })
    s.addNotes(notes[42] || '')
  }

  await pres.writeFile({ fileName: OUT })
  await fixParagraphProps(OUT)
  await applyTheme(OUT, THEME)
  console.log('written', OUT)
  if (warns.length) { console.log('\nFIT WARNINGS (' + warns.length + '):'); warns.forEach((w) => console.log(' -', w)) }
  else console.log('no fit warnings')
})().catch((e) => { console.error(e); process.exit(1) })
