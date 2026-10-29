import test from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { createServer } from 'vite'
import { jevApi } from '../vite.config.ts'
import { callJev } from '../utils/jev.ts'

test('Jev endpoints return an error without a server key instead of a fabricated result', async () => {
  const server = await createServer({ configFile: false, plugins: [jevApi({})], server: { host: '127.0.0.1', port: 0 } })
  try {
    await server.listen()
    const port = (server.httpServer!.address() as AddressInfo).port
    for (const [path, body] of [
      ['/api/jev', { state: '测试', questions: {}, replay: true }],
      ['/api/jev-box', { image: 'agent.jpg', target: 'search bar', replay: true }],
    ] as const) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', body: JSON.stringify(body) })
      const data = await response.json()
      assert.equal(response.status, 503, path)
      assert.equal(data.ok, false, path)
      assert.match(data.error, /TYPESAFE_API_KEY/)
      assert.equal(data.data, undefined, path)
    }
  } finally {
    await server.close()
  }
})

test('client refuses non-live and incomplete responses', async () => {
  const originalFetch = globalThis.fetch
  const questions = { test: { type: 'noul', instructions: '测试' } }
  try {
    for (const response of [
      { ok: true, mode: 'simulated', data: { answers: { test: { noul: 0.5 } } } },
      { ok: true, mode: 'live', data: { answers: {} } },
    ]) {
      globalThis.fetch = async () => new Response(JSON.stringify(response), { status: 200 })
      const result = await callJev('测试', questions)
      assert.equal(result.ok, false)
      assert.equal(result.data, undefined)
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})
