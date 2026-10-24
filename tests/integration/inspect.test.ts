// INT-002: the project-local screenshot helper writes faithful artifacts and advisory warnings.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTempDirs, copyRepo, edit, run, type RunResult } from '../support/repo'

afterAll(cleanupTempDirs)

const SCENE = `
import { useEffect, useState } from 'react'
import { Label, SceneLayer, type SceneProps } from '../../presentation-kit'

export interface Payload {
  step: number
  /** Move the colliding label away so the polished fixture has no collision. */
  apart: boolean
}

export function FixtureScene({ payload: { step, apart } }: SceneProps<Payload>) {
  // The collision only exists once this timer has fired, i.e. after the step's transition settles.
  const [moved, setMoved] = useState(false)
  useEffect(() => {
    setMoved(false)
    const t = setTimeout(() => setMoved(true), 300)
    return () => clearTimeout(t)
  }, [step])
  return (
    <SceneLayer>
      <Label id="alpha" x={100} y={100} w={220} h={30}>Alpha text</Label>
      {step === 2 && <Label id="beta" x={100} y={moved && !apart ? 105 : 200} w={220} h={30}>Beta text</Label>}
      {step === 3 && (
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          <Label id="stack-a" x={400} y={200} w={200} h={30}>Stacked one</Label>
          <Label id="stack-b" x={400} y={205} w={200} h={30}>Stacked two</Label>
        </div>
      )}
      {step === 4 && !apart && (
        <>
          <Label id="raw-a" x={400} y={200} w={200} h={30}>Unmarked one</Label>
          <Label id="raw-b" x={400} y={205} w={200} h={30}>Unmarked two</Label>
        </>
      )}
    </SceneLayer>
  )
}
`

const talk = (apart: boolean, css: boolean, title: string) => `
import { defineStep, Presentation } from '../../presentation-kit'
import { FixtureScene } from '../fixture-scene/Scene'
${css ? "import './styles.css'" : ''}

const steps = [1, 2, 3, 4].map((n) =>
  defineStep({ id: 's' + n, era: n < 3 ? 'first' : 'second', title: 'Step ' + n, caption: 'Caption ' + n, groupKey: 'g', Scene: FixtureScene, payload: { step: n, apart: ${apart} } }),
)

export default function Talk() {
  return <Presentation className="fx" steps={steps} title="${title}" />
}
`

const POLISHED_CSS = `
.fx [data-presentation-progress-item] { width: 12px; height: 12px; border: 1px solid #888; background: transparent; }
.fx [data-presentation-progress-item][data-presentation-active] { background: #1a6; border-color: #1a6; }
.fx [data-presentation-toc-item] { color: #666; }
.fx [data-presentation-toc-item][data-presentation-active] { color: #000; font-weight: 700; }
.fx [data-presentation-attribution] { color: #444; font-size: 14px; text-decoration: none; padding: 0 12px; }
`

let dir: string
let defects: RunResult
let polished: RunResult
const SETTLE = 800

const report = (slug: string) => JSON.parse(readFileSync(path.join(dir, 'inspection-output', slug, 'report.json'), 'utf8'))
const warnings = (r: RunResult) => r.stdout.split('\n').filter((l) => l.startsWith('warning:'))

beforeAll(async () => {
  dir = copyRepo('int-inspect')
  const src = path.join(dir, 'src/presentations')
  for (const [folder, files] of Object.entries({
    'fixture-scene': { 'Scene.tsx': SCENE },
    defects: { 'Talk.tsx': talk(false, false, 'Defects') },
    polished: { 'Talk.tsx': talk(true, true, 'Polished'), 'styles.css': POLISHED_CSS },
  })) {
    mkdirSync(path.join(src, folder), { recursive: true })
    for (const [name, content] of Object.entries(files)) writeFileSync(path.join(src, folder, name), content)
  }
  edit(path.join(src, 'index.ts'), (s) =>
    s.replace(
      'export const presentations: PresentationEntry[] = [',
      "export const presentations: PresentationEntry[] = [\n  { slug: 'defects', title: 'Defects', load: () => import('./defects/Talk') },\n  { slug: 'polished', title: 'Polished', load: () => import('./polished/Talk') },",
    ),
  )
  defects = await run('node', ['scripts/inspect-presentation.mjs', 'defects', '--settle', String(SETTLE)], { cwd: dir })
  polished = await run('node', ['scripts/inspect-presentation.mjs', 'polished', '--settle', String(SETTLE), '--no-build'], { cwd: dir })
})

