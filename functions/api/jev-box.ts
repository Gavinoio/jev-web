interface Env {
  TYPESAFE_API_KEY: string
  JEV_MODEL?: string
  ASSETS: Fetcher
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.TYPESAFE_API_KEY) {
    return Response.json({ ok: false, error: '服务端尚未配置 Jev API Key' }, { status: 503 })
  }

  try {
    const body = await request.json() as { image?: unknown; target?: unknown }
    if (typeof body.image !== 'string' || typeof body.target !== 'string' || !/^[\w.-]+\.jpg$/i.test(body.image)) {
      return Response.json({ ok: false, error: '图片或目标无效' }, { status: 400 })
    }

    const imageResponse = await env.ASSETS.fetch(new URL(`/img/box/${body.image}`, request.url))
    if (!imageResponse.ok) {
      return Response.json({ ok: false, error: `找不到图片 ${body.image}` }, { status: 400 })
    }

    const bytes = new Uint8Array(await imageResponse.arrayBuffer())
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
    }
    const ref = crypto.randomUUID()
    const target = body.target.slice(0, 300)
    const started = Date.now()
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.TYPESAFE_API_KEY}`,
        'Content-Type': 'application/json',
        'TypeSafe-Danger-Zone-Images': 'true',
      },
      body: JSON.stringify({
        model: env.JEV_MODEL || 'jev-latest',
        state: { photo: ref },
        assets: { [ref]: { type: 'image', format: 'jpg', data_base64: btoa(binary) } },
        questions: {
          visible: { type: 'noul', instructions: `Is the following visible in \`photo\`: ${target}?` },
          target: { type: 'box', instructions: `${target} in \`photo\`` },
        },
      }),
      signal: AbortSignal.timeout(30000),
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
