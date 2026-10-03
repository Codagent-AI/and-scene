import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { startPreview, stopPreview } from '../preview-server.mjs'

const HOST = '127.0.0.1'

let squatter: Server | undefined

beforeAll(() => {
  if (!existsSync('dist/index.html')) execFileSync('npm', ['run', 'build'], { stdio: 'ignore' })
}, 180_000)

afterEach(async () => {
  if (squatter) await new Promise<void>((resolve) => squatter!.close(() => resolve()))
  squatter = undefined
})

describe('preview port ownership', () => {
  it('refuses to start when the port is already served by something else', async () => {
    const port = 4199
    squatter = createServer((_request, response) => response.end('not the built app'))
    await new Promise<void>((resolve) => squatter!.listen(port, HOST, resolve))

    // Otherwise verification could run against an unrelated application.
    await expect(startPreview(HOST, port)).rejects.toThrow(/already in use/i)
  }, 60_000)

  it('never hands back a preview that lost the port to a concurrent start', async () => {
    const port = 4198
    const attempts = await Promise.allSettled([startPreview(HOST, port), startPreview(HOST, port)])
    const started = attempts.filter((attempt) => attempt.status === 'fulfilled')

    try {
      // Only one server can own the port; the loser must surface as a rejection
      // rather than as a handle to somebody else's server.
      expect(started.length).toBe(1)
      const server = (started[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof startPreview>>>).value
      expect(server.httpServer.listening, 'returned a preview that is not listening').toBe(true)
    } finally {
      for (const attempt of started) await stopPreview((attempt as PromiseFulfilledResult<Awaited<ReturnType<typeof startPreview>>>).value)
    }
  }, 60_000)

  it('serves the built application once started', async () => {
    const port = 4197
    const server = await startPreview(HOST, port)
    try {
      const response = await fetch(`http://${HOST}:${port}/`)
      expect(response.ok).toBe(true)
      expect(await response.text()).toContain('<div id="root">')
    } finally {
      await stopPreview(server)
    }
  }, 60_000)
})
