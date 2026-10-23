import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTempDirs, REPO, run, sourceState, throwawayCopy, type Result } from './support'
import { previewUrl, startPreview } from '../../scripts/lib/preview.mjs'

const BASE_CSS = `
.fx button { font-family: monospace; }
.fx [data-presentation-header], .fx [data-presentation-footer] { padding-inline: 16px; }
`
const ACTIVE_CSS = `
.fx [data-presentation-progress] { width: 12px; height: 12px; padding: 0; border: 1px solid #333; background: #fff; }
.fx [data-presentation-progress][data-presentation-active='true'] { background: #06c; width: 24px; }
.fx [data-presentation-toc-entry] { border: 0; background: transparent; }
.fx [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; background: #def; }
`
const ATTR_OK = `.fx [data-presentation-attribution] { font-size: 14px; color: #333; text-decoration: none; }`
const ATTR_SMALL = `.fx [data-presentation-attribution] { font-size: 9px; color: #333; text-decoration: none; }`

const CLEAN_BODY = `<Box entity="a" at={{ x: 50, y: 50, w: 260, h: 40 }}><span>clean text {payload.n}</span></Box>`
const PAIR = (a: string, b: string, y: number) =>
  `<Box entity="${a}" at={{ x: 400, y: ${y}, w: 200, h: 40 }}><span>${a}</span></Box><Box entity="${b}" at={{ x: 420, y: ${y + 5}, w: 200, h: 40 }}><span>${b}</span></Box>`

interface Fixture {
  slug: string
  css: string
  body?: string
  attribution?: 'default' | 'none'
  extra?: string
}

const FIXTURES: Fixture[] = [
  { slug: 'clean', css: ACTIVE_CSS + ATTR_OK },
  { slug: 'collision', css: ACTIVE_CSS + ATTR_OK, body: PAIR('alpha', 'beta', 100) },
  { slug: 'allowed', css: ACTIVE_CSS + ATTR_OK, body: `<div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>${PAIR('alpha', 'beta', 100)}</div>` },
  { slug: 'mixed', css: ACTIVE_CSS + ATTR_OK, body: `<div data-presentation-allow-overlap="" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>${PAIR('alpha', 'beta', 100)}</div>${PAIR('gamma', 'delta', 200)}` },
  { slug: 'indistinct', css: ATTR_OK },
  { slug: 'attr-small', css: ACTIVE_CSS + ATTR_SMALL },
  { slug: 'attr-default', css: ACTIVE_CSS },
  { slug: 'attr-missing', css: ACTIVE_CSS, attribution: 'none' },
  {
    slug: 'delayed',
    css: ACTIVE_CSS + ATTR_OK,
    extra: `function Paint({ n }: { n: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    setOn(false)
    const t = setTimeout(() => setOn(true), 600)
    return () => clearTimeout(t)
  }, [n])
  return <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: on ? '#000' : '#fff' }} />
}`,
    body: '<Paint n={payload.n} />',
  },
]

const talk = (f: Fixture) => `${f.extra ? "import { useEffect, useState } from 'react'\n" : ''}import { ${(f.body ?? CLEAN_BODY).includes('<Box') ? 'Box, ' : ''}Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './${f.slug}.css'
${f.extra ?? ''}
function Scene({ payload }: SceneProps<{ n: number }>) {
  return <SceneLayer data-n={payload.n}>${f.body ?? CLEAN_BODY}</SceneLayer>
}
const steps: Step<{ n: number }>[] = [1, 2, 3].map((n) => ({ id: 's' + n, era: n < 3 ? 'eraA' : 'eraB', title: 'Step ' + n, caption: 'Caption ' + n, groupKey: 'g', Scene, payload: { n } }))
export default function Talk() {
  return <Presentation steps={steps} title="${f.slug}" className="fx"${f.attribution === 'none' ? ' attribution={false}' : ''} />
}
`

const CROSS = `import { Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
const make = (w: number) => ({ payload }: SceneProps<{ n: number }>) => (
  <SceneLayer><Box entity="shared" at={{ x: 20, y: 20, w, h: 40 }}><span>{payload.n}</span></Box></SceneLayer>
)
const A = make(100)
const B = make(300)
const steps: Step<{ n: number }>[] = [
  { id: 'a', era: 'e', title: 'A', caption: 'a', groupKey: 'one', Scene: A, payload: { n: 1 } },
  { id: 'b', era: 'e', title: 'B', caption: 'b', groupKey: 'two', Scene: B, payload: { n: 2 } },
]
export default function Talk() {
  return <Presentation steps={steps} title="cross" />
}
`

