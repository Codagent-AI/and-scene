import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupDirs, copyRepo, run } from './helpers'

afterAll(cleanupDirs)

interface Warning {
  kind: string
  message: string
}
interface Report {
  settleMs: number
  steps: { index: number; file: string; settledMs: number; warnings: Warning[] }[]
}

const TALK = `import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './style.css'

function Scene({ index }: SceneProps) {
  const marked = index === 2
  return (
    <SceneLayer>
      <Label key="a" id="a" x={50} y={50} allowOverlap={marked}>Hello there</Label>
      {index > 0 && (
        <Label key="b" id="b" x={50} y={52} allowOverlap={marked}>Overlapping text</Label>
      )}
    </SceneLayer>
  )
}

const STEPS: Step[] = ['one', 'one', 'a much longer era'].map((era, i) => ({
  id: 'step-' + i, era, title: 'Title ' + i, caption: 'Caption ' + i, groupKey: 'g', Scene,
}))

export default function Talk() {
  return <Presentation steps={STEPS} title="Fixture" initialMode="browse" />
}
`

const ACTIVE_CSS = `
[data-presentation-progress-item][data-presentation-active] { width: 28px; background: #000; }
[data-presentation-toc-item][data-presentation-active] { font-weight: 700; background: #000; color: #fff; }
`

let dir: string

function inspect(css: string, extra: string[] = []) {
  writeFileSync(path.join(dir, 'src/presentations/fixture/style.css'), css)
  const started = Date.now()
  const result = run('node', ['scripts/inspect-presentation.mjs', 'fixture', '--mode', 'browse', ...extra], dir)
  const report = JSON.parse(readFileSync(path.join(dir, 'inspection/fixture/report.json'), 'utf8')) as Report
  return { result, report, elapsed: Date.now() - started }
}

const messages = (report: Report, step: number, kind: string) =>
  report.steps[step - 1].warnings.filter((w) => w.kind === kind).map((w) => w.message)

const kinds = (report: Report, step: number) => report.steps[step - 1].warnings.map((w) => w.kind)

beforeAll(() => {
  dir = copyRepo()
  mkdirSync(path.join(dir, 'src/presentations/fixture'), { recursive: true })
  writeFileSync(path.join(dir, 'src/presentations/fixture/Talk.tsx'), TALK)
  writeFileSync(
    path.join(dir, 'src/presentations/index.ts'),
    `import type { ComponentType } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly PresentationEntry[] = [
  { slug: 'fixture', title: 'Fixture', load: () => import('./fixture/Talk') },
]
`,
  )
})

describe('INT: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('writes one screenshot per step and reports unpolished chrome and the unmarked collision', () => {
    const { result, report } = inspect('', ['--settle', '300'])
    expect(result.status, result.output).toBe(0)
    expect(report.steps).toHaveLength(3)
    for (const step of report.steps) {
      const file = path.join(dir, step.file)
      expect(step.file).toMatch(/^inspection\/fixture\/step-0\d\.png$/)
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file).subarray(1, 4).toString()).toBe('PNG')
    }
    // Unmarked collision only on step 2; both elements are named.
    expect(kinds(report, 1)).not.toContain('overlap')
    const overlap = report.steps[1].warnings.find((w) => w.kind === 'overlap')
    expect(overlap?.message).toContain('Hello there')
    expect(overlap?.message).toContain('Overlapping text')
    // The explicitly allowed overlap on step 3 is not reported.
    expect(kinds(report, 3)).not.toContain('overlap')
    // Unstyled chrome: active state and attribution are flagged on every step.
    for (const step of [1, 2, 3]) {
      expect(kinds(report, step)).toContain('attribution')
      const chrome = messages(report, step, 'active-chrome')
      expect(chrome.some((m) => m.includes('progress indicator'))).toBe(true)
      // Entries of different text length must still count as indistinct.
      expect(chrome.some((m) => m.includes('table-of-contents entry'))).toBe(true)
    }
    expect(result.stdout).toMatch(/WARN step 2 \[overlap\]/)
    expect(result.stdout).toMatch(/inspect: 3 screenshots/)
  })

  it('flags an undersized attribution link and stops flagging a styled active state', () => {
    const css = `${ACTIVE_CSS}[data-presentation-attribution] { font-size: 9px; color: #036; text-decoration: none; }`
    const { report } = inspect(css, ['--settle', '300'])
    for (const step of [1, 2, 3]) {
      expect(kinds(report, step)).not.toContain('active-chrome')
      const attribution = report.steps[step - 1].warnings.filter((w) => w.kind === 'attribution')
      expect(attribution).toHaveLength(1)
      expect(attribution[0].message).toContain('too small')
      expect(attribution[0].message).toContain('data-presentation-attribution')
    }
  })

  it('is quiet about polished chrome, waits the settle interval, and keeps only the real collision', () => {
    const css = `${ACTIVE_CSS}[data-presentation-attribution] { font-size: 14px; color: #036; text-decoration: none; }`
    const { report, elapsed } = inspect(css, ['--settle', '1500'])
    expect(report.settleMs).toBe(1500)
    expect(elapsed).toBeGreaterThanOrEqual(3 * 1500)
    // Every capture, not just the whole run, waited the settle interval after its transition.
    for (const step of report.steps) expect(step.settledMs).toBeGreaterThanOrEqual(1500)
    expect(report.steps.map((s) => s.warnings.map((w) => w.kind))).toEqual([[], ['overlap'], []])
  })

  it('fails clearly for an unknown presentation', () => {
    const result = run('node', ['scripts/inspect-presentation.mjs', 'nope', '--skip-build'], dir)
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('unknown presentation "nope"')
  })
})
