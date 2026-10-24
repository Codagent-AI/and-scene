import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, edit, exec } from './helpers.ts'

let dir: string
const SETTLE = 1500

const GOOD_CSS = (c: string, { toc = true, attrSize = 13 } = {}) => `
.${c} [data-presentation-dot] { width: 10px; height: 10px; border: 1px solid #555; border-radius: 50%; background: transparent; }
.${c} [data-presentation-dot][data-presentation-active='true'] { width: 24px; background: #123456; border-color: #123456; }
${toc ? `.${c} [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; background: #def; }` : ''}
.${c} [data-presentation-attribution] { font-size: ${attrSize}px; color: #444; text-decoration: none; }
.${c} [data-presentation-dots] { margin: 0; padding: 0; list-style: none; }
`

interface Fixture {
  slug: string
  css: string
  /** JSX rendered by the scene on step 2 only. */
  extra: string
  /** Era label for steps 2 and 3; defaults to a short one. */
  era?: string
}

const FIXTURES: Fixture[] = [
  { slug: 'fx-clean', css: GOOD_CSS('fx-clean'), extra: '' },
  {
    slug: 'fx-collide',
    css: GOOD_CSS('fx-collide'),
    extra: `<Label id="coll-a" at={{ x: 300, y: 150, w: 140, h: 30 }}>Alpha words</Label>
            <Label id="coll-b" at={{ x: 310, y: 154, w: 140, h: 30 }}>Beta words</Label>`,
  },
  {
    slug: 'fx-allowed',
    css: GOOD_CSS('fx-allowed'),
    extra: `<div data-presentation-allow-overlap="">
              <Label id="ok-a" at={{ x: 300, y: 150, w: 140, h: 30 }}>Alpha words</Label>
              <Label id="ok-b" at={{ x: 310, y: 154, w: 140, h: 30 }}>Beta words</Label>
            </div>`,
  },
  {
    // The era label wraps at a narrow viewport; its line boxes are clear of the step number.
    slug: 'fx-wrap',
    css: GOOD_CSS('fx-wrap'),
    extra: '',
    era: 'an exceptionally long era label that has to wrap onto several lines',
  },
  { slug: 'fx-chrome', css: '', extra: '' },
  { slug: 'fx-toc', css: GOOD_CSS('fx-toc', { toc: false }), extra: '' },
  { slug: 'fx-small', css: GOOD_CSS('fx-small', { attrSize: 9 }), extra: '' },
  {
    // The label slides from on top of another label to a clear spot; only settled captures are clean.
    slug: 'fx-settle',
    css: `${GOOD_CSS('fx-settle')}
.fx-settle [data-presentation-id='slide'] { animation: slide 900ms ease forwards; }
@keyframes slide { from { left: 300px; top: 150px; } to { left: 600px; top: 250px; } }`,
    extra: `<Label id="slide" at={{ x: 600, y: 250, w: 140, h: 30 }}>Slider text</Label>
            <Label id="fixed" at={{ x: 300, y: 150, w: 140, h: 30 }}>Fixed text</Label>`,
  },
]

function writeFixture(root: string, f: Fixture) {
  const base = path.join(root, 'src/presentations', f.slug)
  mkdirSync(base, { recursive: true })
  writeFileSync(path.join(base, 'style.css'), f.css)
  const steps = [1, 2, 3].map((n) => `  { id: 's${n}', era: '${n > 1 ? (f.era ?? 'e2') : 'e1'}', title: 'Step ${n}', caption: 'Caption ${n}' }`)
  writeFileSync(
    path.join(base, 'Talk.tsx'),
    `import { Box, Label, Presentation, SceneLayer } from '../../presentation-kit/index.ts'
import type { SceneProps, Step } from '../../presentation-kit/index.ts'
import './style.css'

function Scene({ index }: SceneProps) {
  return (
    <SceneLayer>
      <Box id="main" at={{ x: 40, y: 40, w: 160, h: 60 }}><Label id="main-label">Main</Label></Box>
      {index === 1 && (
        <>
          ${f.extra}
        </>
      )}
    </SceneLayer>
  )
}

const META = [
${steps.join(',\n')},
]
// Ungrouped steps: every step mounts its own scene, so entrance animations restart.
const STEPS: Step[] = META.map((m) => ({ ...m, payload: undefined, Scene }))

export default function Talk() {
  return <Presentation className="${f.slug}" steps={STEPS} title="${f.slug}" />
}
`,
  )
}

async function inspect(slug: string, extra: string[] = []) {
  const result = await exec('node', ['scripts/inspect-presentation.mjs', slug, '--settle', String(SETTLE), ...extra], dir)
  const out = extra.includes('--out') ? extra[extra.indexOf('--out') + 1] : path.join('inspection', slug)
  const manifestFile = path.join(dir, out, 'manifest.json')
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : null
  const warnings = result.output.split('\n').filter((l) => l.startsWith('WARN'))
  return { ...result, manifest, warnings }
}

beforeAll(async () => {
  dir = copyRepo()
  const index = path.join(dir, 'src/presentations/index.ts')
  for (const f of FIXTURES) {
    writeFixture(dir, f)
    edit(index, /\n\]\n?$/, `\n  { slug: '${f.slug}', title: '${f.slug}', load: () => import('./${f.slug}/Talk.tsx') },\n]\n`)
  }
  const build = await exec('npm', ['run', 'build'], dir)
  expect(build.code, build.output).toBe(0)
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('inspect-presentation helper', () => {
  it('writes one predictable screenshot per step plus a manifest, with no warnings for a clean presentation', async () => {
    const r = await inspect('fx-clean')
    expect(r.code, r.output).toBe(0)
    for (const n of ['01', '02', '03']) {
      expect(existsSync(path.join(dir, 'inspection/fx-clean', `step-${n}.png`))).toBe(true)
    }
    expect(r.manifest.steps).toHaveLength(3)
    expect(r.manifest.viewport).toEqual({ width: 1440, height: 900 })
    expect(r.warnings).toEqual([])
  })

  it('captures only after the configured settle interval', async () => {
    const r = await inspect('fx-clean', ['--out', 'inspection/custom'])
    expect(existsSync(path.join(dir, 'inspection/custom/step-03.png'))).toBe(true)
    for (const s of r.manifest.steps) expect(s.capturedAt - s.navigatedAt).toBeGreaterThanOrEqual(SETTLE)
  })

  it('does not report motion that is still in flight, only the settled layout', async () => {
    const r = await inspect('fx-settle')
    expect(r.code, r.output).toBe(0)
    expect(r.warnings).toEqual([])
  })

  it('reports an unmarked text collision with the step and both elements', async () => {
    const r = await inspect('fx-collide')
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0]).toMatch(/^WARN step 2: overlap: .*#coll-a.*#coll-b/)
    expect(r.manifest.steps.map((s: { warnings: string[] }) => s.warnings.length)).toEqual([0, 1, 0])
  })

  it('does not report a wrapped marker label as overlapping the step number at a narrow viewport', async () => {
    const r = await inspect('fx-wrap', ['--viewport', '390x844'])
    expect(r.code, r.output).toBe(0)
    expect(r.warnings.filter((w) => w.includes('overlap'))).toEqual([])
  })

  it('does not report overlap inside an explicit allow-overlap subtree', async () => {
    const r = await inspect('fx-allowed')
    expect(r.code, r.output).toBe(0)
    expect(r.warnings).toEqual([])
  })

  it('reports indistinct active chrome and unpolished attribution on every step', async () => {
    const r = await inspect('fx-chrome')
    expect(r.code, r.output).toBe(0)
    for (const step of [1, 2, 3]) {
      const mine = r.warnings.filter((w) => w.startsWith(`WARN step ${step}:`))
      expect(mine.some((w) => w.includes('indistinct-active') && w.includes('dot')), r.output).toBe(true)
      expect(mine.some((w) => w.includes('attribution') && w.includes('data-presentation-attribution'))).toBe(true)
    }
  })

  it('reports an indistinct active table-of-contents entry separately from the progress dots', async () => {
    const r = await inspect('fx-toc')
    expect(r.code, r.output).toBe(0)
    expect(r.warnings.length).toBe(3)
    for (const step of [1, 2, 3]) {
      const mine = r.warnings.filter((w) => w.startsWith(`WARN step ${step}:`))
      expect(mine).toHaveLength(1)
      expect(mine[0]).toMatch(/indistinct-active: the active toc-entry/)
    }
  })

  it('reports an undersized attribution link with the font size', async () => {
    const r = await inspect('fx-small')
    expect(r.warnings).toHaveLength(3)
    expect(r.warnings[0]).toMatch(/^WARN step 1: attribution: font size 9px is too small/)
    expect(r.warnings.some((w) => /indistinct|overlap/.test(w))).toBe(false)
  })

  it('fails (not just warns) for an unregistered presentation', async () => {
    const r = await inspect('does-not-exist')
    expect(r.code).not.toBe(0)
  })
})
