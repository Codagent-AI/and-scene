import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { installSampler, launch, repoRoot, run, sampleDuring, serveDirectory, type Frame, type Served } from './helpers'
import { join } from 'node:path'

// Browser-backed checks of the committed sample's rendered chrome and scene (production build).
let browser: Browser
let served: Served
const SLUG = 'how-to-make-a-presentation'

beforeAll(async () => {
  const built = await run('npm', ['run', 'build'], repoRoot)
  expect(built.code, built.output).toBe(0)
  served = await serveDirectory(join(repoRoot, 'dist'))
  browser = await launch()
})
afterAll(async () => {
  await browser?.close()
  await served?.close()
})

async function open(viewport: { width: number; height: number }, mode?: 'present' | 'browse'): Promise<Page> {
  const page = await browser.newPage({ viewport })
  await page.goto(`${served.url}/${SLUG}`)
  await page.waitForSelector('[data-step-count]')
  await page.waitForTimeout(800)
  if (mode && (await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== mode) {
    await page.keyboard.press('p')
    await page.waitForTimeout(300)
  }
  return page
}

const index = (page: Page) => page.getAttribute('[data-presentation-root]', 'data-step-index')

describe('attribution', () => {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    for (const mode of ['browse', 'present'] as const) {
      it(`sits bottom-right, visible and legible, at ${viewport.width}px in ${mode} mode`, async () => {
        const page = await open(viewport, mode)
        const link = await page.evaluate(() => {
          const el = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
          const box = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          return {
            text: el.textContent,
            href: el.href,
            left: box.left,
            top: box.top,
            right: box.right,
            bottom: box.bottom,
            fontSize: parseFloat(style.fontSize),
            underline: style.textDecorationLine.includes('underline'),
            color: style.color,
            visible: style.visibility === 'visible' && style.display !== 'none',
          }
        })
        expect(link.text).toBe('made by and-scene')
        expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
        expect(link.visible).toBe(true)
        expect(link.right).toBeLessThanOrEqual(viewport.width)
        expect(link.bottom).toBeLessThanOrEqual(viewport.height)
        expect(viewport.width - link.right).toBeLessThan(viewport.width * 0.15)
        expect(viewport.height - link.bottom).toBeLessThan(viewport.height * 0.12)
        expect(link.left + (link.right - link.left) / 2).toBeGreaterThan(viewport.width * 0.5)
        expect(link.fontSize).toBeGreaterThanOrEqual(11)
        expect(link.bottom - link.top).toBeGreaterThanOrEqual(16)
        expect(link.underline && link.color === 'rgb(0, 0, 238)').toBe(false)
        await page.close()
      })
    }
  }
})

describe('mode-specific chrome in a real browser', () => {
  it('present mode shows a one-line title and no caption, ToC or prev/next', async () => {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      const page = await open(viewport, 'present')
      for (let step = 0; step < 9; step++) {
        const lines = await page.evaluate(() => {
          const title = document.querySelector('[data-presentation-title]')!
          const range = document.createRange()
          range.selectNodeContents(title)
          return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size
        })
        expect(lines, `step ${step} @${viewport.width}`).toBe(1)
        for (const hook of ['caption', 'toc', 'prev', 'next', 'progress-item']) {
          expect(await page.locator(`[data-presentation-${hook}]`).count(), hook).toBe(0)
        }
        expect(await page.textContent('[data-presentation-step-number]')).toBe(`${step + 1} / 9`)
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(60)
      }
      await page.close()
    }
  })

  it('browse mode shows the ToC only on wide viewports, and wraps long captions visibly', async () => {
    const wide = await open({ width: 1280, height: 800 }, 'browse')
    expect(await wide.locator('[data-presentation-toc]').isVisible()).toBe(true)
    expect(await wide.locator('[data-presentation-progress-item]').count()).toBe(9)
    await wide.close()
    const narrow = await open({ width: 390, height: 844 }, 'browse')
    expect(await narrow.locator('[data-presentation-toc]').count()).toBe(0)
    await narrow.keyboard.press('ArrowRight')
    await narrow.keyboard.press('ArrowRight')
    await narrow.waitForTimeout(300)
    const lines = await narrow.evaluate(() => {
      const caption = document.querySelector('[data-presentation-caption]')!
      const range = document.createRange()
      range.selectNodeContents(caption)
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size
    })
    expect(lines).toBeGreaterThan(1)
    expect(await narrow.evaluate(() => document.scrollingElement!.scrollWidth <= window.innerWidth)).toBe(true)
    await narrow.close()
  })

  it('keeps every piece of diagram text legible after scaling to a narrow viewport', async () => {
    const narrow = await open({ width: 390, height: 844 }, 'browse')
    for (let i = 0; i < 8; i++) await narrow.keyboard.press('ArrowRight')
    await narrow.waitForTimeout(1200)
    const smallest = await narrow.evaluate(() => {
      const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
      const scale = canvas.getBoundingClientRect().width / canvas.offsetWidth
      const sizes: number[] = []
      for (const element of canvas.querySelectorAll<HTMLElement>('*')) {
        const ownText = [...element.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        if (ownText) sizes.push(parseFloat(getComputedStyle(element).fontSize) * scale)
      }
      return Math.min(...sizes)
    })
    expect(smallest).toBeGreaterThanOrEqual(5)
    await narrow.close()
  })

  it('moves with the on-screen controls, progress dots and ToC entries', async () => {
    const page = await open({ width: 1280, height: 800 }, 'browse')
    await page.click('[data-presentation-next]')
    await page.click('[data-presentation-next]')
    expect(await index(page)).toBe('2')
    await page.click('[data-presentation-prev]')
    expect(await index(page)).toBe('1')
    await page.locator('[data-presentation-progress-item]').nth(7).click()
    expect(await index(page)).toBe('7')
    await page.locator('[data-presentation-toc-entry]').first().click()
    expect(await index(page)).toBe('0')
    await page.locator('[data-presentation-toc-entry]').nth(2).click()
    expect(await index(page)).toBe('5')
    expect(await page.getAttribute('[data-presentation-toc-entry][data-presentation-active="true"]', 'aria-current')).toBe('true')
    expect(await page.locator('[data-presentation-progress-item][aria-current="step"]').count()).toBe(1)
    await page.close()
  })

  it('styles active chrome so the current item is visibly distinct', async () => {
    const page = await open({ width: 1280, height: 800 }, 'browse')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
    const differs = await page.evaluate(() => {
      const compare = (selector: string) => {
        const items = [...document.querySelectorAll(selector)]
        const active = items.find((i) => i.getAttribute('data-presentation-active') === 'true')!
        const other = items.find((i) => i !== active)!
        const a = getComputedStyle(active)
        const o = getComputedStyle(other)
        return ['backgroundColor', 'borderLeftColor', 'borderTopColor', 'fontWeight', 'color'].some((k) => (a as never)[k] !== (o as never)[k]) ||
          Math.abs(active.getBoundingClientRect().width - other.getBoundingClientRect().width) > 4
      }
      return [compare('[data-presentation-progress-item]'), compare('[data-presentation-toc-entry]')]
    })
    expect(differs).toEqual([true, true])
    await page.close()
  })
})

