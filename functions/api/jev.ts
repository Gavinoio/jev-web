interface Env {
  TYPESAFE_API_KEY: string
  JEV_MODEL?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.TYPESAFE_API_KEY) {
    return Response.json({ ok: false, error: '服务端尚未配置 Jev API Key' }, { status: 503 })
  }

  try {
    const body = await request.json() as { state?: unknown; questions?: unknown }
    if (typeof body.state !== 'string' || !body.questions || typeof body.questions !== 'object') {
      return Response.json({ ok: false, error: '请求内容无效' }, { status: 400 })
    }

    const started = Date.now()
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.TYPESAFE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: env.JEV_MODEL || 'jev-latest', state: body.state, questions: body.questions }),
      signal: AbortSignal.timeout(25000),
    })
    const text = await response.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text.slice(0, 200) }
    }

    if (!response.ok) {
      const error = (data as { error?: { message?: string } })?.error?.message || `Jev API 返回 HTTP ${response.status}`
      return Response.json({ ok: false, ms: Date.now() - started, error }, { status: 502 })
    }

    return Response.json({ ok: true, mode: 'live', ms: Date.now() - started, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : '请求 Jev API 失败'
    return Response.json({ ok: false, error: message }, { status: 502 })
  }
}
