import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { PNG } from 'pngjs'
import { beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, mutate, portIsClosed, previewPort, run } from './helpers'

const STYLED_CSS = `
.fx [data-presentation-active] { font-weight: 700; background: #ffcc00; color: #000; }
.fx [data-presentation-attribution] { font-size: 13px; color: #003366; text-decoration: none; }
`
// Pulls the step marker (chrome) on top of the title text.
const COLLIDE_CSS = `${STYLED_CSS}.fx [data-presentation-marker] { position: fixed; left: 0; top: 725px; }`
const TINY_CSS = STYLED_CSS.replace('font-size: 13px', 'font-size: 8px')

interface Fixture {
  slug: string
  css: string | null
  scene: string // JSX inside the scene layer; `stage` is 0 or 1
  props?: string
  imports?: string
}

const LABELS = `<Label id="fx-a" at={{ x: 10, y: 10, w: 200, h: 30 }}>First text</Label>`
const OVERLAPPING = `<Label id="fx-b" at={{ x: 10, y: 10, w: 200, h: 30 }}>Second text</Label>`

const FIXTURES: Fixture[] = [
  { slug: 'fx-plain', css: null, scene: LABELS },
  { slug: 'fx-styled', css: STYLED_CSS, scene: LABELS },
  { slug: 'fx-collision', css: COLLIDE_CSS, scene: `${LABELS}${OVERLAPPING}` },
  { slug: 'fx-allowed', css: STYLED_CSS, scene: `<div data-presentation-allow-overlap>${LABELS}${OVERLAPPING}</div>` },
  { slug: 'fx-mixed', css: COLLIDE_CSS, scene: `<div data-presentation-allow-overlap>${LABELS}${OVERLAPPING}</div>` },
  { slug: 'fx-tiny', css: TINY_CSS, scene: LABELS },
  { slug: 'fx-noattr', css: STYLED_CSS, scene: LABELS, props: 'attribution={false}' },
  {
    slug: 'fx-settle',
    css: STYLED_CSS,
    imports: "import { motion } from 'motion/react'",
    scene: `<motion.div initial={false} animate={{ x: stage * 500 }} transition={{ duration: 1.2, ease: 'linear' }}
      style={{ position: 'absolute', top: 100, left: 0, width: 120, height: 120, background: '#ff0000' }} />`,
  },
]

function source(fx: Fixture) {
  return `${fx.imports ?? ''}
import { Label, Presentation } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
${fx.css ? "import './fx.css'" : ''}

function Scene({ payload }: SceneProps<{ stage: number }>) {
  const stage = payload.stage
  void Label
  return <>{stage >= 0 ? <>${fx.scene}</> : null}</>
}

const STEPS = [0, 1].map((stage) => ({
  id: 's' + stage, era: 'era ' + stage, title: 'Step ' + (stage + 1), caption: 'Caption ' + (stage + 1),
  groupKey: 'g', Scene, payload: { stage },
}))

export default function Talk() {
  return <Presentation steps={STEPS} title="Fixture" className="fx" ${fx.props ?? ''} />
}
`
}

const warnings = (output: string) => output.split('\n').filter((l) => l.startsWith('WARN '))
const png = async (file: string) => PNG.sync.read(await readFile(file))

