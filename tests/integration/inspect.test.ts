import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PNG } from 'pngjs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { VARIANTS, installFixtures } from '../support/inspect-fixtures'
import { copyRepo, remove, run, tempDir } from '../support/sandbox'

interface Manifest {
  settleMs: number
  viewport: { width: number; height: number }
  steps: { step: number; file: string; navigatedAt: number; capturedAt: number }[]
  warnings: { step: number; type: string; message: string }[]
}

const SETTLE = 1700

// INT-002: the project-local helper emits faithful artifacts and advisory warnings.
describe('INT-002: screenshot helper', () => {
  let app: string
  let out: string
  const manifests: Record<string, Manifest> = {}
  const exits: Record<string, number | null> = {}
  const logs: Record<string, string> = {}

  const inspect = (slug: string, extra: string[] = []) =>
    run(process.execPath, ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', String(SETTLE), '--out', out, ...extra], app)
  const readManifest = async (dirName: string) =>
    JSON.parse(await readFile(path.join(out, dirName, 'manifest.json'), 'utf8')) as Manifest
  // The marker sits inside the scaled canvas, so count its pure-blue / pure-red pixels instead of
  // assuming where it lands on screen.
  const markerPixels = async (dirName: string, step: number) => {
    const png = PNG.sync.read(await readFile(path.join(out, dirName, `step-0${step}.png`)))
    let red = 0
    let blue = 0
    for (let i = 0; i < png.data.length; i += 4) {
      const [r, g, b] = [png.data[i], png.data[i + 1], png.data[i + 2]]
      if (r === 255 && g === 0 && b === 0) red++
      if (r === 0 && g === 0 && b === 255) blue++
    }
    return { red, blue }
  }
  const warnings = (slug: string, type?: string) => manifests[slug].warnings.filter((w) => !type || w.type === type)

  beforeAll(async () => {
    app = await tempDir('inspect')
    out = path.join(app, 'out')
    await copyRepo(app)
    await installFixtures(app)
    const build = await run('npm', ['run', 'build'], app)
    expect(build.code, build.stdout + build.stderr).toBe(0)
    for (const v of VARIANTS) {
      const r = await inspect(v.slug)
      exits[v.slug] = r.code
      logs[v.slug] = r.stdout + r.stderr
      manifests[v.slug] = await readManifest(v.slug)
    }
  })
  afterAll(() => remove(app))

  it('writes one predictable screenshot per step at the desktop viewport', async () => {
    const m = manifests['fx-clean']
    expect(m.viewport).toEqual({ width: 1440, height: 900 })
    expect(m.steps.map((s) => s.file)).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    const sizes = []
    for (const s of m.steps) {
      const png = PNG.sync.read(await readFile(path.join(out, 'fx-clean', s.file)))
      sizes.push([png.width, png.height])
    }
    expect(sizes).toEqual([[1440, 900], [1440, 900], [1440, 900]])
    // each screenshot shows its own step: the title differs, so the images must differ
    const buffers = await Promise.all(m.steps.map((s) => readFile(path.join(out, 'fx-clean', s.file))))
    expect(new Set(buffers.map((b) => b.toString('base64'))).size).toBe(3)
  })

  it('waits the settle interval before every capture, including the first', () => {
    for (const v of VARIANTS) {
      for (const s of manifests[v.slug].steps) expect(s.capturedAt - s.navigatedAt, `${v.slug} step ${s.step}`).toBeGreaterThanOrEqual(SETTLE)
    }
  })

  it('captures the late-settling marker in its settled colour, and the unsettled colour with a short wait', async () => {
    for (const step of [1, 2, 3]) {
      const { red, blue } = await markerPixels('fx-clean', step)
      expect({ step, settled: red > 500 && blue === 0 }).toEqual({ step, settled: true })
    }
    const early = await inspect('fx-clean', ['--settle', '300', '--label', 'early'])
    expect(early.code).toBe(0)
    const { red, blue } = await markerPixels('fx-clean-early', 2)
    expect(blue > 500 && red === 0).toBe(true)
  })

  it('reports no warnings for a well-styled presentation, and exits zero', () => {
    expect(warnings('fx-clean')).toEqual([])
    expect(logs['fx-clean']).toContain('no advisory warnings')
    expect(exits['fx-clean']).toBe(0)
  })

  it('reports an unmarked collision with the step and both elements', () => {
    const overlaps = warnings('fx-collision', 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)
    expect(overlaps.map((w) => w.step).sort()).toEqual([2, 3])
    expect(overlaps[0].message).toContain('"Alpha text"')
    expect(overlaps[0].message).toContain('"Beta text"')
    expect(logs['fx-collision']).toMatch(/WARN step 02 \[overlap\]/)
    expect(warnings('fx-collision', 'overlap').some((w) => w.step === 1)).toBe(false)
    expect(exits['fx-collision']).toBe(0)
  })

  it('reports overlapping SVG text, and text overlapping text inside its own ancestor', () => {
    const svg = warnings('fx-svg-text', 'overlap')
    expect(svg.length).toBeGreaterThan(0)
    expect(svg[0].message).toContain('Svg text')
    expect(svg[0].message).toContain('Plain text')
    const nested = warnings('fx-nested-text', 'overlap')
    expect(nested.length).toBeGreaterThan(0)
    expect(nested[0].message).toContain('Child text')
    expect(nested[0].message).toContain('Parent text')
  })

  it('does not warn about an overlap inside an explicit allow-overlap marker', () => {
    expect(warnings('fx-allowed')).toEqual([])
  })

  it('still warns about an unrelated unmarked collision next to an allowed one', () => {
    const overlaps = warnings('fx-mixed', 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)
    for (const w of overlaps) {
      expect(w.message).toContain('Gamma')
      expect(w.message).not.toContain('Alpha')
    }
  })

  it('reports indistinct active progress and table-of-contents chrome, per step', () => {
    const chrome = warnings('fx-indistinct', 'active-chrome')
    for (const step of [1, 2, 3]) {
      const messages = chrome.filter((w) => w.step === step).map((w) => w.message)
      expect(messages.some((m) => m.includes('progress')), `progress step ${step}`).toBe(true)
      // the ToC has two eras, so it can be compared on every step
      expect(messages.some((m) => m.includes('table-of-contents')), `toc step ${step}`).toBe(true)
    }
    expect(warnings('fx-indistinct', 'attribution')).toEqual([])
    expect(warnings('fx-clean', 'active-chrome')).toEqual([])
  })

  it('reports browser-default and tiny attribution, pointing at the styling hook', () => {
    for (const slug of ['fx-attr-default', 'fx-attr-tiny']) {
      const found = warnings(slug, 'attribution')
      expect(found.map((w) => w.step), slug).toEqual([1, 2, 3])
      expect(found[0].message).toContain('[data-presentation-attribution]')
      expect(warnings(slug, 'active-chrome')).toEqual([])
      expect(warnings(slug, 'overlap')).toEqual([])
    }
    expect(warnings('fx-attr-default')[0].message).toContain('browser-default')
    expect(warnings('fx-attr-tiny')[0].message).toContain('too small')
  })

  it('treats warnings as advisory: every variant exits zero', () => {
    for (const v of VARIANTS) expect(exits[v.slug], v.slug).toBe(0)
  })

  it('fails operationally for an unknown slug, and with usage for a missing one', async () => {
    const unknown = await inspect('does-not-exist')
    expect(unknown.code).toBe(1)
    expect(unknown.stderr).toContain('does-not-exist')
    const none = await run(process.execPath, ['scripts/inspect-presentation.mjs'], app)
    expect(none.code).toBe(1)
    expect(none.stderr).toContain('usage')
  })
})
