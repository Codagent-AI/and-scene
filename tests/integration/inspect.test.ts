import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, npm, removeProject, run, type RunResult } from '../support/project'

// INT-002: the project-local inspection helper against controlled registered presentations.
let project = ''

const CHROME_CSS = `
.fx { font-family: Arial, sans-serif; color: #222; background: #fff; }
.fx [data-presentation-header] { padding: 0 24px; gap: 12px; }
.fx [data-presentation-toc] { padding: 0 24px; gap: 8px; }
.fx [data-presentation-footer] { padding: 0 24px 30px; gap: 8px; }
.fx [data-presentation-caption] { margin: 0; text-align: center; }
.fx [data-presentation-controls] { justify-content: center; gap: 12px; }
.fx [data-presentation-progress] { gap: 6px; margin: 0; padding: 0; list-style: none; }
.fx [data-presentation-dot], .fx [data-presentation-toc-entry] { width: 12px; height: 12px; padding: 0; border: 1px solid #888; background: transparent; }
.fx [data-presentation-toc-entry] { width: auto; height: auto; padding: 2px 8px; }
`
const ACTIVE_CSS = `
.fx [data-presentation-dot][data-presentation-active='true'] { width: 28px; background: #c60; border-color: #c60; }
.fx [data-presentation-toc-entry][data-presentation-active='true'] { background: #c60; color: #fff; font-weight: 700; }
`
const ATTRIBUTION_CSS = `.fx [data-presentation-attribution] { right: 20px; bottom: 6px; font-size: 14px; color: #a40; }`

interface Fixture {
  slug: string
  css: string
  /** JSX placed inside the SceneLayer of every step. */
  layer: string
}

const OVERLAP = `<Label key="a" id="fx/a" at={{ x: 100, y: 100, w: 200, h: 24 }}>First overlapping text</Label>
<Label key="b" id="fx/b" at={{ x: 130, y: 106, w: 200, h: 24 }}>Second overlapping text</Label>`
const SEPARATE = `<Label key="a" id="fx/a" at={{ x: 100, y: 100, w: 200, h: 24 }}>First text</Label>
<Label key="b" id="fx/b" at={{ x: 500, y: 200, w: 200, h: 24 }}>Second text</Label>`

const fixtures: Fixture[] = [
  { slug: 'fx-clean', css: CHROME_CSS + ACTIVE_CSS + ATTRIBUTION_CSS, layer: SEPARATE },
  { slug: 'fx-collision', css: CHROME_CSS + ACTIVE_CSS + ATTRIBUTION_CSS, layer: OVERLAP },
  {
    slug: 'fx-allowed',
    css: CHROME_CSS + ACTIVE_CSS + ATTRIBUTION_CSS,
    layer: `<div key="allowed" data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>${OVERLAP}</div>`,
  },
  {
    slug: 'fx-hidden',
    css: CHROME_CSS + ACTIVE_CSS + ATTRIBUTION_CSS,
    layer: `<div key="invisible" style={{ position: 'absolute', inset: 0, opacity: 0 }}>${OVERLAP}</div>
<div key="gone" style={{ position: 'absolute', inset: 0, display: 'none' }}>${OVERLAP}</div>`,
  },
  { slug: 'fx-chrome', css: CHROME_CSS + ATTRIBUTION_CSS, layer: SEPARATE },
  { slug: 'fx-attribution', css: CHROME_CSS + ACTIVE_CSS, layer: SEPARATE },
]

function writeFixture({ slug, css, layer }: Fixture) {
  const dir = path.join(project, 'src/presentations', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'talk.css'), css)
  writeFileSync(
    path.join(dir, 'Talk.tsx'),
    `import { Appear, Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './talk.css'

function Scene({ payload }: SceneProps<{ step: number }>) {
  return (
    <SceneLayer>
      ${layer}
      {payload.step >= 2 && <Appear key="late"><Label id="fx/late" at={{ x: 400, y: 300, w: 200, h: 24 }}>Late newcomer</Label></Appear>}
    </SceneLayer>
  )
}

const steps: Step<{ step: number }>[] = [1, 2, 3].map((n) => ({
  id: 's' + n, era: 'era ' + (n < 3 ? 'one' : 'two'), title: 'Step title ' + n, caption: 'Caption for step ' + n, groupKey: 'g', Scene, payload: { step: n },
}))

export default function Talk() {
  return <Presentation className="fx" steps={steps} title="${slug}" initialMode="browse" />
}
`,
  )
}

const outputs: Record<string, RunResult> = {}
const inspect = (slug: string, extra: string[] = []) =>
  run(process.execPath, ['scripts/inspect-presentation.mjs', slug, '--skip-build', '--settle', '150', ...extra], project)

beforeAll(async () => {
  project = copyProject('int002')
  fixtures.forEach(writeFixture)
  const registry = path.join(project, 'src/presentations/index.ts')
  const entries = fixtures.map((f) => `  { slug: '${f.slug}', title: '${f.slug}', load: () => import('./${f.slug}/Talk') },`).join('\n')
  writeFileSync(registry, readFileSync(registry, 'utf8').replace('export const presentations: PresentationEntry[] = [', `export const presentations: PresentationEntry[] = [\n${entries}`))
  const build = await npm(['run', 'build'], project)
  expect(build.code, build.output).toBe(0)
  for (const f of fixtures) outputs[f.slug] = await inspect(f.slug)
}, 600000)

