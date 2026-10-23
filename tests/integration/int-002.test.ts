import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  cleanupTempDirs,
  createPresentation,
  ensureDir,
  freePort,
  materializeBootstrap,
  run,
  type RunResult,
} from '../support/workspace.ts'

// INT-002: the screenshot helper emits faithful artifacts and advisory warnings,
// driven against a controlled app with a defective and a polished presentation.

const SCENE = (heading: string) => `import { Appear, Label, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'

export interface ScenePayload {
  index: number
}

export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      <Appear key="always">
        <Label id="${heading}-heading" x={20} y={20} w={200} h={20}>${heading} heading</Label>
      </Appear>
      {payload.index === 0 && (
        <Appear key="clash">
          <div className="fade">
            <Label id="${heading}-one" x={100} y={100} w={200} h={20}>first clashing text</Label>
            <Label id="${heading}-two" x={110} y={105} w={200} h={20}>second clashing text</Label>
          </div>
        </Appear>
      )}
      {payload.index === 1 && (
        <Appear key="allowed">
          <div className="fade" data-presentation-allow-overlap="">
            <Label id="${heading}-three" x={100} y={100} w={200} h={20}>intentional stack a</Label>
            <Label id="${heading}-four" x={110} y={105} w={200} h={20}>intentional stack b</Label>
          </div>
        </Appear>
      )}
      {payload.index === 2 && (
        <Appear key="clean">
          <Label id="${heading}-five" x={100} y={100} w={200} h={20}>clean step</Label>
        </Appear>
      )}
    </SceneLayer>
  )
}
`

const POLISHED_CSS = `
.polished [data-presentation-progress-item] { width: 12px; height: 12px; padding: 0; border-radius: 50%; }
.polished [data-presentation-progress-item][data-presentation-active] { width: 28px; background: gold; }
.polished [data-presentation-toc-item][data-presentation-active] { font-weight: 700; background: gold; }
.polished { font-family: sans-serif; }
.polished [data-presentation-attribution] { font-size: 13px; color: gray; text-decoration: none; margin: 0 12px 8px 0; }
.polished [data-presentation-footer] { padding-bottom: 36px; padding-left: 16px; }
.polished [data-presentation-header] { padding: 0 16px; }
.polished [data-presentation-toc] { padding-left: 16px; }
.polished [data-presentation-toc] ol { list-style: none; margin: 0; padding: 0; }
.polished [data-presentation-node="label"] { white-space: nowrap; }
`
const FADE_CSS = '.fade { position: absolute; inset: 0; animation: fadein 100ms linear 1000ms both; } @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }\n'

function writeFixture(app: string, slug: string, css: string, className: string) {
  const dir = path.join(app, 'src/presentations', slug)
  writeFileSync(path.join(dir, 'scene.tsx'), SCENE(slug))
  writeFileSync(
    path.join(dir, 'steps/steps.ts'),
    `import type { Step } from '../../../presentation-kit/index.ts'
import { Scene, type ScenePayload } from '../scene.tsx'

const TITLES = ['First fixture step', 'Second fixture step', 'Third fixture step']
export const STEPS: Step<ScenePayload>[] = TITLES.map((title, index) => ({
  id: 'step-' + index,
  era: index === 0 ? 'early' : 'late',
  title,
  caption: 'Caption for ' + title,
  Scene,
  payload: { index },
  groupKey: '${slug}',
}))
`,
  )
  writeFileSync(path.join(dir, 'talk.css'), FADE_CSS + css)
  const talk = readFileSync(path.join(dir, 'Talk.tsx'), 'utf8').replace(`className="${slug}"`, `className="${className}"`)
  writeFileSync(path.join(dir, 'Talk.tsx'), talk)
}

interface Report {
  settleMs: number
  passes: { name: string; steps: { index: number; file: string; waitedMs: number; warnings: string[] }[] }[]
}

const pngSize = (file: string) => {
  const b = readFileSync(file)
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), signature: b.subarray(1, 4).toString() }
}

