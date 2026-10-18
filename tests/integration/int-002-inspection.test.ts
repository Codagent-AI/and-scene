import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it, inject } from 'vitest'
import { registerPresentation } from '../../skills/presentation/scripts/new-presentation.mjs'
import { read } from '../unit/helpers'
import { run, type Run } from './run'

const appDir = inject('appDir')

const CSS = {
  base: ".fx{background:#111;color:#eee}.fx [data-presentation-header]{display:flex;align-items:center;gap:16px;padding:16px 24px}.fx [data-presentation-footer]{padding:0 24px 48px}.fx [data-presentation-toc]{padding:90px 0 0 24px;width:200px}.fx [data-presentation-controls]{margin-top:8px}",
  progress:
    ".fx [data-presentation-progress-item]{width:12px;height:12px;padding:0;border:1px solid #888;background:transparent}.fx [data-presentation-progress-item][data-presentation-active='true']{width:26px;background:#e6c76b}",
  toc: ".fx [data-presentation-toc-entry]{color:#999;background:none;border:0}.fx [data-presentation-toc-entry][data-presentation-active='true']{color:#fff;font-weight:700;background:#333}",
  attribution: ".fx [data-presentation-attribution]{right:24px;bottom:12px;font-size:13px;color:#e6c76b;text-decoration:none}",
}
const GOOD = [CSS.base, CSS.progress, CSS.toc, CSS.attribution]

interface Fixture {
  css: string[]
  overlap?: 'collide' | 'allowed'
  attribution?: false
  animate?: boolean
  extraCss?: string
}

const FIXTURES: Record<string, Fixture> = {
  'fx-clean': { css: GOOD },
  'fx-collision': { css: GOOD, overlap: 'collide' },
  'fx-allowed': { css: GOOD, overlap: 'allowed' },
  'fx-unstyled': { css: [] },
  'fx-no-progress-style': { css: [CSS.base, CSS.toc, CSS.attribution] },
  'fx-no-toc-style': { css: [CSS.base, CSS.progress, CSS.attribution] },
  'fx-small-attr': { css: [...GOOD, '.fx [data-presentation-attribution]{font-size:9px}'] },
  'fx-no-attr': { css: GOOD, attribution: false },
  'fx-endless-finite': { css: [...GOOD, '@keyframes fx-slow{from{opacity:.2}to{opacity:1}}.fx [data-presentation-entity="slow"]{animation:fx-slow 6s linear}'], animate: true },
  'fx-delayed': { css: [...GOOD, '@keyframes fx-fade{from{opacity:.2}to{opacity:1}}.fx [data-presentation-entity="slow"]{animation:fx-fade 1.8s linear}'], animate: true },
}

function talk(name: string, f: Fixture): string {
  const overlap = (key: string) =>
    f.overlap === undefined
      ? ''
      : (() => {
          const pair = `<Label key="a-${key}" id="a-${key}" at={{ x: 100, y: 100, w: 220, h: 30 }}>Alpha collides</Label><Label key="b-${key}" id="b-${key}" at={{ x: 130, y: 110, w: 220, h: 30 }}>Beta collides</Label>`
          return f.overlap === 'allowed' ? `<div key="g-${key}" data-presentation-allow-overlap="">${pair}</div>` : pair
        })()
  return `import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './talk.css'

interface P { stage: number }

function Scene({ payload }: SceneProps<P>) {
  return (
    <SceneLayer>
      <Label key="stage" id="stage" at={{ x: 40 + payload.stage * 120, y: 20, w: 200, h: 30 }}>stage {payload.stage + 1}</Label>
      ${f.animate ? `{payload.stage === 1 && <Label key="slow" id="slow" at={{ x: 400, y: 200, w: 200, h: 30 }}>slow reveal</Label>}` : ''}
      {payload.stage === 1 && <>${overlap('x')}</>}
    </SceneLayer>
  )
}

const STEPS: Step<P>[] = [0, 1, 2].map((i) => ({
  id: 's' + i, era: i === 0 ? 'first' : i === 1 ? 'second' : 'third', title: '${name} title ' + (i + 1), caption: 'caption ' + (i + 1),
  groupKey: 'g', Scene, payload: { stage: i },
}))

export default function Talk() {
  return <Presentation className="fx" steps={STEPS} title="${name}" initialMode="browse"${f.attribution === false ? ' attribution={false}' : ''} />
}
`
}

