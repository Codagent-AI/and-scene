import { createServer, type Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { waitForPreview } from './preview-ready.mjs'

let server: Server | undefined
afterEach(() => server?.close())

function listen(delayMs: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      server = createServer((_request, response) => { response.writeHead(200); response.end('ok') })
      server.listen(0, '127.0.0.1', () => resolve((server!.address() as { port: number }).port))
    }, delayMs)
  })
}

describe('preview readiness', () => {
  it('resolves once a listening server answers', async () => {
    const port = await listen(0)
    expect(await waitForPreview({ url: `http://127.0.0.1:${port}/`, intervalMs: 20 })).toEqual({ ready: true })
  })

  it('keeps probing a server that is still starting up', async () => {
    const starting = listen(250)
    const waiting = starting.then((port) => waitForPreview({ url: `http://127.0.0.1:${port}/`, intervalMs: 20, timeoutMs: 5_000 }))
    expect(await waiting).toEqual({ ready: true })
  })

  it('reports when the preview process dies instead of hanging', async () => {
    expect(await waitForPreview({ url: 'http://127.0.0.1:1/', isAlive: () => false, intervalMs: 20 }))
      .toEqual({ ready: false, reason: 'preview exited early' })
  })

  it('times out with a clear reason', async () => {
    expect(await waitForPreview({ url: 'http://127.0.0.1:1/', timeoutMs: 150, intervalMs: 20 }))
      .toEqual({ ready: false, reason: 'preview did not become ready' })
  })
})
