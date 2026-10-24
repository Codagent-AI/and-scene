import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, editFile, makeTempDir, removeDir, run, runAsync } from '../helpers'

const SETTLE_MS = 1300

// A tiny presentation used as an inspection fixture. `collide` places two
// labels on top of each other from step 2; `allow` wraps them in an
// allow-overlap marker; `polish` styles active chrome and attribution.
function fixture(slug: string, opts: { collide?: boolean; allow?: boolean; polish?: boolean; intrude?: boolean }) {
  const stack = `
          <Label id="${slug}/a" x={100} y={100} w={160} h={30}>alpha text</Label>
          <Label id="${slug}/b" x={120} y={108} w={160} h={30}>beta text</Label>`
  const body = opts.allow ? `<div data-presentation-allow-overlap="">${stack}</div>` : stack
  const intrusion = opts.intrude
    ? `
.fx [data-presentation-mode-toggle] { padding: 20px 60px; }
.fx .intruder { position: fixed; top: 14px; right: 4px; margin: 0; font-size: 10px; }
`
    : ''
  const css = `
.fx [data-presentation-progress-item][aria-current='step'] { width: 30px; background: #c7a755; }
.fx [data-presentation-progress-item] { width: 12px; height: 12px; padding: 0; }
.fx [data-presentation-toc-item][aria-current='step'] { font-weight: 700; background: #333; }
.fx [data-presentation-footer] { padding: 0 200px 0 24px; }
.fx [data-presentation-attribution] { font-size: 14px; color: #bbb; padding: 4px 8px; right: 16px !important; bottom: 12px !important; }
${intrusion}`
  return {
    'Talk.tsx': `import { Appear, Box, Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
export const unusedLabel = Label
${opts.polish ? "import './fx.css'\n" : ''}
function Scene({ payload: { n } }: SceneProps<{ n: number }>) {
  return (
    <SceneLayer>
      {n >= 1 && (
        <Appear key="one">
          <Box id="${slug}/box" x={40} y={40} w={120} h={40}>box</Box>
        </Appear>
      )}
      {n >= 2 && (
        <Appear key="two">${opts.collide || opts.allow ? body : `<Box id="${slug}/extra" x={400} y={100} w={100} h={30}>extra</Box>`}
        </Appear>
      )}
    </SceneLayer>
  )
}

const STEPS: Step<{ n: number }>[] = [1, 2, 3].map((n) => ({
  id: 's' + n,
  era: n === 1 ? 'first' : 'later',
  title: 'Step ' + n,
  caption: 'Caption ' + n,
  groupKey: 'g',
  Scene,
  payload: { n },
}))

export default function Talk() {
  return (
    <div className="fx">
      ${opts.intrude ? '<p className="intruder">x</p>' : ''}
      <Presentation steps={STEPS} initialMode="browse" />
    </div>
  )
}
`,
    'fx.css': css,
  }
}

const FIXTURES = {
  'fx-collision': fixture('fx-collision', { collide: true, polish: true }),
  'fx-allowed': fixture('fx-allowed', { allow: true, polish: true }),
  'fx-chrome': fixture('fx-chrome', { polish: true, intrude: true }),
  'fx-plain': fixture('fx-plain', { polish: false }),
  'fx-clean': fixture('fx-clean', { polish: true }),
}

interface Report {
  steps: { step: number; file: string; capturedAfterMs: number }[]
  warnings: { step: number; text: string }[]
}

let root: string
let tmp: string
const results: Record<string, { output: string; status: number | null; report: Report; dir: string }> = {}

beforeAll(async () => {
  tmp = makeTempDir('and-scene-int2-')
  root = copyRepo(path.join(tmp, 'app'))
  const indexFile = path.join(root, 'src', 'presentations', 'index.ts')
  for (const [slug, files] of Object.entries(FIXTURES)) {
    const dir = path.join(root, 'src', 'presentations', slug)
    fs.mkdirSync(dir, { recursive: true })
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text)
    editFile(indexFile, (t) =>
      t.replace('export const PRESENTATIONS: PresentationEntry[] = [\n', `export const PRESENTATIONS: PresentationEntry[] = [\n  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },\n`),
    )
  }
  const build = await runAsync('npm', ['run', 'build'], root)
  if (build.status !== 0) throw new Error(build.output)
  for (const slug of Object.keys(FIXTURES)) {
    const out = path.join(root, 'out', slug)
    const res = await runAsync('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', String(SETTLE_MS), '--out', out], root)
    results[slug] = { output: res.output, status: res.status, dir: out, report: JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8')) }
  }
})

afterAll(() => removeDir(tmp))

describe('INT-002: screenshot helper', () => {
  it('writes one predictable screenshot per step and exits zero despite warnings', () => {
    for (const [slug, r] of Object.entries(results)) {
      expect(r.status, `${slug}: ${r.output}`).toBe(0)
      expect(fs.readdirSync(r.dir).filter((f) => f.endsWith('.png')).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
      for (const s of r.report.steps) {
        const stat = fs.statSync(path.join(root, s.file))
        expect(stat.size).toBeGreaterThan(1000)
      }
    }
  })

  it('captures only after the settle interval', () => {
    for (const r of Object.values(results)) {
      for (const s of r.report.steps) expect(s.capturedAfterMs).toBeGreaterThanOrEqual(SETTLE_MS)
    }
  })

  it('writes to the default project-local directory at a standard desktop viewport', () => {
    const res = run('node', ['scripts/inspect-presentation.mjs', 'fx-clean', '--no-build', '--settle', '1300'], root)
    expect(res.status, res.output).toBe(0)
    expect(fs.existsSync(path.join(root, '.inspection', 'fx-clean', '1280x720', 'step-03.png'))).toBe(true)
  })

  it('reports an unmarked text collision with the step and both elements', () => {
    const w = results['fx-collision'].report.warnings.filter((x) => x.text.startsWith('overlap'))
    expect(w.length).toBeGreaterThan(0)
    expect(w.every((x) => x.step >= 2)).toBe(true)
    expect(w.some((x) => x.step === 2 && x.text.includes('alpha text') && x.text.includes('beta text'))).toBe(true)
    expect(results['fx-collision'].output).toMatch(/WARN step 2: overlap between .*alpha text.*beta text/)
  })

  it('reports text colliding with a control\'s padding, outside its own text', () => {
    const w = results['fx-chrome'].report.warnings.filter((x) => x.text.startsWith('overlap'))
    expect(w.some((x) => x.text.includes('data-presentation-mode-toggle') && x.text.includes('"x"'))).toBe(true)
  })

  it('does not report overlap inside an allow-overlap subtree', () => {
    expect(results['fx-allowed'].report.warnings.filter((x) => x.text.startsWith('overlap'))).toEqual([])
  })

  it('reports indistinct active chrome and unpolished attribution', () => {
    const texts = results['fx-plain'].report.warnings.map((w) => w.text).join('\n')
    expect(texts).toMatch(/active progress indicator is visually indistinct/)
    expect(texts).toMatch(/active table of contents is visually indistinct/)
    expect(texts).toMatch(/attribution link uses the browser-default link colour/)
    expect(texts).toMatch(/data-presentation-attribution/)
  })

  it('reports nothing for a polished, collision-free presentation', () => {
    expect(results['fx-clean'].report.warnings).toEqual([])
    expect(results['fx-allowed'].report.warnings).toEqual([])
  })
})
