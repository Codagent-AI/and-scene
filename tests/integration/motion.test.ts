import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import {
  buildMotionFixtures,
  installSampler,
  launch,
  sampleDuring,
  serveDirectory,
  type Frame,
  type Served,
} from './helpers'

// Browser-backed checks of the kit's motion contract, run against standalone fixture
// presentations built from the real kit (never registered in the production app).
let browser: Browser
let served: Served

beforeAll(async () => {
  served = await serveDirectory(await buildMotionFixtures())
  browser = await launch()
})
afterAll(async () => {
  await browser?.close()
  await served?.close()
})

async function open(fixture: string, viewport = { width: 1280, height: 800 }): Promise<Page> {
  const page = await browser.newPage({ viewport })
  await page.goto(`${served.url}/?fixture=${fixture}`)
  await page.waitForSelector('[data-step-count]')
  await page.waitForTimeout(900)
  await installSampler(page)
  return page
}

const first = <T,>(items: T[]) => items[0]
const effective = (frame: Frame, id: string) => Math.max(0, ...frame.els[id].map((e) => e.op))
/** Combined visibility of every element carrying the id (a shared-layout crossfade layers two). */
const visibility = (frame: Frame, id: string) => 1 - frame.els[id].reduce((rest, e) => rest * (1 - e.op), 1)

