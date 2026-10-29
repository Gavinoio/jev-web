export type Mode = 'live'

export interface JevResult {
  ok: boolean
  mode?: Mode
  ms?: number
  error?: string
  data?: any
  wall?: number
}

/** 读接口返回；拿到 HTML（比如旧的 dev server 没有这个路由）时给出能看懂的提示 */
async function readJson(r: Response) {
  const text = await r.text()
  try { return JSON.parse(text) } catch {
    return { ok: false, error: r.status === 404 ? '本地接口不存在（HTTP 404）：请关掉旧的 npm run dev，重新启动' : `本地接口返回异常（HTTP ${r.status}）` }
  }
}

async function postJson(url: string, body: unknown, signal: AbortSignal | undefined, timeoutMs: number): Promise<JevResult> {
  const started = performance.now()
  const controller = new AbortController()
  let timedOut = false
  const relayAbort = () => controller.abort(signal?.reason)
  if (signal?.aborted) relayAbort()
  else signal?.addEventListener('abort', relayAbort, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const result = await readJson(response)
    if (result.ok) {
      const expected = url === '/api/jev-box' ? ['visible', 'target'] : Object.keys((body as { questions?: Record<string, unknown> }).questions || {})
      if (!response.ok || result.mode !== 'live' || !result.data?.answers || expected.some((key) => !result.data.answers[key])) {
        return { ok: false, error: 'Jev 返回结果不完整或不是实时响应，请重试。', wall: Math.round(performance.now() - started) }
      }
    }
    return { ...result, wall: Math.round(performance.now() - started) }
  } catch (error: any) {
    return {
      ok: false,
      error: timedOut ? `请求超时（超过 ${Math.round(timeoutMs / 1000)} 秒）` : String(error?.message || error),
      wall: Math.round(performance.now() - started),
    }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', relayAbort)
  }
}

export async function callJev(state: string, questions: Record<string, any>, signal?: AbortSignal): Promise<JevResult> {
  return postJson('/api/jev', { state, questions }, signal, 30_000)
}

/** Box 题：服务端读 public/img/box 下的图片，带 TypeSafe-Danger-Zone-Images 头调用 */
export async function callBox(image: string, target: string, signal?: AbortSignal): Promise<JevResult> {
  return postJson('/api/jev-box', { image, target }, signal, 40_000)
}

/** 粗估 token：汉字约 1 个/字，其余约 4 字符 1 个 */
export function estTokens(s: string) {
  const cjk = (s.match(/[一-鿿]/g) || []).length
  return Math.round(cjk * 1 + (s.length - cjk) / 4)
}
/** 输入 $0.042 / 百万 token，输出免费 */
export const estCost = (tokens: number) => (tokens * 0.042) / 1e6

export const MODE_LABEL: Record<string, string> = {
  live: '真实调用',
}

export const pct = (x: number) => `${Math.round(x * 100)}%`
