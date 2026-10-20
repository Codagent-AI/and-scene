import { describe, expect, it, beforeAll } from 'vitest'
import { ROOT } from '../helpers/repo.ts'
import { previewProcesses, run, type RunResult } from '../helpers/process.ts'
import { SPEC_SLUG, SPEC_STEPS } from '../helpers/spec-outline.ts'

// E2E-001: the committed reference presentation passes `npm run verify` from the repository root.
describe('E2E-001: reference presentation passes production verification', () => {
  let result: RunResult

  beforeAll(async () => {
    result = await run('npm', ['run', 'verify'], ROOT)
  })

  it('exits zero with a clear pass result', () => {
    expect(result.code, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain('PASS verify: outline, registry, build, render (9 steps)')
    expect(result.stdout + result.stderr).not.toMatch(/FAIL/)
  })

  it('verifies the registered sample in order: outline, registry, build, then render', () => {
    const phases = ['verify: outline ok', 'verify: registry ok', 'verify: build ok', 'verify: render ok (9 steps)']
    const positions = phases.map((p) => result.stdout.indexOf(p))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('observes all nine step indices and every normative title in order', () => {
    const steps = [...result.stdout.matchAll(/verify: step (\d+)\/9 \(data-step-index=(\d+)\) "(.*)" ok/g)]
    expect(steps.map((m) => [Number(m[1]), Number(m[2]), m[3]])).toEqual(SPEC_STEPS.map(([, title], i) => [i + 1, i, title]))
  })

  it('opens the registered route on the 127.0.0.1 preview', () => {
    expect(result.stdout).toMatch(new RegExp(`verify: preview on 127\\.0\\.0\\.1:\\d+`))
    expect(result.stdout).toMatch(new RegExp(`verify: opening http://127\\.0\\.0\\.1:\\d+/${SPEC_SLUG}\\n`))
    expect(result.stdout + result.stderr).not.toContain('localhost')
  })

  it('leaves no preview process running', async () => {
    expect(await previewProcesses(ROOT)).toEqual([])
  })
})