describe('grouped scene motion', () => {
  it('morphs a persisting entity in place; newcomers enter after it settles; leavers exit', async () => {
    const page = await open('grouped')
    await page.evaluate(() => {
      ;(window as unknown as Record<string, unknown>).__a = document.querySelector('[data-presentation-entity="A"]')
    })
    const frames = await sampleDuring(page, ['A', 'B', 'C'], () => page.keyboard.press('ArrowRight'))

    // I-4: A exists in every frame and travels through intermediate geometry, with no
    // disappear/reappear cycle and no entry fade replayed (I-8).
    const a = frames.map((f) => first(f.els.A))
    expect(frames.every((f) => f.els.A.length === 1)).toBe(true)
    expect(Math.min(...frames.map((f) => effective(f, 'A')))).toBeGreaterThanOrEqual(0.99)
    expect(a[0].x).toBeCloseTo(40, -1)
    expect(a.at(-1)!.x).toBeCloseTo(520, 0)
    expect(a.some((e) => e.x > 80 && e.x < 480)).toBe(true)
    expect(a.some((e) => e.w > 130 && e.w < 190)).toBe(true)
    for (let i = 1; i < a.length; i++) expect(a[i].x).toBeGreaterThanOrEqual(a[i - 1].x - 1)
    expect(a.at(-1)!.w).toBeCloseTo(200, 0)
    expect(a.at(-1)!.h).toBeCloseTo(90, 0)
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__a === document.querySelector('[data-presentation-entity="A"]'))).toBe(true)
    expect(await page.textContent('[data-presentation-entity="A"]')).toBe('A second')
    expect(await page.getAttribute('[data-presentation-entity="A"]', 'class')).toBe('emphasis')

    // I-5: C only starts appearing once A has reached its final bounds.
    const settledAt = frames.find((f) => Math.abs(first(f.els.A).x - 520) <= 2 && Math.abs(first(f.els.A).y - 220) <= 2)!.t
    const enteredAt = frames.find((f) => effective(f, 'C') > 0.05)!.t
    expect(enteredAt).toBeGreaterThanOrEqual(settledAt - 60)
    expect(frames.filter((f) => f.t < settledAt - 60).every((f) => effective(f, 'C') <= 0.05)).toBe(true)
    expect(effective(frames.at(-1)!, 'C')).toBeGreaterThanOrEqual(0.99)

    // I-6: B stays in the DOM through a visible fade, then is removed.
    const bFrames = frames.filter((f) => f.els.B.length)
    expect(bFrames.some((f) => effective(f, 'B') > 0.05 && effective(f, 'B') < 0.95)).toBe(true)
    for (let i = 1; i < bFrames.length; i++) expect(effective(bFrames[i], 'B')).toBeLessThanOrEqual(effective(bFrames[i - 1], 'B') + 0.02)
    expect(frames.at(-1)!.els.B).toHaveLength(0)
    expect(bFrames.at(-1)!.t).toBeGreaterThan(100)
    await page.close()
  })

  it('does not replay entry or layout motion when only the mode changes', async () => {
    const page = await open('grouped')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(1500)
    await page.evaluate(() => {
      ;(window as unknown as Record<string, unknown>).__a = document.querySelector('[data-presentation-entity="A"]')
    })
    for (let toggle = 0; toggle < 2; toggle++) {
      const frames = await sampleDuring(page, ['A', 'C'], () => page.keyboard.press('p'), 900)
      const settled = frames.at(-1)!
      for (const id of ['A', 'C']) {
        expect(frames.every((f) => f.els[id].length === 1), id).toBe(true)
        expect(Math.min(...frames.map((f) => effective(f, id))), id).toBeGreaterThanOrEqual(0.99)
        // canvas-relative coordinates never move: only the fit geometry changed
        for (const f of frames) {
          expect(Math.abs(first(f.els[id]).x - first(settled.els[id]).x), id).toBeLessThanOrEqual(1.5)
          expect(Math.abs(first(f.els[id]).y - first(settled.els[id]).y), id).toBeLessThanOrEqual(1.5)
        }
      }
    }
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__a === document.querySelector('[data-presentation-entity="A"]'))).toBe(true)
    await page.close()
  })

  it('keeps intentional overlap and stacking intact while the layer updates', async () => {
    const page = await open('overlap')
    const overlap = (f: Frame) => {
      const [u] = f.els.under
      const [o] = f.els.over
      const w = Math.min(u.x + u.w, o.x + o.w) - Math.max(u.x, o.x)
      const h = Math.min(u.y + u.h, o.y + o.h) - Math.max(u.y, o.y)
      return w > 0 && h > 0 ? w * h : 0
    }
    const topAt = () =>
      page.evaluate(() => {
        const o = document.querySelector('[data-presentation-entity="over"]')!.getBoundingClientRect()
        const u = document.querySelector('[data-presentation-entity="under"]')!.getBoundingClientRect()
        const x = (Math.max(o.left, u.left) + Math.min(o.right, u.right)) / 2
        const y = (Math.max(o.top, u.top) + Math.min(o.bottom, u.bottom)) / 2
        return document.elementsFromPoint(x, y)[0]?.getAttribute('data-presentation-entity')
      })
    expect(await topAt()).toBe('over')
    const frames = await sampleDuring(page, ['under', 'over'], () => page.keyboard.press('ArrowRight'), 1200)
    expect(frames.every((f) => overlap(f) > 0)).toBe(true)
    expect(Math.min(...frames.map((f) => Math.min(effective(f, 'under'), effective(f, 'over'))))).toBeGreaterThanOrEqual(0.99)
    expect(frames.at(-1)!.els.over[0].x).toBeCloseTo(180, 0)
    expect(await topAt()).toBe('over')
    expect(await page.locator('[data-presentation-allow-overlap]').count()).toBe(2)
    await page.close()
  })

  it('supports raw motion elements with stable layoutIds under the kit host', async () => {
    const page = await open('raw')
    const frames = await sampleDuring(page, ['raw'], () => page.keyboard.press('ArrowRight'), 1000)
    const xs = frames.map((f) => first(f.els.raw).x)
    expect(xs[0]).toBeCloseTo(30, -1)
    expect(xs.at(-1)).toBeCloseTo(600, 0)
    expect(xs.some((x) => x > 80 && x < 550)).toBe(true)
    expect(frames.every((f) => f.els.raw.length === 1)).toBe(true)
    await page.close()
  })
})

