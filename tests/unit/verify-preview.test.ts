import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { HOST, pickFreePort, urlFor, waitForReady, withPreview } from '../../scripts/lib/preview.mjs'

const SCRIPTS = join(__dirname, '..', '..', 'scripts')
const sources = (dir = SCRIPTS): [string, string][] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? sources(join(dir, d.name)) : [[join(dir, d.name), readFileSync(join(dir, d.name), 'utf8')] as [string, string]],
  )

const deps = (overrides: Record<string, unknown> = {}) => {
  const stop = vi.fn(async () => {})
  return {
    stop,
    deps: {
      pick: async () => 4321,
      start: vi.fn(() => ({ stop, failed: () => null })),
      ready: vi.fn(async () => {}),
      ...overrides,
    },
  }
}

describe('IPv4 loopback', () => {
  it('uses 127.0.0.1 for every URL and never localhost', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(urlFor(5173, '/x')).toBe('http://127.0.0.1:5173/x')
    for (const [file, src] of sources()) expect(src, file).not.toMatch(/localhost/i)
    const urls = sources().flatMap(([file, src]) => [...src.matchAll(/https?:\/\/[^\s'"`)]+/g)].map((m) => [file, m[0]]))
    for (const [file, url] of urls) expect(url, file).toMatch(/127\.0\.0\.1|\$\{HOST\}/)
  })

  it('binds the preview and the probe to the shared host constant', async () => {
    const { deps: d } = deps()
    await withPreview('/root', async (url, port) => {
      expect(url).toBe('http://127.0.0.1:4321')
      expect(port).toBe(4321)
    }, d)
    expect(d.ready).toHaveBeenCalledWith('http://127.0.0.1:4321/', expect.anything())
    expect(readFileSync(join(SCRIPTS, 'lib', 'preview.mjs'), 'utf8')).toMatch(/'--host', HOST/)
  })

  it('picks a free port', async () => {
    const port = await pickFreePort()
    expect(port).toBeGreaterThan(0)
  })
})

describe('preview cleanup', () => {
  it('stops the preview after success', async () => {
    const { deps: d, stop } = deps()
    expect(await withPreview('/r', async () => 'done', d)).toBe('done')
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('stops the preview when the readiness probe rejects', async () => {
    const { deps: d, stop } = deps({ ready: async () => { throw new Error('not ready') } })
    await expect(withPreview('/r', async () => 'unreachable', d)).rejects.toThrow('not ready')
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('stops the preview when the body (e.g. browser launch) rejects', async () => {
    const { deps: d, stop } = deps()
    await expect(withPreview('/r', async () => { throw new Error('launch failed') }, d)).rejects.toThrow('launch failed')
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('does not start a body when the preview process exited early', async () => {
    await expect(waitForReady('http://127.0.0.1:1/', { failed: () => 'code 1', pollMs: 1 })).rejects.toThrow(/exited early: code 1/)
  })

  it('gives up after the readiness timeout', async () => {
    await expect(waitForReady('http://127.0.0.1:1/', { timeoutMs: 30, pollMs: 5, probeFn: async () => false })).rejects.toThrow(/did not become ready/)
  })

  it('verify guarantees cleanup structurally and drives the public step hooks', () => {
    const verify = readFileSync(join(SCRIPTS, 'verify.mjs'), 'utf8')
    expect(verify).toMatch(/withPreview\(/)
    expect(verify).toMatch(/finally/)
    expect(verify).toContain("'ArrowRight'")
    expect(verify).toContain('data-step-count')
    expect(verify).toContain('data-step-index')
    expect(readFileSync(join(SCRIPTS, 'lib', 'preview.mjs'), 'utf8')).toMatch(/finally \{\s*await preview\.stop\(\)/)
  })

  it('installs error listeners before the first navigation and builds the whole app', () => {
    const verify = readFileSync(join(SCRIPTS, 'verify.mjs'), 'utf8')
    expect(verify.indexOf('collectBrowserErrors(')).toBeGreaterThan(-1)
    expect(verify.indexOf('collectBrowserErrors(')).toBeLessThan(verify.indexOf('page.goto('))
    expect(verify).toMatch(/\['run', 'build'\]/)
  })
})
