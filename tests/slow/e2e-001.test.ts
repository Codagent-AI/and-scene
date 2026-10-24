import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyApp, discard, leftoverPreviews, run } from './helpers.ts'

// E2E-001: the reference presentation passes production verification (`npm run verify`).
describe('E2E-001 reference presentation passes production verification', () => {
  let dir: string
  let result: ReturnType<typeof run>

  beforeAll(() => {
    dir = copyApp()
    result = run('npm', ['run', 'verify'], { cwd: dir, env: { VERIFY_SETTLE_MS: '900' } })
  })
  afterAll(() => discard(dir))

  it('exits zero with a clear pass result naming every phase', () => {
    expect(result.output).toContain('VERIFY PASSED (build, sample, render)')
    expect(result.code).toBe(0)
  })

  it('builds the whole app, then checks the registered sample against the nine-step outline', () => {
    expect(result.output).toContain('[verify] phase build: ok')
    expect(result.output).toContain('sample ok: "how-to-make-a-presentation" registered, 9 steps match the outline')
  })

  it('serves, probes, and opens the sample on 127.0.0.1 only', () => {
    const urls = result.output.match(/https?:\/\/[^\s/]+/g) ?? []
    expect(urls.length).toBeGreaterThanOrEqual(2)
    expect(result.output).toMatch(/\[preview\] vite preview host=127\.0\.0\.1 port=\d+/)
    expect(result.output).toMatch(/readiness probe http:\/\/127\.0\.0\.1:\d+\/ ok/)
    expect(result.output).toMatch(/\[verify\] open http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    for (const url of urls.filter((u) => !u.includes('vite.dev'))) expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(result.output).not.toMatch(/localhost/)
  })

  it('observes all nine step indices in order without console or page errors', () => {
    const seen = [...result.output.matchAll(/\[verify\] step (\d+)\/9 rendered \(data-step-index=(\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])])
    expect(seen).toEqual(Array.from({ length: 9 }, (_, i) => [i + 1, i]))
    expect(result.output).not.toContain('VERIFY FAILED')
  })

  it('leaves no preview process behind', () => {
    expect(leftoverPreviews(dir)).toEqual([])
  })
})