describe('ungrouped transitions', () => {
  it('cross-fades scenes while shared entities morph and stay visible', async () => {
    const page = await open('ungrouped')
    const frames = await sampleDuring(page, ['S', 'D', 'N'], () => page.keyboard.press('ArrowRight'))
    // survivor: always visible somewhere, travelling through intermediate geometry
    expect(Math.min(...frames.map((f) => visibility(f, 'S')))).toBeGreaterThanOrEqual(0.9)
    const lead = frames.map((f) => f.els.S.reduce((best, e) => (e.op > best.op ? e : best)))
    expect(lead[0].x).toBeCloseTo(40, -1)
    expect(lead.at(-1)!.x).toBeCloseTo(500, 0)
    expect(lead.some((e) => e.x > 80 && e.x < 460)).toBe(true)
    // leaver: present while fading, then removed
    const dFrames = frames.filter((f) => f.els.D.length)
    expect(dFrames.some((f) => effective(f, 'D') > 0.05 && effective(f, 'D') < 0.95)).toBe(true)
    expect(frames.at(-1)!.els.D).toHaveLength(0)
    // newcomer waits for the survivor to settle
    const settledAt = frames.find((f) => Math.abs(lead[frames.indexOf(f)].x - 500) <= 2)!.t
    expect(frames.filter((f) => f.t < settledAt - 60).every((f) => effective(f, 'N') <= 0.05)).toBe(true)
    expect(effective(frames.at(-1)!, 'N')).toBeGreaterThanOrEqual(0.99)
    await page.close()
  })
})

describe('arrow continuity', () => {
  it('morphs an arrow from its previous geometry when the scene changes', async () => {
    const page = await open('ungrouped')
    const frames = await page.evaluate(
      () =>
        new Promise<{ t: number; ends: number[] }[]>((done) => {
          const out: { t: number; ends: number[] }[] = []
          const t0 = performance.now()
          const measure = () => {
            const ends = [...document.querySelectorAll('[data-presentation-entity="arr"] > path')].map((path) => {
              const numbers = (path.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g) ?? []
              return Number(numbers[numbers.length - 2])
            })
            out.push({ t: performance.now() - t0, ends })
            if (performance.now() - t0 < 1200) requestAnimationFrame(() => setTimeout(measure, 0))
            else done(out)
          }
          window.addEventListener('keydown', () => requestAnimationFrame(() => setTimeout(measure, 0)), { once: true })
          setTimeout(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })), 0)
        }),
    )
    const live = frames.filter((f) => f.ends.length)
    // the incoming arrow starts from the outgoing arrow's end point (200), not its own (400) ...
    const early = live.find((f) => f.ends.length === 2)!
    expect(Math.min(...early.ends)).toBeLessThan(260)
    // ... passes through intermediate geometry ...
    expect(live.some((f) => f.ends.some((x) => x > 230 && x < 380))).toBe(true)
    // ... and settles on its own end point as the only arrow left
    expect(live.at(-1)!.ends).toHaveLength(1)
    expect(live.at(-1)!.ends[0]).toBeCloseTo(400, 0)
    await page.close()
  })
})

describe('fixed canvas scaling', () => {
  for (const mode of ['browse', 'present'] as const) {
    it(`scales uniformly without internal reflow in ${mode} mode`, async () => {
      const page = await open('grouped')
      if (mode === 'present') await page.keyboard.press('p')
      await page.waitForTimeout(500)
      const read = () =>
        page.evaluate(() => {
          const canvas = document.querySelector('[data-presentation-canvas]')!
          const box = canvas.getBoundingClientRect()
          const a = document.querySelector('[data-presentation-entity="A"]')!.getBoundingClientRect()
          const scale = box.width / canvas.clientWidth
          return {
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            sx: box.width / canvas.clientWidth,
            sy: box.height / canvas.clientHeight,
            ax: (a.left - box.left) / scale,
            ay: (a.top - box.top) / scale,
            aw: a.width / scale,
          }
        })
      const wide = await read()
      expect([wide.width, wide.height]).toEqual([880, 380])
      expect(Math.abs(wide.sx - wide.sy)).toBeLessThan(0.002)
      for (const size of [{ width: 700, height: 700 }, { width: 1500, height: 500 }, { width: 400, height: 800 }]) {
        await page.setViewportSize(size)
        await page.waitForTimeout(500)
        const now = await read()
        expect(Math.abs(now.sx - now.sy)).toBeLessThan(0.002)
        expect(now.ax).toBeCloseTo(wide.ax, 0)
        expect(now.ay).toBeCloseTo(wide.ay, 0)
        expect(now.aw).toBeCloseTo(wide.aw, 0)
        expect(now.sx).not.toBeCloseTo(wide.sx, 2)
      }
      await page.close()
    })
  }
})
