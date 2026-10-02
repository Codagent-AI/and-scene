import { spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'

const repository = resolve(import.meta.dirname, '..')
async function unusedPort() {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

describe('reference presentation production verification', () => {
  it('passes the committed nine-step sample using IPv4 loopback', async () => {
    const port = await unusedPort()
    const result = spawnSync(process.execPath, ['scripts/verify.mjs'], {
      cwd: repository,
      encoding: 'utf8',
      timeout: 120_000,
      env: { ...process.env, PREVIEW_PORT: String(port) },
    })
    const output = `${result.stdout}\n${result.stderr}`
    expect(result.error, output).toBeUndefined()
    expect(result.status, output).toBe(0)
    expect(output).toMatch(/PASS: .*9 steps/)
    expect(output).toContain(`http://127.0.0.1:${port}/how-to-make-a-presentation`)
  }, 150_000)
})
