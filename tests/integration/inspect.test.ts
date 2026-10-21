// INT-002: the project-local screenshot helper emits faithful artifacts and advisory warnings.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BOOTSTRAP, cleanupTempDirs, isPortOpen, leftoverProcesses, linkNodeModules, pngSize, previewPort, run, tempDir } from '../helpers'

const GOOD_CSS = `
[data-presentation-progress-dot][data-presentation-active='true'] { background: #e0b84c; transform: scale(1.4); }
[data-presentation-toc-entry][data-presentation-active='true'] { background: #e0b84c; font-weight: 700; }
[data-presentation-progress-dot] { width: 12px; height: 12px; border: 1px solid #888; border-radius: 50%; background: transparent; padding: 0; }
[data-presentation-attribution] { font-size: 13px; color: #555; text-decoration: underline; }
[data-presentation-progress] { display: flex; gap: 8px; }
[data-presentation-footer] { display: flex; flex-direction: column; gap: 10px; }
`
const ACTIVE_CSS = `
[data-presentation-progress-dot][data-presentation-active='true'] { background: #e0b84c; transform: scale(1.4); }
[data-presentation-toc-entry][data-presentation-active='true'] { background: #e0b84c; font-weight: 700; }
[data-presentation-progress-dot] { width: 12px; height: 12px; border: 1px solid #888; border-radius: 50%; background: transparent; padding: 0; }
[data-presentation-progress] { display: flex; gap: 8px; }
[data-presentation-footer] { display: flex; flex-direction: column; gap: 10px; }
`
const ATTRIBUTION_CSS = `[data-presentation-attribution] { font-size: 13px; color: #555; text-decoration: underline; }
[data-presentation-progress] { display: flex; gap: 8px; }
[data-presentation-footer] { display: flex; flex-direction: column; gap: 10px; }`

const FONT_WEIGHT_CSS = `
[data-presentation-progress-dot][data-presentation-active='true'] { font-weight: 700; }
[data-presentation-toc-entry][data-presentation-active='true'] { background: #e0b84c; font-weight: 700; }
${ATTRIBUTION_CSS}`

interface Variant {
  slug: string
  css: string
  scene: string
  attribution?: boolean
}

const pair = (a: string, b: string, marked: boolean, top: number) =>
  `<div ${marked ? 'data-presentation-allow-overlap="" ' : ''}style={{ position: 'absolute', left: 80, top: ${top}, width: 300, height: 40 }}>
     <span style={{ position: 'absolute', left: 0, top: 0 }}>${a}</span>
     <span style={{ position: 'absolute', left: 20, top: 6 }}>${b}</span>
   </div>`

const sceneFor = (inner: string) => `import type { SceneProps } from '../../presentation-kit'
export interface SceneState { step: number }
export function FixtureScene({ payload }: SceneProps<SceneState>) {
  const n = payload.step
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <span style={{ position: 'absolute', left: 10, top: 10 }}>Anchor {n}</span>
      ${inner}
    </div>
  )
}
`

const variants: Variant[] = [
  { slug: 'fx-clean', css: GOOD_CSS, scene: '' },
  { slug: 'fx-collision', css: GOOD_CSS, scene: `{n >= 2 && ${pair('Alpha text', 'Beta text', false, 100)}}` },
  { slug: 'fx-allowed', css: GOOD_CSS, scene: `{n >= 2 && ${pair('Alpha text', 'Beta text', true, 100)}}` },
  {
    slug: 'fx-mixed',
    css: GOOD_CSS,
    scene: `{n >= 2 && (<>${pair('Allowed one', 'Allowed two', true, 60)}${pair('Gamma text', 'Delta text', false, 200)}</>)}`,
  },
  { slug: 'fx-fontweight-dots', css: FONT_WEIGHT_CSS, scene: '' },
  {
    slug: 'fx-svg-collision',
    css: GOOD_CSS,
    scene: `{n >= 2 && (<svg width="300" height="60" style={{ position: 'absolute', left: 80, top: 100 }}><text x="0" y="20">Svg alpha</text><text x="10" y="24">Svg beta</text></svg>)}`,
  },
  { slug: 'fx-indistinct', css: ATTRIBUTION_CSS, scene: '' },
  { slug: 'fx-default-attribution', css: ACTIVE_CSS, scene: '' },
  { slug: 'fx-small-attribution', css: `${ACTIVE_CSS}\n[data-presentation-attribution] { font-size: 8px; color: #555; }`, scene: '' },
  { slug: 'fx-no-attribution', css: GOOD_CSS, scene: '', attribution: false },
]

function talk(v: Variant) {
  return `import { Presentation } from '../../presentation-kit'
import './fixture.css'
import { FixtureScene } from './Scene'

const STEPS = [1, 2, 3].map((n) => ({
  id: 's' + n, era: n === 3 ? 'late' : 'early', title: 'Title ' + n, caption: 'Caption ' + n,
  groupKey: 'g', Scene: FixtureScene, payload: { step: n },
}))

export default function Talk() {
  return <Presentation steps={STEPS} title="${v.slug}" initialMode="browse"${v.attribution === false ? ' attribution={false}' : ''} />
}
`
}

