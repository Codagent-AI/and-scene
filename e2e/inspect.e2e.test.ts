import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { repoRoot, run } from './helpers'

// INT-002: run the screenshot helper against the test-only fixture (built with
// VITE_INSPECT_FIXTURE=1 into a temp dir, never into the production dist).
describe('INT-002: screenshot helper artifacts and advisory warnings', () => {
  const work = mkdtempSync(path.join(tmpdir(), 'and-scene-inspect-'))
  const dist = path.join(work, 'dist')
  const out = path.join(work, 'shots')
  const SETTLE = 1500
  let output = ''
  let code = -1

  beforeAll(async () => {
    const build = await run('npx', ['vite', 'build', '--outDir', dist, '--emptyOutDir'], repoRoot, { VITE_INSPECT_FIXTURE: '1' })
    expect(build.code, build.output).toBe(0)
    ;({ code, output } = await run(
      'node',
      ['scripts/inspect-presentation.mjs', 'inspect-fixture', '--skip-build', '--dist', dist, '--out', out, '--settle', String(SETTLE)],
      repoRoot,
    ))
  })

  const warnsFor = (step: number) => output.split('\n').filter((l) => l.startsWith(`WARN step ${step}:`))

  it('writes exactly one predictable screenshot per step and never fails on warnings', () => {
    expect(code).toBe(0)
    expect(readdirSync(out).filter((f) => f.endsWith('.png'))).toEqual(['step-01.png', 'step-02.png', 'step-03.png', 'step-04.png'])
  })

  it('captures each step only after the settle interval, at the right step', () => {
    const manifest = JSON.parse(readFileSync(path.join(out, 'manifest.json'), 'utf8'))
    expect(manifest.steps).toHaveLength(4)
    manifest.steps.forEach((s: { stepIndex: number; advancedAt: number; capturedAt: number }, i: number) => {
      expect(s.stepIndex).toBe(i)
      expect(s.capturedAt - s.advancedAt).toBeGreaterThanOrEqual(SETTLE)
    })
  })

  it('reports the unmarked collision on its step only', () => {
    expect(warnsFor(2).some((l) => /overlap.*unmarked collision/.test(l))).toBe(true)
    for (const s of [1, 3, 4]) expect(warnsFor(s).filter((l) => /overlap/.test(l))).toEqual([])
  })

  it('does not report the explicitly allowed overlap', () => {
    expect(output).not.toMatch(/allowed overlap/)
  })

  it('reports indistinct active chrome and unpolished attribution per step', () => {
    for (const s of [1, 2, 3, 4]) {
      expect(warnsFor(s).some((l) => /active progress item/.test(l))).toBe(true)
      expect(warnsFor(s).some((l) => /attribution link is .*\[data-presentation-attribution\]/.test(l))).toBe(true)
    }
  })
})
