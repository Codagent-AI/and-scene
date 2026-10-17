import { mkdtemp, readFile, readdir, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { buildFixtureApp } from './fixture-app.ts'
import { leftoverProcesses, pixelAt, removeApp, run } from './helpers.ts'
import { startPreviewFor } from './preview.ts'

let app: string
let outRoot: string

beforeAll(async () => {
  app = await buildFixtureApp()
  outRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-shots-'))
})

afterAll(async () => {
  if (!app) return
  expect(await leftoverProcesses(app)).toBe('')
  await removeApp(app)
  await removeApp(outRoot)
})

async function inspect(slug: string, extra: string[] = ['--settle', '1500']) {
  const out = path.join(outRoot, slug + extra.join(''))
  const result = await run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--out', out, ...extra], app)
  const warnings = result.output.split('\n').filter((line) => line.startsWith('WARN'))
  return { ...result, out, warnings }
}

describe('INT-002: the screenshot helper', () => {
  it('writes one predictable screenshot per step and exits zero with no warnings on a polished presentation', async () => {
    const { code, out, warnings, output } = await inspect('polished')
    expect(code).toBe(0)
    expect(warnings).toEqual([])
    expect((await readdir(out)).sort()).toEqual(['step-01.png', 'step-02.png'])
    expect(output).toContain('captured 2 screenshots')
    expect((await stat(path.join(out, 'step-01.png'))).size).toBeGreaterThan(1000)
  })

  it('defaults to a predictable project-local directory', async () => {
    const result = await run('node', ['scripts/inspect-presentation.mjs', 'polished', '--no-build', '--settle', '300'], app)
    expect(result.code).toBe(0)
    expect((await readdir(path.join(app, 'inspection-output', 'polished'))).sort()).toEqual(['step-01.png', 'step-02.png'])
  })

  it('captures only after transitions settle', async () => {
    const settled = await inspect('settle', ['--settle', '2200'])
    expect(settled.code).toBe(0)
    const [r, g] = pixelAt(await readFile(path.join(settled.out, 'step-01.png')), 5, 5)
    expect([r, g]).toEqual([0, 128])
    const early = await inspect('settle', ['--settle', '0'])
    const [r2] = pixelAt(await readFile(path.join(early.out, 'step-01.png')), 5, 5)
    expect(r2).toBeGreaterThan(0)
    const gap = (await stat(path.join(settled.out, 'step-02.png'))).mtimeMs - (await stat(path.join(settled.out, 'step-01.png'))).mtimeMs
    expect(gap).toBeGreaterThanOrEqual(2200)
  })

  it('warns about an unmarked text collision at the right step, still exiting zero', async () => {
    const { code, warnings } = await inspect('collision')
    expect(code).toBe(0)
    expect(warnings.length).toBeGreaterThan(0)
    for (const warning of warnings) expect(warning).toMatch(/^WARN step 2 overlap: .*first stacked words.*second stacked words/)
  })

  it('does not warn about an overlap inside an allow-overlap subtree', async () => {
    const { warnings } = await inspect('allowed')
    expect(warnings).toEqual([])
  })

  it('warns about indistinct active progress and table-of-contents chrome on every step', async () => {
    const { warnings } = await inspect('indistinct')
    for (const step of [1, 2]) {
      expect(warnings.some((w) => w.startsWith(`WARN step ${step} indistinct active chrome`) && w.includes('progress indicator'))).toBe(true)
      expect(warnings.some((w) => w.startsWith(`WARN step ${step} indistinct active chrome`) && w.includes('table-of-contents entry'))).toBe(true)
    }
    expect(warnings.filter((w) => w.includes('attribution'))).toEqual([])
  })

  it('warns about unpolished attribution and points to its hook', async () => {
    const { warnings } = await inspect('unpolished')
    expect(warnings).toHaveLength(2)
    for (const [i, warning] of warnings.entries()) {
      expect(warning).toContain(`WARN step ${i + 1} attribution`)
      expect(warning).toContain('[data-presentation-attribution]')
    }
  })

  it('warns when the attribution is missing', async () => {
    const { code, warnings } = await inspect('noattr')
    expect(code).toBe(0)
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toMatch(/WARN step 1 attribution: no \[data-presentation-attribution\]/)
  })
})

describe('kit motion in a real browser', () => {
  let browser: Browser
  let page: Page
  let stop: () => void
  let url: string

  beforeAll(async () => {
    ;({ url, stop } = await startPreviewFor(app))
    browser = await chromium.launch()
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  })

  afterAll(async () => {
    await browser.close()
    stop()
  })

  const rect = (testId: string) =>
    page.evaluate((id) => {
      const r = document.querySelector(`[data-presentation-id="${id}"]`)?.getBoundingClientRect()
      return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null
    }, testId)
  const opacityOf = (id: string) =>
    page.evaluate((x) => {
      const el = document.querySelector(`[data-presentation-id="${x}"]`) as HTMLElement | null
      return el ? Number(getComputedStyle(el).opacity) : null
    }, id)

  it('morphs a persisting entity in place, enters newcomers after it settles and animates leavers out', async () => {
    await page.goto(`${url}/morph`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const start = (await rect('morph-a'))!
    await page.evaluate(() => {
      ;(window as unknown as { __a: Element }).__a = document.querySelector('[data-presentation-id="morph-a"]')!
    })
    expect(await opacityOf('morph-b-box')).toBe(1)
    expect(await page.evaluate(() => window.__mounts)).toBe(1)

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(250)
    const mid = (await rect('morph-a'))!
    expect(mid.left).toBeGreaterThan(start.left + 5)
    expect(mid.width).toBeGreaterThan(start.width + 2)
    // newcomer is still waiting for the persisting entity to settle
    expect(await opacityOf('morph-c')).toBe(0)
    // the leaver is fading out rather than gone
    const leaving = await opacityOf('morph-b')
    expect(leaving).not.toBeNull()
    expect(leaving).toBeLessThan(1)

    await page.waitForTimeout(1800)
    const end = (await rect('morph-a'))!
    expect(end.left).toBeGreaterThan(mid.left)
    expect(end.width).toBeGreaterThan(mid.width)
    expect(end.width / end.height).toBeCloseTo(240 / 100, 0)
    expect(await page.evaluate(() => (window as unknown as { __a: Element }).__a.isConnected)).toBe(true)
    expect(await page.textContent('[data-testid="a-label"]')).toBe('two')
    expect(await opacityOf('morph-c')).toBe(1)
    expect(await opacityOf('morph-b')).toBeNull()
    expect(await page.evaluate(() => window.__mounts)).toBe(1)
  })

  it('morphs a shared layoutId across different scenes while a peer entity stays still', async () => {
    await page.goto(`${url}/ungrouped`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const start = (await rect('shared-box'))!
    const peerBefore = (await rect('peer-box'))!
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(250)
    const mid = (await rect('shared-box'))!
    expect(mid.left).toBeGreaterThan(start.left + 5)
    await page.waitForTimeout(1800)
    const end = (await rect('shared-box'))!
    expect(end.left).toBeGreaterThan(mid.left)
    const peerAfter = (await rect('peer-box'))!
    expect(Math.abs(peerAfter.left - peerBefore.left)).toBeLessThan(1)
    expect(Math.abs(peerAfter.top - peerBefore.top)).toBeLessThan(1)
  })

  it('keeps one scale and still entities across steps whose captions differ in length', async () => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${url}/how-to-make-a-presentation`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const probe = () =>
      page.evaluate(() => ({
        scale: document.querySelector('[data-presentation-canvas]')!.getAttribute('data-presentation-scale'),
        you: document.querySelector('[data-presentation-id="htm-you"]')!.getBoundingClientRect().left,
      }))
    const first = await probe()
    for (let step = 1; step < 9; step++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(120)
      const now = await probe()
      expect(now.scale).toBe(first.scale)
      expect(now.you).toBeCloseTo(first.you, 1)
    }
  })

  it('keeps the same composition when the canvas is scaled for a narrow viewport', async () => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${url}/polished`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    const wide = await page.evaluate(() => {
      const canvas = document.querySelector('[data-presentation-canvas]')!.getBoundingClientRect()
      const a = document.querySelector('[data-presentation-id="plain-a"]')!.getBoundingClientRect()
      const b = document.querySelector('[data-presentation-id="plain-b"]')!.getBoundingClientRect()
      return { canvas: canvas.width / canvas.height, ratio: (b.left - a.left) / canvas.width }
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(600)
    const narrow = await page.evaluate(() => {
      const canvas = document.querySelector('[data-presentation-canvas]')!.getBoundingClientRect()
      const a = document.querySelector('[data-presentation-id="plain-a"]')!.getBoundingClientRect()
      const b = document.querySelector('[data-presentation-id="plain-b"]')!.getBoundingClientRect()
      return { canvas: canvas.width / canvas.height, ratio: (b.left - a.left) / canvas.width, width: canvas.width }
    })
    expect(narrow.canvas).toBeCloseTo(880 / 380, 2)
    expect(narrow.canvas).toBeCloseTo(wide.canvas, 2)
    expect(narrow.ratio).toBeCloseTo(wide.ratio, 2)
    expect(narrow.width).toBeLessThanOrEqual(390)
  })
})