const png = (file: string) => readFileSync(file)
const dims = (file: string) => [png(file).readUInt32BE(16), png(file).readUInt32BE(20)]
const isPng = (file: string) => png(file).subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
const warnings = (r: Result) => r.output.split('\n').filter((l) => l.startsWith('WARN'))

// INT-002: the project-local screenshot helper against controlled fixtures in a disposable copy.
describe('INT-002: screenshot helper', () => {
  let dir: string
  let before: string
  let browser: Browser
  const runs = new Map<string, Result>()
  const inspect = async (slug: string, ...flags: string[]) => {
    const r = await run(process.execPath, ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', '300', ...flags], dir)
    runs.set(slug + flags.join(''), r)
    return r
  }
  const shots = (slug: string, sub = slug) => path.join(dir, 'inspection', sub)

  beforeAll(async () => {
    before = sourceState()
    dir = throwawayCopy('int2')
    mkdirSync(path.join(dir, 'src/presentations'), { recursive: true })
    const entries = [...FIXTURES.map((f) => f.slug), 'crossgroup']
    for (const f of FIXTURES) {
      mkdirSync(path.join(dir, 'src/presentations', f.slug))
      writeFileSync(path.join(dir, 'src/presentations', f.slug, 'Talk.tsx'), talk(f))
      writeFileSync(path.join(dir, 'src/presentations', f.slug, `${f.slug}.css`), BASE_CSS + f.css)
    }
    mkdirSync(path.join(dir, 'src/presentations/crossgroup'))
    writeFileSync(path.join(dir, 'src/presentations/crossgroup/Talk.tsx'), CROSS)
    writeFileSync(
      path.join(dir, 'src/presentations/index.ts'),
      `import type { PresentationEntry } from './types'\nexport const presentations: PresentationEntry[] = [\n${entries.map((s) => `  { slug: '${s}', title: '${s}', load: () => import('./${s}/Talk') },`).join('\n')}\n]\n`,
    )
    const build = await run('npm', ['run', 'build'], dir)
    expect(build.code, build.output).toBe(0)
    browser = await chromium.launch()
  })
  afterAll(async () => {
    await browser?.close()
    cleanupTempDirs()
  })

  it('writes one valid desktop screenshot per step under inspection/<slug>, with distinct content (L-59, I-31)', async () => {
    const r = await inspect('clean')
    expect(r.code, r.output).toBe(0)
    const files = [1, 2, 3].map((n) => path.join(shots('clean'), `step-0${n}.png`))
    for (const f of files) {
      expect(existsSync(f)).toBe(true)
      expect(isPng(f)).toBe(true)
      expect(dims(f)).toEqual([1440, 900])
      expect(png(f).length).toBeGreaterThan(2000)
    }
    expect(new Set(files.map((f) => createHash('sha1').update(png(f)).digest('hex'))).size).toBe(3)
    expect(readFileSync(path.join(REPO, '.gitignore'), 'utf8')).toMatch(/^inspection$/m)
    expect(r.output).toMatch(/INSPECT: 3 screenshots in inspection\/clean, 0 advisory/)
    expect(warnings(r)).toEqual([])
  })

  it('writes narrow captures to a separate directory at the narrow viewport', async () => {
    const r = await inspect('clean', '--narrow')
    expect(r.code, r.output).toBe(0)
    expect(dims(path.join(shots('clean', 'clean-narrow'), 'step-02.png'))).toEqual([390, 844])
  })

  it('reports an unmarked text collision with the step and both elements, exiting 0 (L-61, L-65, I-33)', async () => {
    const r = await inspect('collision')
    expect(r.code, r.output).toBe(0)
    const w = warnings(r).filter((l) => /overlap/.test(l))
    expect(w).toHaveLength(3)
    for (const [i, line] of w.entries()) expect(line).toMatch(new RegExp(`step ${i + 1}: overlap between .*"alpha".*"beta"|step ${i + 1}: overlap between .*"beta".*"alpha"`))
    expect([1, 2, 3].every((n) => existsSync(path.join(shots('collision'), `step-0${n}.png`)))).toBe(true)
  })

  it('does not warn inside an allow-overlap subtree, but still warns about a simultaneous unmarked collision (L-62)', async () => {
    const allowed = await inspect('allowed')
    expect(allowed.code, allowed.output).toBe(0)
    expect(warnings(allowed)).toEqual([])
    const mixed = await inspect('mixed')
    const w = warnings(mixed)
    expect(w).toHaveLength(3)
    for (const line of w) {
      expect(line).toMatch(/gamma/)
      expect(line).toMatch(/delta/)
      expect(line).not.toMatch(/alpha|beta/)
    }
  })

  it('reports indistinct active progress and ToC chrome, but not styled chrome (L-63, I-34)', async () => {
    const bad = await inspect('indistinct')
    expect(bad.code, bad.output).toBe(0)
    const w = warnings(bad)
    for (const n of [1, 2, 3]) expect(w.some((l) => l.includes(`step ${n}:`) && l.includes('data-presentation-progress'))).toBe(true)
    expect(w.some((l) => l.includes('data-presentation-toc-entry'))).toBe(true)
    expect(w.every((l) => /indistinct/.test(l))).toBe(true)
    expect(warnings(runs.get('clean')!)).toEqual([])
  })

  it.each([
    ['attr-small', /font size 9px is below 11px/],
    ['attr-default', /browser-default link style/],
    ['attr-missing', /attribution link is missing/],
  ] as const)('reports %s attribution and points to its hook (L-64, C-1)', async (slug, re) => {
    const r = await inspect(slug)
    expect(r.code, r.output).toBe(0)
    const w = warnings(r)
    expect(w).toHaveLength(3)
    for (const [i, line] of w.entries()) {
      expect(line).toMatch(new RegExp(`step ${i + 1}: `))
      expect(line).toMatch(re)
      expect(line).toMatch(/data-presentation-attribution/)
    }
    expect([1, 2, 3].every((n) => existsSync(path.join(shots(slug), `step-0${n}.png`)))).toBe(true)
  })

  it('captures only after the transition settles (L-60)', async () => {
    const pixel = async (file: string) => {
      const page = await browser.newPage()
      const rgb = await page.evaluate(async (b64) => {
        const img = new Image()
        img.src = 'data:image/png;base64,' + b64
        await img.decode()
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        return [...ctx.getImageData(800, 400, 1, 1).data.slice(0, 3)]
      }, png(file).toString('base64'))
      await page.close()
      return rgb
    }
    const settled = await run(process.execPath, ['scripts/inspect-presentation.mjs', 'delayed', '--no-build', '--settle', '1200', '--out', 'inspection-settled'], dir)
    expect(settled.code, settled.output).toBe(0)
    const early = await run(process.execPath, ['scripts/inspect-presentation.mjs', 'delayed', '--no-build', '--settle', '50', '--out', 'inspection-early'], dir)
    expect(early.code, early.output).toBe(0)
    for (const n of [1, 2, 3]) {
      expect(await pixel(path.join(dir, `inspection-settled/delayed/step-0${n}.png`))).toEqual([0, 0, 0])
      expect(await pixel(path.join(dir, `inspection-early/delayed/step-0${n}.png`))).toEqual([255, 255, 255])
    }
    const log = JSON.parse(readFileSync(path.join(dir, 'inspection-settled/delayed/capture-log.json'), 'utf8'))
    expect(log.settleMs).toBe(1200)
    for (const e of log.log) expect(e.capturedAt - e.navigatedAt).toBeGreaterThanOrEqual(1200)
  })

  it('removes the exiting scene host after a cross-group transition with shared entity ids', async () => {
    const preview = await startPreview(dir)
    try {
      const page = await browser.newPage()
      await page.goto(previewUrl(preview.port, '/crossgroup'))
      await page.waitForSelector('[data-step-count]')
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(() => document.querySelectorAll('[data-presentation-scene-host]').length === 1, undefined, { timeout: 5000 })
      expect(await page.locator('[data-presentation-entity="shared"]').count()).toBe(1)
      await page.close()
    } finally {
      await preview.stop()
    }
  })

  it('leaves the source checkout unchanged (C-4)', () => {
    expect(sourceState()).toBe(before)
  })
})
