import { cpSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupSandboxes, copyRepo, edit, leftoverProcesses, repoRoot, run } from '../helpers/sandbox'

afterAll(cleanupSandboxes)

const SETTLE = 800
let dir: string
let fixtureRun: { code: number | null; out: string }
let report: { captures: { step: number; file: string; settledMs: number }[]; warnings: { step: number; kind: string; message: string }[] }

const inspect = (slug: string, ...extra: string[]) =>
  run('node', ['scripts/inspect-presentation.mjs', slug, '--settle', String(SETTLE), ...extra], dir)

// INT-002: the helper drives a production preview of a controlled presentation.
beforeAll(async () => {
  dir = copyRepo()
  cpSync(path.join(repoRoot, 'tests/fixtures/inspect-fixture'), path.join(dir, 'src/presentations/inspect-fixture'), { recursive: true })
  edit(path.join(dir, 'src/presentations/index.ts'), (t) =>
    t.replace('export const presentations: PresentationEntry[] = [', "export const presentations: PresentationEntry[] = [\n  { slug: 'inspect-fixture', title: 'Fixture', load: () => import('./inspect-fixture/Talk.tsx') },"),
  )
  fixtureRun = await inspect('inspect-fixture')
  report = JSON.parse(readFileSync(path.join(dir, '.inspection/inspect-fixture/1440x900/report.json'), 'utf8'))
})

describe('INT-002: screenshot helper', () => {
  it('writes one predictable screenshot per step and exits zero despite warnings', () => {
    expect(fixtureRun.code).toBe(0)
    for (let n = 1; n <= 4; n++) {
      const file = path.join(dir, `.inspection/inspect-fixture/1440x900/step-0${n}.png`)
      expect(existsSync(file), file).toBe(true)
    }
    expect(report.captures).toHaveLength(4)
  })

  it('captures only after the settle interval since the step change', () => {
    for (const c of report.captures) expect(c.settledMs).toBeGreaterThanOrEqual(SETTLE)
  })

  it('reports the unmarked collision on its step, naming both elements', () => {
    const overlaps = report.warnings.filter((w) => w.kind === 'overlap')
    expect(overlaps.map((w) => w.step)).toEqual([2])
    expect(overlaps[0].message).toContain('unmarked collision A')
    expect(overlaps[0].message).toContain('unmarked collision B')
    expect(fixtureRun.out).toMatch(/WARN step 2 overlap/)
  })

  it('does not report the explicitly allowed overlap', () => {
    expect(fixtureRun.out).not.toMatch(/WARN step 3/)
    expect(fixtureRun.out).not.toContain('intentional overlap')
  })

  it('reports indistinct active chrome and unpolished attribution', () => {
    const chrome = report.warnings.filter((w) => w.kind === 'active-chrome').map((w) => w.message)
    expect(chrome.some((m) => /progress indicator/.test(m))).toBe(true)
    // Table-of-contents entries of different widths are still indistinct without a current-state treatment.
    expect(chrome.some((m) => /table-of-contents entry/.test(m))).toBe(true)
    const attribution = report.warnings.filter((w) => w.kind === 'attribution')
    expect(attribution.map((w) => w.message).join('\n')).toMatch(/browser-default link color/)
    expect(attribution[0].message).toContain('[data-presentation-attribution]')
  })

  it('captures a narrow viewport into its own directory', async () => {
    const narrow = await inspect('inspect-fixture', '--skip-build', '--viewport', '390x844')
    expect(narrow.code).toBe(0)
    expect(existsSync(path.join(dir, '.inspection/inspect-fixture/390x844/step-04.png'))).toBe(true)
  })

  it('stays warning-free for the styled reference sample', async () => {
    const sample = await inspect('how-to-make-a-presentation', '--skip-build')
    expect(sample.out).toMatch(/9 screenshot\(s\).* 0 advisory warning\(s\)/)
  })

  it('fails with a clear message for an unknown presentation and cleans up its preview', async () => {
    const bad = await inspect('does-not-exist', '--skip-build')
    expect(bad.code).toBe(1)
    expect(bad.out).toMatch(/inspect failed/)
    expect(await leftoverProcesses(dir)).toEqual([])
  })
})
