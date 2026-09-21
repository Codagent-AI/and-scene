import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { waitForPreview } from './preview-ready.mjs'

let server: Server | undefined
afterEach(() => server?.close())

/** Starts a server on `port` (0 picks a free one) and resolves its port. */
function listen(port = 0): Promise<number> {
  return new Promise((resolve) => {
    const created = createServer((_request, response) => { response.writeHead(200); response.end('ok') })
    server = created
    created.listen(port, '127.0.0.1', () => resolve((created.address() as AddressInfo).port))
  })
}

describe('preview readiness', () => {
  it('resolves once a listening server answers', async () => {
    const port = await listen()
    expect(await waitForPreview({ url: `http://127.0.0.1:${port}/`, intervalMs: 20 })).toEqual({ ready: true })
  })

  it('keeps probing a server that is still starting up', async () => {
    const port = await listen()
    server!.close()
    server = undefined
    // Start probing the now-dead port, then bring the server back mid-wait.
    const waiting = waitForPreview({ url: `http://127.0.0.1:${port}/`, intervalMs: 20, timeoutMs: 5_000 })
    setTimeout(() => void listen(port), 60)
    expect(await waiting).toEqual({ ready: true })
  })

  it('reports when the preview process dies instead of hanging', async () => {
    expect(await waitForPreview({ url: 'http://127.0.0.1:1/', isAlive: () => false, intervalMs: 20 }))
      .toEqual({ ready: false, reason: 'preview exited early' })
  })

  it('times out with a clear reason', async () => {
    expect(await waitForPreview({ url: 'http://127.0.0.1:1/', timeoutMs: 60, intervalMs: 20 }))
      .toEqual({ ready: false, reason: 'preview did not become ready' })
  })
})
