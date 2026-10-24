import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { exec, repo } from './helpers.ts'

// Scene-content intent of the reference sample: what is on the canvas at each step.
const { launchChromium, startPreview } = await import('../../scripts/lib/preview.mjs')

let browser: Browser
let preview: { baseUrl: string; stop: () => void }
let page: Page

async function atStep(index: number) {
  await page.goto(`${preview.baseUrl}/how-to-make-a-presentation`)
  await page.waitForSelector('[data-presentation-root]')
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowRight')
  await page.waitForFunction((n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n), index)
  await page.waitForTimeout(1500)
}

/** Visible elements whose border box covers most of the 880x380 canvas. */
const canvasSizedBorders = () =>
  page.evaluate(() => {
    const stage = document.querySelector('[data-presentation-stage]')!.getBoundingClientRect()
    return [...document.querySelectorAll('[data-presentation-layer] *')]
      .filter((el) => {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        const border = ['Top', 'Right', 'Bottom', 'Left'].some(
          (side) => cs.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none' && parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0,
        )
        return border && r.width > stage.width * 0.8 && r.height > stage.height * 0.8
      })
      .map((el) => el.getAttribute('data-presentation-id'))
  })

beforeAll(async () => {
  const build = await exec('npm', ['run', 'build'], repo)
  expect(build.code, build.output).toBe(0)
  preview = await startPreview(repo)
  browser = await launchChromium()
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
})

afterAll(async () => {
  await browser?.close()
  preview?.stop()
})

describe('reference sample scene content', () => {
  it.each([0, 1, 2, 3, 4, 5, 6, 7])('step %i draws no canvas-wide frame before the final reveal', async (i) => {
    await atStep(i)
    expect(await canvasSizedBorders()).toEqual([])
    expect(await page.locator('[data-presentation-id="htmp-reveal"]').count()).toBe(0)
  })

  it('draws the outer reveal frame around the whole diagram only at the last step', async () => {
    await atStep(8)
    expect(await canvasSizedBorders()).toEqual(['htmp-reveal'])
  })

  it('shows the dashed ghost card from step 5 as a card, not as a connector', async () => {
    await atStep(4)
    const styles = await page.evaluate(() => {
      const ghost = document.querySelector('[data-presentation-id="htmp-ghost"]')!
      const link = document.querySelector('[data-presentation-id="htmp-ghost-link"]')!
      return { card: getComputedStyle(ghost).borderTopStyle, link: getComputedStyle(link).borderTopStyle }
    })
    expect(styles).toEqual({ card: 'dashed', link: 'none' })
  })
})
