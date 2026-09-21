import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { startPreview, stopPreview } from '../preview-server.mjs'

const HOST = '127.0.0.1'
const PORT = 4199

let squatter: Server | undefined

afterEach(async () => {
  if (squatter) await new Promise<void>((resolve) => squatter!.close(() => resolve()))
  squatter = undefined
})

describe('preview startup', () => {
  it('refuses to start when the port is already served by something else', async () => {
    squatter = createServer((_request, response) => response.end('not the built app'))
    await new Promise<void>((resolve) => squatter!.listen(PORT, HOST, resolve))

    // Without this guard the readiness poll would succeed against the squatter and
    // verification would run against an unrelated application.
    await expect(startPreview(HOST, PORT)).rejects.toThrow(/already in use/)
  }, 30_000)
})

describe('preview port ownership', () => {
  beforeAll(() => {
    if (!existsSync('dist/index.html')) execFileSync('npm', ['run', 'build'], { stdio: 'ignore' })
  }, 180_000)

  it('never hands back a preview that lost the port to a concurrent start', async () => {
    const RACE_PORT = 4198
    const attempts = await Promise.allSettled([startPreview(HOST, RACE_PORT), startPreview(HOST, RACE_PORT)])
    const started = attempts.filter((attempt) => attempt.status === 'fulfilled')

    try {
      // --strictPort means only one vite can own the port; the loser must surface as a
      // rejection rather than as a handle to somebody else's server.
      expect(started.length).toBe(1)
      for (const attempt of started) {
        const child = (attempt as PromiseFulfilledResult<Awaited<ReturnType<typeof startPreview>>>).value
        expect(child.exitCode, 'returned a preview that had already exited').toBeNull()
      }
    } finally {
      for (const attempt of started) await stopPreview((attempt as PromiseFulfilledResult<Awaited<ReturnType<typeof startPreview>>>).value)
    }
  }, 60_000)
})
