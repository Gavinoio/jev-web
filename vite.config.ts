import { defineConfig, loadEnv, type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'

const API = 'https://api.typesafe.ai/v1/systemone'
type ApiResult = { ok: true; data: any } | { ok: false; error: string; final?: boolean }

// 本机代理会悄悄掐掉闲置约 10 秒的连接，而 fetch 的连接池会把请求派给这些"死连接"，一挂就是几十秒。
// 所以自己管连接：闲置 3 秒的连接主动关掉（远小于代理的 10 秒），复用时优先拿最近用过的那条（lifo）。
const agent = new https.Agent({ keepAlive: true, timeout: 3000, scheduling: 'lifo', maxFreeSockets: 4 })
// 连接状态，供 /api/status 排查用
const netStats = { connections: 0, warmOk: 0, warmFail: 0 }
const createConnection = agent.createConnection.bind(agent)
agent.createConnection = ((...args: any[]) => { netStats.connections++; return (createConnection as any)(...args) }) as any

function request(method: 'GET' | 'POST', url: string, headers: Record<string, string>, body: string | undefined, timeoutMs: number) {
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    const req = https.request(url, { method, agent, headers: body ? { ...headers, 'Content-Length': Buffer.byteLength(body) } : headers }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => { clearTimeout(t); resolve({ status: res.statusCode || 0, text: Buffer.concat(chunks).toString('utf8') }) })
      res.on('error', reject)
    })
    const t = setTimeout(() => req.destroy(Object.assign(new Error('timeout'), { name: 'TimeoutError' })), timeoutMs)
    req.on('error', (e) => { clearTimeout(t); reject(e) })
    req.end(body)
  })
}

async function attempt(key: string, payload: unknown, extraHeaders: Record<string, string>, timeoutMs: number): Promise<ApiResult> {
  try {
    const r = await request('POST', API, { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extraHeaders }, JSON.stringify(payload), timeoutMs)
    let data: any = null
    try { data = JSON.parse(r.text) } catch { data = { message: r.text.slice(0, 200) } }
    if (r.status >= 200 && r.status < 300) return { ok: true, data }
    let err = data?.error?.message || data?.error || data?.detail?.message || data?.message || `HTTP ${r.status}`
    if (typeof err !== 'string') err = JSON.stringify(err)
    // 4xx（429 除外）是请求本身有问题，再试也没用
    return { ok: false, error: err, final: r.status < 500 && r.status !== 429 }
  } catch (e: any) {
    return { ok: false, error: e?.name === 'TimeoutError' ? `超时（>${timeoutMs / 1000}s）` : String(e?.code || e?.message || e) }
  }
}

/**
 * 调用 Jev，带"对冲重试"：本机走代理时，偶尔有连接被挂起几十秒。
 * 第一次请求 hedgeMs 内没回来，就并行再发一次（最多 tries 次），谁先成功用谁；每次尝试有 timeoutMs 超时。
 * 偶尔多发一次的成本可以忽略（单次约 $0.00002）。
 */
function callApi(key: string, payload: unknown, extraHeaders: Record<string, string>, tries: number, timeoutMs: number, hedgeMs: number) {
  return new Promise<ApiResult>((resolve) => {
    let started = 0, settled = 0, done = false, lastErr = ''
    let hedge: ReturnType<typeof setTimeout> | undefined
    const launch = () => {
      if (done || started >= tries) return
      started++
      hedge = setTimeout(launch, hedgeMs)
      attempt(key, payload, extraHeaders, timeoutMs).then((r) => {
        settled++
        if (done) return
        if (r.ok || r.final) { done = true; clearTimeout(hedge); return resolve(r) }
        lastErr = r.error
        if (started < tries) { clearTimeout(hedge); setTimeout(launch, 200) }
        else if (settled >= started) { done = true; resolve({ ok: false, error: lastErr }) }
      })
    }
    launch()
  })
}

const readBody = (req: any) => new Promise<string>((ok) => { let b = ''; req.on('data', (c: any) => (b += c)); req.on('end', () => ok(b)) })
const sender = (res: any) => (obj: unknown, code = 200) => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(obj))
}