function redCentroidX(image: { width: number; height: number; data: Buffer }) {
  let sum = 0
  let count = 0
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4
      if (image.data[i] === 255 && image.data[i + 1] === 0 && image.data[i + 2] === 0) {
        sum += x
        count++
      }
    }
  }
  return { count, x: count ? sum / count : -1 }
}

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  let dir: string
  let out: string
  const inspect = (slug: string, ...args: string[]) =>
    run(process.execPath, [path.join(dir, 'scripts/inspect-presentation.mjs'), slug, '--skip-build', '--settle', '1500', '--out', path.join(out, slug), ...args], os.tmpdir())

  beforeAll(async () => {
    dir = await copyRepo()
    out = path.join(dir, 'shots')
    let registry = ''
    for (const fx of FIXTURES) {
      const folder = path.join(dir, 'src/presentations', fx.slug)
      await mkdir(folder, { recursive: true })
      await writeFile(path.join(folder, 'Talk.tsx'), source(fx))
      if (fx.css) await writeFile(path.join(folder, 'fx.css'), fx.css)
      registry += `  { slug: '${fx.slug}', title: '${fx.slug}', load: () => import('./${fx.slug}/Talk') },\n`
    }
    const broken = path.join(dir, 'src/presentations/fx-broken')
    await mkdir(broken, { recursive: true })
    await writeFile(path.join(broken, 'Talk.tsx'), "export default function Talk(): never { throw new Error('boom') }\n")
    registry += "  { slug: 'fx-broken', title: 'fx-broken', load: () => import('./fx-broken/Talk') },\n"
    await mutate(dir, 'src/presentations/index.ts', '\n]', `\n${registry}]`)
    const build = await run('npm', ['run', 'build'], dir)
    if (build.code !== 0) throw new Error(build.output)
  })

  it('writes one predictable screenshot per step at the standard desktop viewport', async () => {
    const result = await inspect('fx-styled')
    expect(result.code, result.output).toBe(0)
    const folder = path.join(out, 'fx-styled')
    expect((await readdir(folder)).sort()).toEqual(['step-01.png', 'step-02.png'])
    const image = await png(path.join(folder, 'step-01.png'))
    expect([image.width, image.height]).toEqual([1440, 900])
    const narrow = await inspect('fx-styled', '--viewport', '480x800', '--out', path.join(out, 'narrow'))
    expect(narrow.code, narrow.output).toBe(0)
    const small = await png(path.join(out, 'narrow', 'step-02.png'))
    expect([small.width, small.height]).toEqual([480, 800])
    expect(result.output).toMatch(/captured 2 screenshots/)
  })

  it('writes distinct per-step content', async () => {
    const a = await readFile(path.join(out, 'fx-styled', 'step-01.png'))
    const b = await readFile(path.join(out, 'fx-styled', 'step-02.png'))
    expect(a.equals(b)).toBe(false)
  })

  it('stays silent for a styled, collision-free presentation', async () => {
    const result = await inspect('fx-styled')
    expect(warnings(result.output)).toEqual([])
  })

  it('reports unmarked text collisions with the step and both elements', async () => {
    const result = await inspect('fx-collision')
    expect(result.code, result.output).toBe(0) // advisory only
    const overlaps = warnings(result.output).filter((w) => w.includes('overlap'))
    for (const step of [1, 2]) {
      expect(overlaps.some((w) => w.includes(`step ${step}:`) && w.includes('"First text"') && w.includes('"Second text"'))).toBe(true)
      expect(overlaps.some((w) => w.includes(`step ${step}:`) && w.includes('data-presentation-step-number') && w.includes('data-presentation-title'))).toBe(true)
    }
  })

  it('does not report overlap inside an explicitly allowed subtree', async () => {
    const result = await inspect('fx-allowed')
    expect(result.code, result.output).toBe(0)
    expect(warnings(result.output)).toEqual([])
  })

  it('still reports a collision outside the allowed subtree', async () => {
    const result = await inspect('fx-mixed')
    const found = warnings(result.output)
    expect(found.length).toBeGreaterThanOrEqual(2) // at least one per step
    expect(new Set(found.map((w) => /step (\d+):/.exec(w)![1]))).toEqual(new Set(['1', '2']))
    for (const w of found) {
      expect(w).toMatch(/data-presentation-(step-number|era)/)
      expect(w).not.toContain('"Second text"')
      expect(w).not.toContain('"First text"')
    }
  })

  it('reports indistinct active chrome and a browser-default attribution when nothing is styled', async () => {
    const result = await inspect('fx-plain')
    expect(result.code, result.output).toBe(0)
    const found = warnings(result.output).join('\n')
    for (const step of [1, 2]) {
      expect(found).toContain(`step ${step}: active progress item looks identical`)
      expect(found).toContain(`step ${step}: active table of contents item looks identical`)
      expect(found).toContain(`step ${step}: attribution uses the browser-default link style`)
    }
    expect(found).toContain('[data-presentation-attribution]')
    expect(found).not.toContain('overlap')
  })

  it('reports an undersized attribution', async () => {
    const found = warnings((await inspect('fx-tiny')).output)
    expect(found).toHaveLength(2)
    expect(found[0]).toMatch(/step 1: attribution is too small \(8px/)
  })

  it('reports a missing attribution', async () => {
    const result = await inspect('fx-noattr')
    expect(result.code, result.output).toBe(0)
    expect(warnings(result.output).map((w) => w.replace(/^WARN step \d+: /, ''))).toEqual([
      expect.stringMatching(/^attribution is missing/),
      expect.stringMatching(/^attribution is missing/),
    ])
  })

  it('waits for transitions to settle before each capture', async () => {
    const settled = await inspect('fx-settle', '--out', path.join(out, 'settled'))
    const eager = await inspect('fx-settle', '--settle', '0', '--out', path.join(out, 'eager'))
    expect(settled.code, settled.output).toBe(0)
    expect(eager.code, eager.output).toBe(0)
    const first = redCentroidX(await png(path.join(out, 'settled/step-01.png')))
    const settledSecond = redCentroidX(await png(path.join(out, 'settled/step-02.png')))
    const eagerSecond = redCentroidX(await png(path.join(out, 'eager/step-02.png')))
    expect(first.count).toBeGreaterThan(1000)
    expect(settledSecond.count).toBeGreaterThan(1000)
    // Settled: the block reached its final position; eager: it was captured near the start.
    expect(settledSecond.x).toBeGreaterThan(first.x + 200)
    expect(eagerSecond.x).toBeLessThan(settledSecond.x - 150)
  })

  it('captures from a production preview on 127.0.0.1 and releases it afterwards', async () => {
    const result = await inspect('fx-styled')
    expect(result.output).toMatch(/inspect: preview http:\/\/127\.0\.0\.1:\d+/)
    expect(await portIsClosed(previewPort(result.output))).toBe(true)
  })

  it('fails on an unknown slug without starting a preview', async () => {
    const result = await inspect('no-such-talk')
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/unknown presentation "no-such-talk"; registered: .*how-to-make-a-presentation/)
    expect(result.output).not.toContain('inspect: preview')
  })

  it('fails operationally when the route cannot render, and still releases the preview', async () => {
    const result = await inspect('fx-broken')
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/inspect: FAIL/)
    expect(await portIsClosed(previewPort(result.output))).toBe(true)
  })

  it('needs a production build: it refuses to run without one', async () => {
    const fresh = await copyRepo() // no dist
    const result = await run(process.execPath, [path.join(fresh, 'scripts/inspect-presentation.mjs'), 'how-to-make-a-presentation', '--skip-build'], os.tmpdir())
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/inspect: FAIL/)
  })
})