describe('sample scene', () => {
  it('keeps continuing entities visible and in place on every transition, inside the canvas', async () => {
    const page = await open({ width: 1280, height: 800 }, 'browse')
    await installSampler(page)
    const ids = ['htmp-you', 'htmp-prompt']
    let previous: Frame | undefined
    for (let step = 0; step < 9; step++) {
      const inBounds = await page.evaluate(() => {
        const canvas = document.querySelector('[data-presentation-canvas]')!.getBoundingClientRect()
        const scale = canvas.width / 880
        return [...document.querySelectorAll('[data-presentation-entity]')].every((el) => {
          const r = el.getBoundingClientRect()
          return r.left >= canvas.left - 1 && r.top >= canvas.top - 1 && r.right <= canvas.left + 880 * scale + 1 && r.bottom <= canvas.top + 380 * scale + 1
        })
      })
      expect(inBounds, `step ${step} stays inside the 880 x 380 canvas`).toBe(true)
      if (step === 8) break
      const frames = await sampleDuring(page, ids, () => page.keyboard.press('ArrowRight'), 1300)
      for (const id of ids) {
        expect(frames.every((f) => f.els[id].length === 1), `${id} @${step}`).toBe(true)
        expect(Math.min(...frames.map((f) => f.els[id][0].op)), `${id} opacity @${step}`).toBeGreaterThanOrEqual(0.99)
        if (previous) {
          expect(Math.abs(frames.at(-1)!.els[id][0].x - previous.els[id][0].x), id).toBeLessThanOrEqual(1)
          expect(Math.abs(frames.at(-1)!.els[id][0].y - previous.els[id][0].y), id).toBeLessThanOrEqual(1)
        }
      }
      previous = frames.at(-1)
    }
    await page.close()
  })

  it('draws new entities only after the beat that introduces them, and removes them going back', async () => {
    const page = await open({ width: 1280, height: 800 }, 'browse')
    const count = () => page.locator('[data-presentation-entity]').count()
    const counts = [await count()]
    for (let step = 1; step < 9; step++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(150)
      counts.push(await count())
    }
    expect(counts).toEqual([2, 5, 9, 16, 18, 20, 23, 27, 29])
    for (let step = 8; step > 0; step--) await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(800)
    expect(await count()).toBe(2)
    await page.close()
  })

  it('scales the narrow viewport without horizontal overflow in both modes', async () => {
    for (const mode of ['browse', 'present'] as const) {
      const page = await open({ width: 390, height: 844 }, mode)
      for (let step = 0; step < 9; step++) {
        expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= window.innerWidth)).toBe(true)
        await page.keyboard.press('ArrowRight')
      }
      await page.close()
    }
  })
})
