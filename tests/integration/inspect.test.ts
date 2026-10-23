import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { copyRepo, sh } from '../helpers/repo-copy'
import { launchBrowser, startPreview } from '../../scripts/lib/runtime.mjs'

const copy = copyRepo('inspect-int-')
afterAll(() => copy.remove())

const SCENE = (extra: string, eras = ['first', 'first', 'second']) => `import { Box, Label, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import './fixture.css'

function FixtureScene({ payload }: SceneProps<{ step: number }>) {
  return (
    <SceneLayer>
      <Label key="a" layoutId="a" at={{ x: 100, y: 100, w: 200, h: 30 }}>Collision A</Label>
      ${extra}
    </SceneLayer>
  )
}

const eras = ${JSON.stringify(eras)}
const steps = [0, 1, 2].map((step) => ({
  id: 's' + step, era: eras[step], title: 'Fixture ' + step, caption: 'Caption ' + step,
  Scene: FixtureScene, groupKey: 'fixture', payload: { step },
}))

export default function Talk() {
  return <Presentation steps={steps} title="Fixture" />
}
`

const DEFECT_EXTRA = `{payload.step === 1 && (
        <Label key="b" layoutId="b" at={{ x: 110, y: 104, w: 200, h: 30 }}>Collision B</Label>
      )}
      {payload.step === 2 && (
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 400, top: 100, width: 300, height: 40 }}>
          <Label key="c" layoutId="c" at={{ x: 0, y: 0, w: 200, h: 30 }}>Stacked one</Label>
          <Label key="d" layoutId="d" at={{ x: 10, y: 4, w: 200, h: 30 }}>Stacked two</Label>
        </div>
      )}
      <Box key="slow" layoutId="slow" at={{ x: 100, y: 250, w: 80, h: 40 }}
        animate={{ x: payload.step * 200 }} transition={{ duration: 1.2 }}>slow</Box>`

const POLISHED_CSS = `
[data-presentation-dot] { width: 10px; height: 10px; border-radius: 50%; border: 1px solid #888; background: transparent; }
[data-presentation-dot][data-presentation-active] { width: 24px; background: #c2410c; border-color: #c2410c; }
[data-presentation-toc-item] { border: 0; background: transparent; color: #555; }
[data-presentation-toc-item][data-presentation-active] { color: #000; font-weight: 700; background: #fde7d8; }
[data-presentation-attribution] { font-size: 12px; color: #444; text-decoration: none; }
`

// Dots are styled; ToC entries are not (labels of different length); prev/next boxes overlap
// while their text does not; the attribution is non-default in color but only 8px.
const CHROME_CSS = `
[data-presentation-dot] { width: 10px; height: 10px; border-radius: 50%; border: 1px solid #888; background: transparent; }
[data-presentation-dot][data-presentation-active] { width: 24px; background: #c2410c; border-color: #c2410c; }
[data-presentation-toc-item] { border: 0; background: transparent; color: #555; font-weight: 400; }
[data-presentation-attribution] { font-size: 8px; color: #444; text-decoration: none; }
[data-presentation-prev] { padding: 0 100px; }
[data-presentation-next] { margin-left: -90px; padding: 0 0 0 120px; }
`

// Persisting entity "m" moves; "gone" only exists in step 0; "fresh" only in step 1.
const MOTION_TALK = `import { Box, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'

function MotionScene({ payload }: SceneProps<{ step: number }>) {
  return (
    <SceneLayer>
      <Box key="m" layoutId="m" at={{ x: payload.step === 0 ? 100 : 560, y: 150, w: 80, h: 40 }}>m</Box>
      {payload.step === 0 && <Box key="gone" layoutId="gone" at={{ x: 100, y: 260, w: 80, h: 40 }}>gone</Box>}
      {payload.step === 1 && <Box key="fresh" layoutId="fresh" at={{ x: 300, y: 260, w: 80, h: 40 }} appear>fresh</Box>}
    </SceneLayer>
  )
}

const steps = [0, 1].map((step) => ({
  id: 's' + step, era: 'e', title: 'Motion ' + step, caption: 'c',
  Scene: MotionScene, groupKey: 'motion', payload: { step },
}))
export default function Talk() {
  return <Presentation steps={steps} title="Motion" />
}
`