let app: string
let noDist: string
const outside = () => tempDir('and-scene-cwd-')

function inspect(slug: string, extra: string[] = [], root = app) {
  return run('node', [join(root, 'scripts/inspect-presentation.mjs'), slug, '--skip-build', ...extra], { cwd: outside(), timeoutMs: 120_000 })
}

const warnings = (out: string) => out.split('\n').filter((l) => l.startsWith('[inspect] WARN'))
const shotDir = (slug: string, root = app) => join(root, '.inspection', slug)

function materialize(dir: string) {
  cpSync(BOOTSTRAP, dir, { recursive: true, filter: (p) => !p.includes('node_modules') })
  rmSync(join(dir, 'src/presentations/starter'), { recursive: true })
  const lines = variants.map((v) => `  { slug: '${v.slug}', title: '${v.slug}', load: () => import('./${v.slug}/Talk') },`)
  writeFileSync(join(dir, 'src/presentations/index.ts'), `import type { PresentationEntry } from './types'\nexport const presentations: PresentationEntry[] = [\n${lines.join('\n')}\n]\n`)
  for (const v of variants) {
    const d = join(dir, 'src/presentations', v.slug)
    mkdirSync(d, { recursive: true })
    writeFileSync(join(d, 'Talk.tsx'), talk(v))
    writeFileSync(join(d, 'Scene.tsx'), sceneFor(v.scene))
    writeFileSync(join(d, 'fixture.css'), v.css)
  }
  linkNodeModules(dir)
}

beforeAll(async () => {
  app = tempDir('and-scene-int2-')
  materialize(app)
  const build = await run('npm', ['run', 'build'], { cwd: app, timeoutMs: 200_000 })
  expect(build.code, build.out).toBe(0)
  noDist = tempDir('and-scene-int2-nodist-')
  materialize(noDist)
}, 300_000)

afterAll(cleanupTempDirs)

describe('screenshots', () => {
  it('writes one decodable desktop screenshot per step under the project, plus a report', async () => {
    const r = await inspect('fx-clean')
    expect(r.code, r.out).toBe(0)
    const files = readdirSync(shotDir('fx-clean')).sort()
    expect(files).toEqual(['report.json', 'step-01.png', 'step-02.png', 'step-03.png'])
    for (const f of files.filter((f) => f.endsWith('.png'))) {
      expect(pngSize(readFileSync(join(shotDir('fx-clean'), f)))).toEqual({ width: 1440, height: 900 })
    }
    const report = JSON.parse(readFileSync(join(shotDir('fx-clean'), 'report.json'), 'utf8'))
    expect(report.steps.map((s: { file: string; index: number; title: string }) => [s.file, s.index, s.title])).toEqual([
      ['step-01.png', 0, 'Title 1'],
      ['step-02.png', 1, 'Title 2'],
      ['step-03.png', 2, 'Title 3'],
    ])
    expect(r.out).toMatch(/open http:\/\/127\.0\.0\.1:\d+\/fx-clean/)
    expect(r.out).toMatch(/--host 127\.0\.0\.1/)
    expect(warnings(r.out)).toEqual([])
    expect(await leftoverProcesses(app)).toEqual([])
    expect(await isPortOpen(previewPort(r.out)!)).toBe(false)
  })

  it('waits the configured settle interval before every capture, including the first', async () => {
    const r = await inspect('fx-clean', ['--settle-ms', '1500'])
    expect(r.code, r.out).toBe(0)
    const report = JSON.parse(readFileSync(join(shotDir('fx-clean'), 'report.json'), 'utf8'))
    expect(report.settleMs).toBe(1500)
    for (const s of report.steps) expect(s.capturedAt - s.navigatedAt, `step ${s.step}`).toBeGreaterThanOrEqual(1500)
  })

  it('supports a narrow viewport and honors the settle interval there too', async () => {
    const r = await inspect('fx-clean', ['--viewport', '390x844', '--settle-ms', '1100'])
    expect(r.code, r.out).toBe(0)
    const narrow = shotDir('fx-clean-390x844')
    for (const f of ['step-01.png', 'step-02.png', 'step-03.png']) {
      expect(pngSize(readFileSync(join(narrow, f)))).toEqual({ width: 390, height: 844 })
    }
    const report = JSON.parse(readFileSync(join(narrow, 'report.json'), 'utf8'))
    expect(report.viewport).toEqual({ width: 390, height: 844 })
    for (const s of report.steps) expect(s.capturedAt - s.navigatedAt).toBeGreaterThanOrEqual(1100)
  })
})

