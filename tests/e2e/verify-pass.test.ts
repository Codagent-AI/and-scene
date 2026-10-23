import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { alive, canBind, cleanupTempDirs, run, sourceState, throwawayCopy, type Result } from '../integration/support'

// E2E-001: the reference presentation passes production verification.
describe('E2E-001: npm run verify on the reference sample', () => {
  let result: Result
  let before: string
  beforeAll(async () => {
    before = sourceState()
    const dir = throwawayCopy('e2e1')
    result = await run('npm', ['run', 'verify'], dir)
  })
  afterAll(cleanupTempDirs)

  it('exits zero with an explicit pass result (L-57)', () => {
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/VERIFY PASS: build, sample, render \(9 steps\) on 127\.0\.0\.1/)
    expect(result.output).not.toMatch(/VERIFY FAIL/)
  })
  it('builds, validates the registered sample, then renders all nine steps in order (L-50, L-53, L-51)', () => {
    const lines = result.output.split('\n')
    const at = (re: RegExp) => lines.findIndex((l) => re.test(l))
    expect(at(/\[verify\] build ok/)).toBeGreaterThanOrEqual(0)
    expect(at(/\[verify\] sample how-to-make-a-presentation ok/)).toBeGreaterThan(at(/\[verify\] build ok/))
    const steps = Array.from({ length: 9 }, (_, i) => at(new RegExp(`\\[verify\\] render step ${i + 1}/9 ok`)))
    expect(steps.every((n) => n >= 0)).toBe(true)
    expect([...steps].sort((a, b) => a - b)).toEqual(steps)
    expect(steps[0]).toBeGreaterThan(at(/\[verify\] sample/))
  })
  it('binds, probes and browses the sample route on 127.0.0.1 (L-54)', () => {
    const m = /\[verify\] preview pid=(\d+) host=([\d.]+) probe=(\S+) browser=(\S+)/.exec(result.output)
    expect(m, result.output).toBeTruthy()
    const [, , host, probe, browser] = m!
    expect(host).toBe('127.0.0.1')
    expect(probe).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/)
    expect(browser).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation$/)
    expect(new URL(probe!).port).toBe(new URL(browser!).port)
  })
  it('cleans up the preview process and port (L-58)', async () => {
    const m = /preview pid=(\d+).*probe=http:\/\/127\.0\.0\.1:(\d+)\//.exec(result.output)!
    expect(alive(Number(m[1]))).toBe(false)
    expect(await canBind(Number(m[2]))).toBe(true)
  })
  it('leaves the source checkout unchanged (C-4)', () => {
    expect(sourceState()).toBe(before)
  })
})