// Two different scene components: the second scene replaces the first one.
const SWAP_TALK = `import { Box, Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'

const One = (_: SceneProps) => (
  <SceneLayer><Box key="p" layoutId="p" at={{ x: 100, y: 150, w: 80, h: 40 }} appear>p</Box></SceneLayer>
)
const Two = (_: SceneProps) => (
  <SceneLayer><Box key="q" layoutId="q" at={{ x: 300, y: 150, w: 80, h: 40 }} appear>q</Box></SceneLayer>
)
const steps = [
  { id: 'a', era: 'e', title: 'A', caption: 'c', Scene: One, payload: undefined },
  { id: 'b', era: 'e', title: 'B', caption: 'c', Scene: Two, payload: undefined },
]
export default function Talk() {
  return <Presentation steps={steps} title="Swap" />
}
`

type Report = { steps: { step: number; file: string; settled: boolean; animationsRunning: number; warnings: { kind: string; message: string }[] }[] }
const inspect = (slug: string, settle = 1600) => {
  const r = sh('node', ['scripts/inspect-presentation.mjs', slug, '--skip-build', '--settle', String(settle)], copy.dir)
  const dir = path.join(copy.dir, '.presentation-inspect', slug)
  const report: Report = JSON.parse(readFileSync(path.join(dir, 'report.json'), 'utf8'))
  return { ...r, dir, report }
}
const messages = (report: Report, kind: string) =>
  report.steps.flatMap((s) => s.warnings.filter((w) => w.kind === kind).map((w) => w.message))

beforeAll(() => {
  const fixtures: [string, string, string][] = [
    ['fixture-defects', SCENE(DEFECT_EXTRA), '/* nothing: browser defaults */'],
    ['fixture-polished', SCENE(DEFECT_EXTRA.replace('{payload.step === 1 && (', '{false && (')), POLISHED_CSS],
    ['fixture-chrome', SCENE('{payload.step < 0 && <Box key="unused" layoutId="unused" at={{ x: 0, y: 0 }}>-</Box>}'), CHROME_CSS],
    ['fixture-motion', MOTION_TALK, ''],
    ['fixture-swap', SWAP_TALK, ''],
  ]
  for (const [slug, talk, css] of fixtures) {
    const dir = path.join(copy.dir, 'src/presentations', slug)
    mkdirSync(dir, { recursive: true })
    copy.write(`src/presentations/${slug}/Talk.tsx`, talk)
    if (talk.includes('./fixture.css')) copy.write(`src/presentations/${slug}/fixture.css`, css)
    copy.edit('src/presentations/index.ts', /\]\s*$/, `  { slug: '${slug}', title: '${slug}', load: () => import('./${slug}/Talk') },\n]\n`)
  }
  const build = sh('npm', ['run', 'build'], copy.dir)
  expect(build.status, build.out).toBe(0)
})

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  it('writes one predictable screenshot per step', () => {
    const { dir, report, status } = inspect('fixture-defects')
    expect(status).toBe(0)
    expect(readdirSync(dir).filter((f) => f.endsWith('.png')).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    expect(report.steps.map((s) => s.file)).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    for (const s of report.steps) expect(existsSync(path.join(dir, s.file))).toBe(true)
  })

  it('captures only after transitions settle', () => {
    const { report } = inspect('fixture-defects')
    for (const s of report.steps) {
      expect(s.settled, `step ${s.step}`).toBe(true)
      expect(s.animationsRunning).toBe(0)
    }
    const early = inspect('fixture-defects', 0)
    expect(early.report.steps.some((s) => !s.settled), 'a too-short settle interval is detected').toBe(true)
  })

  it('warns on the unmarked collision for the right step only, and not on the allowed overlap', () => {
    const { report, out } = inspect('fixture-defects')
    const overlaps = (n: number) => report.steps[n - 1].warnings.filter((w) => w.kind === 'overlap')
    expect(overlaps(1)).toEqual([])
    expect(overlaps(2).map((w) => w.message).join('\n')).toMatch(/Collision A.*Collision B|Collision B.*Collision A/)
    expect(overlaps(3)).toEqual([])
    expect(out).toMatch(/WARN step 2 \[overlap\]/)
    expect(out).not.toMatch(/Stacked/)
  })

  it('warns about indistinct active chrome and unpolished attribution', () => {
    const { report, out } = inspect('fixture-defects')
    for (const s of report.steps) {
      const kinds = s.warnings.map((w) => w.kind)
      expect(kinds, `step ${s.step}`).toContain('active-chrome')
      expect(kinds, `step ${s.step}`).toContain('attribution')
    }
    expect(out).toContain('[data-presentation-attribution]')
    expect(out).toContain('[data-presentation-active]')
  })

  it('stays quiet for a polished presentation with an explicitly allowed overlap', () => {
    const { report, out, status } = inspect('fixture-polished')
    expect(status).toBe(0)
    expect(report.steps.flatMap((s) => s.warnings)).toEqual([])
    expect(out).toContain('0 advisory warning(s)')
  })

  describe('chrome diagnostics on a presentation with styled dots only', () => {
    it('reports chrome controls whose boxes overlap even when their text does not', () => {
      const { report } = inspect('fixture-chrome')
      const overlaps = messages(report, 'overlap')
      expect(overlaps.length).toBeGreaterThan(0)
      for (const m of overlaps) expect(m, 'only the box-based chrome check fires').toMatch(/^chrome /)
      expect(overlaps.join('\n')).toMatch(/data-presentation-prev[\s\S]*overlaps chrome[\s\S]*data-presentation-next/)
    })

    it('reports the unstyled table-of-contents entry but not the styled progress dots', () => {
      const { report } = inspect('fixture-chrome')
      const active = messages(report, 'active-chrome')
      expect(active.length).toBe(3)
      for (const m of active) {
        expect(m).toContain('table-of-contents entry')
        expect(m).not.toContain('progress indicator')
      }
    })

    it('reports undersized attribution even when its color is not the browser default', () => {
      const { report } = inspect('fixture-chrome')
      const attribution = messages(report, 'attribution')
      expect(attribution.length).toBe(3)
      for (const m of attribution) {
        expect(m).toContain('8px')
        expect(m).toContain('[data-presentation-attribution]')
        expect(m).not.toContain('browser-default')
      }
    })
  })
})