describe('INT-002: screenshot helper', () => {
  it('writes one valid desktop screenshot per step into a predictable project-local directory', () => {
    expect(defects.code, defects.stdout + defects.stderr).toBe(0)
    for (let i = 1; i <= 4; i++) {
      const file = path.join(dir, 'inspection-output/defects', `step-0${i}.png`)
      expect(existsSync(file), file).toBe(true)
      const png = readFileSync(file)
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1440, 900])
    }
    expect(existsSync(path.join(dir, 'inspection-output/defects/step-05.png'))).toBe(false)
    expect(report('defects').steps.map((s: { index: number }) => s.index)).toEqual([0, 1, 2, 3])
  })

  it('captures only after the settle interval has elapsed for every step', () => {
    for (const s of report('defects').steps) {
      expect(s.settleMs).toBe(SETTLE)
      expect(s.waitedMs).toBeGreaterThanOrEqual(SETTLE)
    }
  })

  it('reports the collision that exists only once the transition has settled, naming the step and elements', () => {
    const overlaps = warnings(defects).filter((w) => w.includes(' overlap:'))
    const step2 = overlaps.filter((w) => w.startsWith('warning: step 2 '))
    expect(step2).toHaveLength(1)
    expect(step2[0]).toMatch(/Alpha text.*overlaps.*Beta text|Beta text.*overlaps.*Alpha text/)
  })

  it('does not report the explicitly allowed overlap, but still reports the same stack when unmarked', () => {
    const overlaps = warnings(defects).filter((w) => w.includes(' overlap:'))
    expect(overlaps.some((w) => w.startsWith('warning: step 3 '))).toBe(false)
    expect(overlaps.some((w) => /Stacked/.test(w))).toBe(false)
    const step4 = overlaps.filter((w) => w.startsWith('warning: step 4 '))
    expect(step4).toHaveLength(1)
    expect(step4[0]).toMatch(/Unmarked one.*Unmarked two|Unmarked two.*Unmarked one/)
    expect(overlaps.some((w) => w.startsWith('warning: step 1 '))).toBe(false)
  })

  it('reports indistinct active progress and ToC chrome, and unpolished attribution, on every step', () => {
    for (let step = 1; step <= 4; step++) {
      const lines = warnings(defects).filter((w) => w.startsWith(`warning: step ${step} `))
      expect(lines.some((l) => l.includes('active-chrome') && l.includes('progress indicator')), `step ${step} progress`).toBe(true)
      expect(lines.some((l) => l.includes('active-chrome') && l.includes('table-of-contents')), `step ${step} toc`).toBe(true)
      expect(lines.some((l) => l.includes('attribution') && l.includes('[data-presentation-attribution]')), `step ${step} attribution`).toBe(true)
    }
  })

  it('keeps warnings advisory: a defective presentation still exits zero with a summary', () => {
    expect(defects.code).toBe(0)
    expect(defects.stdout).toMatch(/inspect: 4 screenshots in inspection-output\/defects; \d+ advisory warning/)
  })

  it('is quiet for the polished presentation, and its screenshots exist too', () => {
    expect(polished.code, polished.stdout + polished.stderr).toBe(0)
    expect(warnings(polished)).toEqual([])
    expect(polished.stdout).toContain('0 advisory warning(s)')
    expect(existsSync(path.join(dir, 'inspection-output/polished/step-04.png'))).toBe(true)
  })

  it('fails clearly for an unregistered presentation', async () => {
    const r = await run('node', ['scripts/inspect-presentation.mjs', 'nope', '--no-build'], { cwd: dir })
    expect(r.code).toBe(1)
    expect(r.stderr).toMatch(/inspect: FAIL no presentation found at \/nope/)
  })
})
