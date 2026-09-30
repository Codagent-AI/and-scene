// @vitest-environment node
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { startPreviewServer } from './preview-server.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HOST = '127.0.0.1'

const cleanups: Array<() => Promise<unknown> | unknown> = []

afterEach(async () => {
  while (cleanups.length > 0) {
    try {
      await cleanups.pop()!()
    } catch {
      // Best effort: one failed teardown must not strand the rest.
    }
  }
})

/** Listens on an OS-assigned port so parallel test files can never collide. */
function listenOnEphemeralPort(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => res.end('stale bundle'))
    server.listen(0, HOST, () => {
      cleanups.push(() => new Promise((done) => server.close(() => done(null))))
      resolve({ server, port: (server.address() as AddressInfo).port })
    })
  })
}

async function reserveFreePort(): Promise<number> {
  const { server, port } = await listenOnEphemeralPort()
  await new Promise((done) => server.close(() => done(null)))
  return port
}

describe('startPreviewServer', () => {
  it('refuses to start when the port is already held, instead of reusing the stale server', async () => {
    // Stands in for a preview server orphaned by an earlier run, which used to
    // be silently reused — verification then ran against a different bundle.
    const { port } = await listenOnEphemeralPort()

    await expect(startPreviewServer({ root, host: HOST, port })).rejects.toThrow(/already in use/i)
  }, 30000)

  it('releases the port on close so the next run gets a fresh server', async () => {
    const port = await reserveFreePort()

    const first = await startPreviewServer({ root, host: HOST, port })
    await first.close()

    // If close() leaked the port, this second bind would reject.
    const second = await startPreviewServer({ root, host: HOST, port })
    cleanups.push(() => second.close())
    expect(second.resolvedUrls?.local?.[0]).toContain(String(port))
  }, 30000)
})