export function jevApi(env: Record<string, string>): Plugin {
  const model = env.JEV_MODEL || 'jev-latest'
  return {
    name: 'jev-api',
    configureServer(server) {
      // 保温：新建 TLS 连接要 0.7 秒左右，偶尔还会卡住。有 Key 时每 2.5 秒发一个不带 Key 的 GET（返回 404，不计费），
      // 让最近那条连接一直活着（上面的 agent 会关掉闲置 3 秒的连接）；30 分钟没人用 Demo 就停。
      if (env.TYPESAFE_API_KEY) {
        let lastUse = Date.now()
        server.middlewares.use((req, _res, next) => { if (req.url?.startsWith('/api/')) lastUse = Date.now(); next() })
        const warm = () => request('GET', new URL('/', API).href, {}, undefined, 4000).then(() => netStats.warmOk++, () => netStats.warmFail++)
        warm()
        const iv = setInterval(() => { if (Date.now() - lastUse < 30 * 60_000) warm() }, 2500)
        iv.unref?.()
        server.httpServer?.on('close', () => clearInterval(iv))
      }
      server.middlewares.use('/api/jev', async (req, res) => {
        const send = sender(res)
        if (req.method !== 'POST') return send({ ok: false, error: 'POST only' }, 405)
        try {
          const { state, questions } = JSON.parse(await readBody(req))
          const key = env.TYPESAFE_API_KEY
          if (!key) return send({ ok: false, error: '未配置 TYPESAFE_API_KEY，请在服务端 .env 中设置并重启服务' }, 503)
          const t0 = Date.now()
          const r = await callApi(key, { model, state, questions }, {}, 3, 8000, 1500)
          const ms = Date.now() - t0
          if (r.ok) return send({ ok: true, mode: 'live', ms, data: r.data })
          return send({ ok: false, ms, error: r.error }, 502)
        } catch (e: any) {
          send({ ok: false, error: String(e?.message || e) }, 400)
        }
      })
      // Box 题：需要图片 + TypeSafe-Danger-Zone-Images 头（官方标注为 "Dreamer-ready"，仅适合原型）
      server.middlewares.use('/api/jev-box', async (req, res) => {
        const send = sender(res)
        if (req.method !== 'POST') return send({ ok: false, error: 'POST only' }, 405)
        try {
          const { image, target } = JSON.parse(await readBody(req))
          const file = path.resolve(import.meta.dirname, 'public/img/box', path.basename(String(image)))
          if (!fs.existsSync(file)) return send({ ok: false, error: '找不到图片 ' + image }, 400)
          const key = env.TYPESAFE_API_KEY
          if (!key) return send({ ok: false, error: '未配置 TYPESAFE_API_KEY，请在服务端 .env 中设置并重启服务' }, 503)
          const t0 = Date.now()
          const ref = crypto.randomUUID()
          const payload = {
            model,
            state: { photo: ref },
            assets: { [ref]: { type: 'image', format: 'jpg', data_base64: fs.readFileSync(file).toString('base64') } },
            questions: {
              visible: { type: 'noul', instructions: `Is the following visible in \`photo\`: ${target}?` },
              target: { type: 'box', instructions: `${target} in \`photo\`` },
            },
          }
          const r = await callApi(key, payload, { 'TypeSafe-Danger-Zone-Images': 'true' }, 3, 12000, 3500)
          const ms = Date.now() - t0
          if (r.ok) return send({ ok: true, mode: 'live', ms, data: r.data })
          return send({ ok: false, ms, error: r.error }, 502)
        } catch (e: any) {
          send({ ok: false, error: String(e?.message || e) }, 400)
        }
      })
      server.middlewares.use('/api/status', (_req, res) => {
        const free = Object.values(agent.freeSockets).reduce((n, l) => n + (l?.length ?? 0), 0)
        sender(res)({ hasKey: !!env.TYPESAFE_API_KEY, model, net: { ...netStats, freeSockets: free } })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  return { plugins: [jevApi(env)] }
})