describe('INT-002 screenshot helper', () => {
  let app: string
  let defects: RunResult
  let polished: RunResult
  let unsettled: RunResult
  let defectReport: Report
  let polishedReport: Report
  let unsettledReport: Report
  const reportOf = (slug: string): Report => JSON.parse(readFileSync(path.join(app, 'inspection', slug, 'report.json'), 'utf8'))
  const warnings = (r: Report, step: number) => r.passes[0].steps[step].warnings

  beforeAll(async () => {
    app = await materializeBootstrap(true)
    await createPresentation(app, 'defects', 'Defective Fixture')
    await createPresentation(app, 'polished', 'Polished Fixture')
    writeFixture(app, 'defects', '', 'defects')
    writeFixture(app, 'polished', POLISHED_CSS, 'polished')
    ensureDir(path.join(app, 'inspection'))
    const build = await run('npm', ['run', 'build'], app)
    if (build.code !== 0) throw new Error(build.out)
    const base = ['scripts/inspect-presentation.mjs']
    defects = await run(process.execPath, [...base, 'defects', '--no-build', '--settle', '1500', '--port', String(await freePort())], app)
    defectReport = reportOf('defects')
    polished = await run(process.execPath, [...base, 'polished', '--no-build', '--settle', '1500', '--port', String(await freePort())], app)
    polishedReport = reportOf('polished')
    unsettled = await run(process.execPath, [...base, 'defects', '--no-build', '--settle', '0', '--port', String(await freePort())], app)
    unsettledReport = reportOf('defects')
  })
  afterAll(cleanupTempDirs)

  it('writes one predictable, non-empty desktop screenshot per step under the project-local artifact directory', () => {
    expect(defects.code, defects.out).toBe(0)
    const files = [1, 2, 3].map((n) => path.join(app, 'inspection/defects', `step-0${n}.png`))
    for (const f of files) {
      expect(existsSync(f), f).toBe(true)
      expect(pngSize(f)).toEqual({ w: 1280, h: 720, signature: 'PNG' })
    }
    const contents = files.map((f) => readFileSync(f).toString('base64'))
    expect(new Set(contents).size).toBe(3) // each image reflects its own step
    expect(defects.out).toContain('inspection/defects/step-01.png')
    expect(defectReport.passes[0].steps.map((s) => s.file)).toEqual(files)
  })

  it('waits for the settle interval before every capture', () => {
    expect(defectReport.settleMs).toBe(1500)
    for (const s of defectReport.passes[0].steps) expect(s.waitedMs).toBeGreaterThanOrEqual(1490)
  })

  it('captures after transitions settle: an unsettled run sees the still-fading text, a settled run sees it', () => {
    expect(warnings(defectReport, 0).some((w) => w.includes('[overlap]'))).toBe(true)
    expect(unsettled.code, unsettled.out).toBe(0)
    expect(unsettledReport.settleMs).toBe(0)
    expect(warnings(unsettledReport, 0).some((w) => w.includes('[overlap]'))).toBe(false)
  })

  it('warns about the unmarked collision at its own step only, naming the elements', () => {
    const w = warnings(defectReport, 0).filter((x) => x.includes('[overlap]'))
    expect(w).toHaveLength(1)
    expect(w[0]).toContain('step 1 (index 0)')
    expect(w[0]).toContain('first clashing text')
    expect(w[0]).toContain('second clashing text')
    expect(w[0]).toContain('data-presentation-allow-overlap')
    for (const step of [1, 2]) expect(warnings(defectReport, step).some((x) => x.includes('[overlap]'))).toBe(false)
  })

  it('does not warn about the explicitly allowed readable overlap', () => {
    const second = warnings(defectReport, 1).join('\n')
    expect(second).not.toContain('intentional stack')
    expect(defects.out).not.toContain('intentional stack')
  })

  it('warns about indistinct active progress/TOC chrome and unpolished attribution on every step', () => {
    for (let step = 0; step < 3; step++) {
      const w = warnings(defectReport, step)
      expect(w.some((x) => x.includes('[active-progress]') && x.includes(`step ${step + 1} (index ${step})`)), `progress ${step}`).toBe(true)
      expect(w.some((x) => x.includes('[active-toc]')), `toc ${step}`).toBe(true)
      expect(w.some((x) => x.includes('[attribution]') && x.includes('browser-default') && x.includes('data-presentation-attribution')), `attr ${step}`).toBe(true)
    }
    expect(defects.out).toMatch(/warning \[attribution\]/)
  })

  it('stays advisory: exits zero while warnings are present', () => {
    expect(defects.code).toBe(0)
    expect(defects.out).toMatch(/inspect: \d+ advisory warning\(s\)/)
    expect(Number(/inspect: (\d+) advisory/.exec(defects.out)?.[1])).toBeGreaterThan(3)
  })

  it('produces no active-state, attribution or overlap warnings for correctly styled chrome and a clean layout', () => {
    expect(polished.code, polished.out).toBe(0)
    for (let step = 0; step < 3; step++) {
      const w = warnings(polishedReport, step).filter((x) => !x.includes('[overlap]') || step === 0)
      expect(w.filter((x) => x.includes('[active') || x.includes('[attribution]')), `step ${step}`).toEqual([])
    }
    expect(warnings(polishedReport, 2)).toEqual([])
    expect(warnings(polishedReport, 1)).toEqual([])
  })

  it('also reports the polished fixture’s own unmarked collision, proving detection is not defect-specific', () => {
    expect(warnings(polishedReport, 0).filter((x) => x.includes('[overlap]'))).toHaveLength(1)
  })
})