describe('advisory warnings', () => {
  it('reports an unmarked text collision at the step where it appears, naming both elements', async () => {
    const r = await inspect('fx-collision')
    expect(r.code, r.out).toBe(0)
    const overlap = warnings(r.out).filter((w) => w.includes('overlap'))
    expect(overlap.length).toBeGreaterThan(0)
    expect(overlap.some((w) => w.includes('step 1 '))).toBe(false)
    expect(overlap.some((w) => w.includes('step 2 ') && w.includes('Alpha text') && w.includes('Beta text'))).toBe(true)
    expect(overlap.some((w) => w.includes('step 3 ') && w.includes('Alpha text'))).toBe(true)
    expect(readdirSync(shotDir('fx-collision')).filter((f) => f.endsWith('.png'))).toHaveLength(3)
  })

  it('does not report an explicitly allowed overlap', async () => {
    const r = await inspect('fx-allowed')
    expect(r.code, r.out).toBe(0)
    expect(warnings(r.out).filter((w) => w.includes('overlap'))).toEqual([])
  })

  it('exempts only the marked subtree and still reports an unrelated collision', async () => {
    const r = await inspect('fx-mixed')
    expect(r.code, r.out).toBe(0)
    const overlap = warnings(r.out).filter((w) => w.includes('overlap'))
    expect(overlap.some((w) => w.includes('Gamma text') && w.includes('Delta text'))).toBe(true)
    expect(overlap.some((w) => w.includes('Allowed'))).toBe(false)
  })

  it('does not let a font-weight change on label-less progress dots count as a visible active state', async () => {
    const r = await inspect('fx-fontweight-dots')
    expect(r.code, r.out).toBe(0)
    expect(warnings(r.out).some((l) => l.includes('active-chrome') && l.includes('progress indicator'))).toBe(true)
    expect(warnings(r.out).some((l) => l.includes('active-chrome') && l.includes('table-of-contents'))).toBe(false)
  })

  it('reports an unmarked collision between SVG text elements', async () => {
    const r = await inspect('fx-svg-collision')
    expect(r.code, r.out).toBe(0)
    expect(warnings(r.out).some((l) => l.includes('step 2 overlap') && l.includes('Svg alpha') && l.includes('Svg beta'))).toBe(true)
  })

  it('reports indistinct active chrome for progress indicators and the table of contents', async () => {
    const r = await inspect('fx-indistinct')
    expect(r.code, r.out).toBe(0)
    const w = warnings(r.out)
    expect(w.some((l) => l.includes('step 1 active-chrome') && l.includes('progress indicator'))).toBe(true)
    expect(w.some((l) => l.includes('step 2 active-chrome') && l.includes('table-of-contents entry'))).toBe(true)
    expect(w.some((l) => l.includes('attribution'))).toBe(false)
  })

  it('does not report distinctly styled active chrome', async () => {
    const r = await inspect('fx-clean')
    expect(warnings(r.out).filter((l) => l.includes('active-chrome'))).toEqual([])
  })

  it('reports a browser-default attribution and points at the styling hook', async () => {
    const r = await inspect('fx-default-attribution')
    expect(r.code, r.out).toBe(0)
    const w = warnings(r.out).filter((l) => l.includes('attribution'))
    expect(w.some((l) => l.includes('step 1') && l.includes('browser-default') && l.includes('[data-presentation-attribution]'))).toBe(true)
    expect(warnings(r.out).some((l) => l.includes('active-chrome'))).toBe(false)
  })

  it('reports a too-small attribution', async () => {
    const r = await inspect('fx-small-attribution')
    expect(r.code, r.out).toBe(0)
    expect(warnings(r.out).some((l) => l.includes('step 2') && l.includes('too small'))).toBe(true)
  })

  it('reports a missing attribution without failing the capture', async () => {
    const r = await inspect('fx-no-attribution')
    expect(r.code, r.out).toBe(0)
    expect(warnings(r.out).some((l) => l.includes('step 3') && l.includes('attribution link is missing'))).toBe(true)
    expect(readdirSync(shotDir('fx-no-attribution')).filter((f) => f.endsWith('.png'))).toHaveLength(3)
  })
})

describe('capture failures', () => {
  it('fails for an unknown presentation without writing screenshots', async () => {
    const r = await inspect('nope')
    expect(r.code).not.toBe(0)
    expect(r.out).toContain('[inspect] FAIL capture: unknown presentation "nope"')
    expect(existsSync(shotDir('nope'))).toBe(false)
    expect(r.out).not.toMatch(/wrote \d+ screenshots/)
  })

  it('fails when the production preview cannot start, and leaves no process behind', async () => {
    const r = await inspect('fx-clean', [], noDist)
    expect(r.code).not.toBe(0)
    expect(r.out).toContain('[inspect] FAIL capture: preview server failed')
    expect(r.out).not.toMatch(/wrote \d+ screenshots/)
    expect(await leftoverProcesses(noDist)).toEqual([])
  })

  it('rejects an invalid settle interval or viewport', async () => {
    expect((await inspect('fx-clean', ['--settle-ms', 'soon'])).code).not.toBe(0)
    expect((await inspect('fx-clean', ['--viewport', 'wide'])).code).not.toBe(0)
  })
})