type Sample = { t: number; m: number | null; gone: number | null; fresh: number | null; q: number | null; p: number | null }

/** Presses Right, then samples the entities' x position and own opacity every frame. */
async function recordTransition(slug: string): Promise<Sample[]> {
  const preview = await startPreview(copy.dir)
  const browser = await launchBrowser(copy.dir)
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${preview.origin}/${slug}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-presentation-root]')
    await page.waitForTimeout(1800) // let the first scene's newcomers finish entering
    return await page.evaluate(
      () =>
        new Promise<Sample[]>((resolve) => {
          const read = (id: string) => {
            const el = document.querySelector(`[data-presentation-id="${id}"]`)
            return el ? { x: el.getBoundingClientRect().x, o: Number(getComputedStyle(el).opacity) } : null
          }
          const out: Sample[] = []
          const t0 = performance.now()
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
          const tick = () => {
            const t = performance.now() - t0
            out.push({
              t,
              m: read('m')?.x ?? null,
              gone: read('gone')?.o ?? null,
              fresh: read('fresh')?.o ?? null,
              q: read('q')?.o ?? null,
              p: read('p')?.o ?? null,
            })
            if (t < 2200) requestAnimationFrame(tick)
            else resolve(out)
          }
          requestAnimationFrame(tick)
        }),
    )
  } finally {
    await browser.close()
    await preview.stop()
  }
}

describe('continuity in a real browser (production preview)', () => {
  it('persisting entity morphs through intermediate positions; departing exits; newcomer waits (I-4, I-5, I-6)', async () => {
    const samples = await recordTransition('fixture-motion')
    const xs = samples.map((s) => s.m).filter((x): x is number => x !== null)
    const start = xs[0]
    const end = xs[xs.length - 1]
    expect(end - start, 'entity ends up at its new position').toBeGreaterThan(300)
    const mid = samples.filter((s) => s.m !== null && s.m > start + 30 && s.m < end - 30)
    expect(mid.length, 'sampled in-flight positions between old and new').toBeGreaterThan(3)
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1] - 0.5)

    // Departing entity: still mounted and fading, then gone.
    expect(samples[0].gone).not.toBeNull()
    expect(samples.some((s) => s.gone !== null && s.gone > 0.05 && s.gone < 0.95), 'fades out').toBe(true)
    expect(samples[samples.length - 1].gone).toBeNull()

    // Newcomer: invisible while the persisting entity is still moving, visible after.
    for (const s of mid) expect(s.fresh === null || s.fresh < 0.01, `fresh hidden at ${s.t.toFixed(0)}ms`).toBe(true)
    expect(samples[samples.length - 1].fresh).toBe(1)
  })

  it('newcomers of a replaced scene enter after the scene change begins; the old scene exits (I-5, I-6)', async () => {
    const samples = await recordTransition('fixture-swap')
    const early = samples.filter((s) => s.t < 150 && s.q !== null)
    expect(early.length).toBeGreaterThan(0)
    for (const s of early) expect(s.q, 'newcomer hidden at the start').toBeLessThan(0.01)
    expect(samples[samples.length - 1].q).toBe(1)
    expect(samples[0].p).not.toBeNull()
    expect(samples[samples.length - 1].p).toBeNull()
  })
})
