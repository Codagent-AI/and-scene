import { createServer } from 'node:net'
import { describe, expect, it } from 'vitest'
import { assertPreviewPortAvailable } from '../scripts/preview-port.mjs'

describe('preview port guard', () => {
  it('rejects a port already held by a foreign server', async () => {
    const server = createServer()
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const { port } = server.address()
    try {
      await expect(assertPreviewPortAvailable('127.0.0.1', port)).rejects.toThrow(`Preview port 127.0.0.1:${port} is already in use`)
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    }
    await expect(assertPreviewPortAvailable('127.0.0.1', port)).resolves.toBeUndefined()
  })
})

it('keeps the inspection and verification scripts off a foreign server', async () => {
  const { spawnSync } = await import('node:child_process')
  const { resolve } = await import('node:path')
  const repository = resolve(import.meta.dirname, '..')
  const server = createServer((_, response) => { response.end('foreign server') })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address()
  try {
    for (const args of [
      ['scripts/inspect-presentation.mjs', 'how-to-make-a-presentation'],
      ['scripts/verify.mjs'],
    ]) {
      const result = spawnSync(process.execPath, args, {
        cwd: repository,
        encoding: 'utf8',
        timeout: 60_000,
        env: { ...process.env, PREVIEW_PORT: String(port) },
      })
      expect(result.error).toBeUndefined()
      expect(result.status).not.toBe(0)
      expect(`${result.stdout}\n${result.stderr}`).toContain(`Preview port 127.0.0.1:${port} is already in use`)
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}, 90_000)