function stdoutWarnings(r: Run) {
  return r.output.split('\n').filter((l) => l.startsWith('WARN'))
}

function pngSize(file: string) {
  const b = fs.readFileSync(file)
  expect(b.subarray(1, 4).toString()).toBe('PNG')
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

const results = new Map<string, Run>()
const inspectDir = (name: string, sub = '') => path.join(appDir, '.presentation-inspection', name, sub)
const report = (name: string, sub = '') => JSON.parse(read(inspectDir(name, sub), 'report.json'))

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  beforeAll(() => {
    const indexFile = path.join(appDir, 'src/presentations/index.ts')
    let index = read(indexFile)
    for (const [name, f] of Object.entries(FIXTURES)) {
      const dir = path.join(appDir, 'src/presentations', name)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'Talk.tsx'), talk(name, f))
      fs.writeFileSync(path.join(dir, 'talk.css'), f.css.join('\n'))
      index = registerPresentation(index, { slug: name, title: name })
    }
    fs.writeFileSync(indexFile, index)
    const build = run('npm', ['run', 'build'], appDir)
    expect(build.status, build.output).toBe(0)
    for (const name of Object.keys(FIXTURES).filter((n) => n !== 'fx-endless-finite')) {
      results.set(name, run('npm', ['run', 'inspect', '--', name, '--no-build', '--settle', '300'], appDir))
    }
  }, 460_000)

  it('writes one predictable desktop screenshot per step and exits zero', () => {
    const r = results.get('fx-clean')!
    expect(r.status, r.output).toBe(0)
    const files = fs.readdirSync(inspectDir('fx-clean')).sort()
    expect(files).toEqual(['report.json', 'step-01.png', 'step-02.png', 'step-03.png'])
    for (const f of files.filter((n) => n.endsWith('.png'))) expect(pngSize(inspectDir('fx-clean', f))).toEqual([1440, 900])
  })

  it('captures distinct, correctly ordered steps', () => {
    const rep = report('fx-clean')
    expect(rep.steps.map((s: { step: number; index: number; title: string }) => [s.step, s.index, s.title])).toEqual([
      [1, 0, 'fx-clean title 1'],
      [2, 1, 'fx-clean title 2'],
      [3, 2, 'fx-clean title 3'],
    ])
    expect(new Set(rep.steps.map((s: { sha256: string }) => s.sha256)).size).toBe(3)
    expect(rep.steps[0].file).toBe(path.join('.presentation-inspection', 'fx-clean', 'step-01.png'))
  })

  it('stays quiet for a well-styled presentation', () => {
    expect(stdoutWarnings(results.get('fx-clean')!)).toEqual([])
  })

  it('captures only after the settle interval and once animations finished', () => {
    const rep = report('fx-delayed')
    for (const s of rep.steps) {
      expect(s.runningAnimations).toBe(0)
      expect(s.settledAfterMs).toBeGreaterThanOrEqual(300)
    }
    // The 1.8s animation on step 2 outlasts the 300ms interval; the helper waited for it.
    expect(rep.steps[1].settledAfterMs).toBeGreaterThanOrEqual(1500)
    expect(rep.steps[0].settledAfterMs).toBeLessThan(1500)
  })

  it('reports an unmarked text collision on its step, naming both elements', () => {
    const w = stdoutWarnings(results.get('fx-collision')!)
    const overlap = w.filter((l) => l.includes('[overlap]'))
    expect(overlap).toHaveLength(1)
    expect(overlap[0]).toMatch(/step 2: .*Alpha collides.* overlaps .*Beta collides/)
    expect(w.filter((l) => l.includes('step 1') || l.includes('step 3'))).toEqual([])
  })

  it('does not report an overlap inside an allow-overlap subtree', () => {
    const r = results.get('fx-allowed')!
    expect(r.status).toBe(0)
    expect(stdoutWarnings(r).filter((l) => l.includes('[overlap]'))).toEqual([])
    expect(fs.existsSync(inspectDir('fx-allowed', 'step-02.png'))).toBe(true)
  })

  it('reports indistinct active chrome and unpolished attribution for each step, yet still captures', () => {
    const r = results.get('fx-unstyled')!
    expect(r.status).toBe(0)
    const w = stdoutWarnings(r)
    for (const step of [1, 2, 3]) {
      expect(w).toContain(`WARN [active-chrome] step ${step}: active progress item looks the same as inactive ones; style [data-presentation-active="true"]`)
      expect(w).toContain(`WARN [active-chrome] step ${step}: active table-of-contents entry looks the same as inactive ones; style [data-presentation-active="true"]`)
      expect(w.some((l) => l.startsWith(`WARN [attribution] step ${step}:`) && l.includes('[data-presentation-attribution]'))).toBe(true)
    }
    expect(fs.readdirSync(inspectDir('fx-unstyled')).filter((f) => f.endsWith('.png'))).toHaveLength(3)
  })

  it('tells progress and table-of-contents chrome apart', () => {
    const progress = stdoutWarnings(results.get('fx-no-progress-style')!).filter((l) => l.includes('[active-chrome]'))
    expect(progress).toHaveLength(3)
    expect(progress.every((l) => l.includes('progress item'))).toBe(true)
    const toc = stdoutWarnings(results.get('fx-no-toc-style')!).filter((l) => l.includes('[active-chrome]'))
    expect(toc).toHaveLength(3)
    expect(toc.every((l) => l.includes('table-of-contents entry'))).toBe(true)
  })

  it('reports undersized and missing attribution', () => {
    expect(stdoutWarnings(results.get('fx-small-attr')!).filter((l) => l.includes('font-size 9px is under 12px'))).toHaveLength(3)
    const missing = stdoutWarnings(results.get('fx-no-attr')!).filter((l) => l.includes('[attribution]'))
    expect(missing).toHaveLength(3)
    expect(missing.every((l) => l.includes('no attribution link found') && l.includes('[data-presentation-attribution]'))).toBe(true)
  })

  it('captures a narrow viewport into its own directory', () => {
    const r = run('npm', ['run', 'inspect', '--', 'fx-clean', '--narrow', '--no-build', '--settle', '300'], appDir)
    expect(r.status, r.output).toBe(0)
    expect(pngSize(inspectDir('fx-clean', 'narrow/step-01.png'))).toEqual([390, 844])
    expect(report('fx-clean', 'narrow').viewport).toBe('narrow')
  })

  it('refuses to capture a screenshot while a finite animation is still running', () => {
    const r = run('npm', ['run', 'inspect', '--', 'fx-endless-finite', '--no-build', '--settle', '100', '--animation-timeout', '500'], appDir)
    expect(r.status).not.toBe(0)
    expect(r.output).toMatch(/step 2: 1 animation\(s\) still running after 500ms/)
    expect(fs.existsSync(inspectDir('fx-endless-finite', 'step-02.png'))).toBe(false)
  })

  it('rejects a slug that would point the output at the project, leaving the project intact', () => {
    const marker = path.join(appDir, 'package.json')
    for (const slug of ['..', '../..', 'a/../..']) {
      const r = run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build'], appDir)
      expect(r.status, slug).not.toBe(0)
      expect(r.output, slug).toMatch(/invalid slug|inspect failed/)
    }
    expect(fs.existsSync(marker)).toBe(true)
    expect(fs.existsSync(path.join(appDir, 'src'))).toBe(true)
  })

  it('exits non-zero when capture cannot happen, and cleans up the preview', () => {
    const r = run('npm', ['run', 'inspect', '--', 'no-such-presentation', '--no-build', '--settle', '100'], appDir)
    expect(r.status).not.toBe(0)
    expect(r.output).toMatch(/inspect failed/)
  })
})