afterAll(() => removeProject(project))

const warnings = (slug: string, kind: string) => outputs[slug].output.split('\n').filter((l) => l.startsWith('WARN') && l.includes(` ${kind}:`))

describe('INT-002: screenshot helper', () => {
  it('writes one predictable screenshot per step at 1280 x 720 and exits zero', () => {
    for (const f of fixtures) {
      expect(outputs[f.slug].code, outputs[f.slug].output).toBe(0)
      const dir = path.join(project, 'inspection', f.slug)
      expect(readdirSync(dir).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
      const png = readFileSync(path.join(dir, 'step-02.png'))
      expect(png.subarray(1, 4).toString()).toBe('PNG')
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1280, 720])
    }
  })

  it('captures only after the configured settle interval and after animations have finished', () => {
    const lines = outputs['fx-clean'].output.split('\n').filter((l) => l.startsWith('captured'))
    expect(lines).toHaveLength(3)
    for (const line of lines) {
      expect(Number(/ (\d+)ms after navigation/.exec(line)![1])).toBeGreaterThanOrEqual(150)
      expect(line).toMatch(/ settled$/)
    }
    // the step-2 newcomer waits 0.6 s and then fades for 0.45 s, far past the 150 ms settle interval,
    // so a faithful capture must have waited for it
    expect(Number(/ (\d+)ms after navigation/.exec(lines[1])![1])).toBeGreaterThanOrEqual(1000)
  })

  it('reports each screenshot as showing its own step, and different steps look different', () => {
    const lines = outputs['fx-clean'].output.split('\n').filter((l) => l.startsWith('captured'))
    lines.forEach((line, i) => expect(line).toContain(`step ${i + 1}/3 "Step title ${i + 1}"`))
    const shots = [1, 2, 3].map((n) => readFileSync(path.join(project, 'inspection/fx-clean', `step-0${n}.png`)))
    expect(shots[0].equals(shots[1])).toBe(false) // the newcomer is visible and the active step marker moved
    expect(shots[1].equals(shots[2])).toBe(false) // the active progress dot and caption changed
  })

  it('waits the default interval, which outlasts the transition, when none is configured', async () => {
    const result = await run(process.execPath, ['scripts/inspect-presentation.mjs', 'fx-clean', '--skip-build'], project)
    expect(result.code, result.output).toBe(0)
    for (const line of result.output.split('\n').filter((l) => l.startsWith('captured'))) {
      expect(Number(/ (\d+)ms after navigation/.exec(line)![1])).toBeGreaterThanOrEqual(1500)
    }
  })

  it('stays quiet for a clean presentation', () => {
    expect(outputs['fx-clean'].output).not.toContain('WARN')
    expect(outputs['fx-clean'].output).toContain('0 advisory warnings')
  })

  it('warns, step by step, about an unmarked text collision', () => {
    const lines = warnings('fx-collision', 'overlap')
    expect(lines).toHaveLength(3)
    ;[1, 2, 3].forEach((n, i) => expect(lines[i]).toContain(`WARN step ${n} overlap`))
    expect(lines[0]).toContain('First overlapping text')
    expect(lines[0]).toContain('Second overlapping text')
    expect(lines[0]).toContain('data-presentation-allow-overlap')
  })

  it('does not warn about an explicitly allowed overlap', () => {
    expect(warnings('fx-allowed', 'overlap')).toEqual([])
    expect(outputs['fx-allowed'].output).toContain('0 advisory warnings')
  })

  it('ignores overlapping text that is invisible itself or through an ancestor', () => {
    expect(outputs['fx-hidden'].code, outputs['fx-hidden'].output).toBe(0)
    expect(warnings('fx-hidden', 'overlap')).toEqual([])
    expect(outputs['fx-hidden'].output).toContain('0 advisory warnings')
  })

  it('warns when active progress and table-of-contents chrome is indistinct', () => {
    const lines = warnings('fx-chrome', 'active-chrome')
    expect(lines.filter((l) => l.includes('progress indicator'))).toHaveLength(3)
    expect(lines.filter((l) => l.includes('table-of-contents entry'))).toHaveLength(3)
    expect(lines[0]).toContain('WARN step 1')
    expect(warnings('fx-clean', 'active-chrome')).toEqual([])
    expect(warnings('fx-collision', 'active-chrome')).toEqual([])
  })

  it('warns about browser-default attribution and points at its styling hook', () => {
    const lines = warnings('fx-attribution', 'attribution')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('browser-default')
    expect(lines[0]).toContain('data-presentation-attribution')
    expect(warnings('fx-clean', 'attribution')).toEqual([])
  })

  it('treats warnings as advisory and real capture failures as errors', async () => {
    expect(outputs['fx-collision'].code).toBe(0)
    const missing = await inspect('does-not-exist')
    expect(missing.code).toBe(1)
    expect(missing.output).toContain('ERROR inspect')
    const usage = await run(process.execPath, ['scripts/inspect-presentation.mjs'], project)
    expect(usage.code).toBe(1)
    expect(usage.output).toContain('usage:')
    expect(existsSync(path.join(project, 'inspection', 'does-not-exist', 'step-01.png'))).toBe(false)
  })
})
