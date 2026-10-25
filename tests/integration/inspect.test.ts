// INT-002: the screenshot helper emits faithful artifacts and advisory warnings.
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { materializeBootstrap, sh, type Result } from '../helpers/materialize.ts'

const POLISHED_CSS = `
[data-presentation-progress-dot] { width: 12px; height: 12px; border-radius: 50%; border: 1px solid #555; background: transparent; padding: 0; }
[data-presentation-progress-dot][data-active='true'] { background: #1d6fd1; width: 16px; height: 16px; }
[data-presentation-toc-entry][data-active='true'] { font-weight: 700; background: #dde6f2; }
[data-presentation-attribution] { font-family: sans-serif; font-size: 14px; color: #555; }
.box { border: 1px solid #888; font-family: sans-serif; font-size: 14px; }
`

function fixture(slug: string, opts: { css: boolean; allowOverlap: boolean }) {
  const talk = `import { Appear, Box, Presentation, SceneLayer, type AnyStep, type SceneProps } from '../../presentation-kit/index.ts'
${opts.css ? "import './style.css'" : ''}

type State = { second: boolean }
function Scene({ payload }: SceneProps<State>) {
  return (
    <SceneLayer>
      <Box id="${slug}/a" className="box" at={{ x: 100, y: 100, w: 260, h: 40 }}>alpha beta gamma delta</Box>
      {payload.second ? (
        <Appear id="${slug}/b-slot" enter at={{ x: 160, y: 110, w: 260, h: 40 }}${opts.allowOverlap ? ' allowOverlap' : ''}>
          <Box id="${slug}/b" className="box">overlapping words here</Box>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}
const step = (id: string, era: string, second: boolean): AnyStep => ({
  id, era, title: id, caption: 'caption ' + id, Scene, groupKey: 'g', payload: { second },
})
const STEPS = [step('one', 'first', false), step('two', 'first', true), step('three', 'second', true)]
export default function Talk() {
  return <Presentation steps={STEPS} title="${slug}" initialMode="browse" />
}
`
  return { talk, css: opts.css ? POLISHED_CSS : null }
}

const VARIANTS = {
  'fx-collision': fixture('fx-collision', { css: true, allowOverlap: false }),
  'fx-allowed': fixture('fx-allowed', { css: true, allowOverlap: true }),
  'fx-plain': fixture('fx-plain', { css: false, allowOverlap: true }),
}

let dir = ''
const runs: Record<string, { result: Result; warnings: string[]; manifest: { steps: { step: number; file: string; navigatedAt: number; capturedAt: number; settleMs: number }[] } }> = {}

function inspect(slug: string, extra: string[] = []) {
  const result = sh('node', ['scripts/inspect-presentation.mjs', slug, '--skip-build', ...extra], dir)
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'inspection', slug, 'manifest.json'), 'utf8'))
  const warnings = result.out.split('\n').filter((l) => l.startsWith('[inspect] WARN'))
  return { result, warnings, manifest }
}

beforeAll(() => {
  dir = materializeBootstrap('and-scene-int002').dir
  const registry = path.join(dir, 'src/presentations/index.ts')
  let text = fs.readFileSync(registry, 'utf8')
  for (const [slug, v] of Object.entries(VARIANTS)) {
    const folder = path.join(dir, 'src/presentations', slug)
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(path.join(folder, 'Talk.tsx'), v.talk)
    if (v.css) fs.writeFileSync(path.join(folder, 'style.css'), v.css)
    text = text.replace(/\n\]/, `\n  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk.tsx') },\n]`)
  }
  fs.writeFileSync(registry, text)
  const build = sh('npm', ['run', 'build'], dir)
  if (build.code !== 0) throw new Error(build.out)
  runs['fx-collision'] = inspect('fx-collision', ['--settle', '1200'])
  runs['fx-allowed'] = inspect('fx-allowed', ['--settle', '700'])
  runs['fx-plain'] = inspect('fx-plain', ['--settle', '700'])
})

afterAll(() => {
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
})

describe('INT-002 screenshot helper', () => {
  it('writes one predictable screenshot per step under inspection/<slug>/', () => {
    const run = runs['fx-collision']
    expect(run.result.code, run.result.out).toBe(0)
    const files = fs.readdirSync(path.join(dir, 'inspection/fx-collision')).filter((f) => f.endsWith('.png')).sort()
    expect(files).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    for (const f of files) expect(fs.statSync(path.join(dir, 'inspection/fx-collision', f)).size).toBeGreaterThan(1000)
    expect(run.manifest.steps.map((s) => s.file)).toEqual(files.map((f) => `inspection/fx-collision/${f}`))
  })

  it('captures only after the configured settle interval has passed', () => {
    for (const s of runs['fx-collision'].manifest.steps) {
      expect(s.settleMs).toBe(1200)
      expect(s.capturedAt - s.navigatedAt).toBeGreaterThanOrEqual(1200)
    }
  })

  it('reports an unmarked text collision, naming the step and the elements', () => {
    const overlap = runs['fx-collision'].warnings.filter((w) => w.includes('overlap'))
    expect(overlap.length).toBeGreaterThan(0)
    expect(overlap.every((w) => /step [23]:/.test(w))).toBe(true)
    expect(overlap.some((w) => w.includes('alpha beta') && w.includes('overlapping words'))).toBe(true)
    expect(overlap.some((w) => w.includes('step 1:'))).toBe(false)
  })

  it('does not report overlap inside an explicit allow-overlap subtree', () => {
    expect(runs['fx-allowed'].warnings.filter((w) => w.includes('overlap'))).toEqual([])
    expect(runs['fx-allowed'].result.code).toBe(0)
  })

  it('does not warn about polished active chrome or attribution', () => {
    for (const slug of ['fx-collision', 'fx-allowed']) {
      expect(runs[slug].warnings.filter((w) => /indistinct|attribution/.test(w)), slug).toEqual([])
    }
  })

  it('reports indistinct active chrome per step', () => {
    const w = runs['fx-plain'].warnings.filter((x) => x.includes('indistinct'))
    expect(w.some((x) => x.includes('progress indicator'))).toBe(true)
    expect(w.some((x) => x.includes('table-of-contents entry'))).toBe(true)
    expect(w.some((x) => x.includes('step 2:'))).toBe(true)
  })

  it('reports an unpolished attribution and points to the styling hook', () => {
    const w = runs['fx-plain'].warnings.filter((x) => x.includes('attribution'))
    expect(w.length).toBeGreaterThan(0)
    expect(w.every((x) => x.includes('[data-presentation-attribution]'))).toBe(true)
  })

  it('treats warnings as advisory (exit code stays zero)', () => {
    expect(runs['fx-plain'].result.code).toBe(0)
    expect(runs['fx-plain'].result.out).toMatch(/\d+ advisory warning/)
  })

  it('fails with a clear error for an unknown presentation', () => {
    const res = sh('node', ['scripts/inspect-presentation.mjs', 'no-such-slug', '--skip-build', '--settle', '10'], dir)
    expect(res.code).not.toBe(0)
    expect(res.out).toContain('[inspect] ERROR')
  })
})
