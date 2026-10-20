// The reference presentation keeps its navigation reachable on a phone-sized viewport.
import { chromium } from 'playwright'
import { beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, run } from './helpers.ts'
import { SAMPLE_SLUG, previewUrl, withPreview } from '../../scripts/verify.mjs'

const VIEWPORT = { width: 390, height: 844 }
let root = ''

beforeAll(() => {
  root = copyRepo()
  const built = run('npm', ['run', 'build'], root)
  expect(built.status, built.output).toBe(0)
})

describe('narrow browse layout', () => {
  it('keeps Previous, every progress dot, Next, and the mode toggle inside the viewport on every step', async () => {
    const browser = await chromium.launch()
    try {
      await withPreview(root, async (port: number) => {
        const page = await browser.newPage({ viewport: VIEWPORT })
        await page.goto(previewUrl(port, `/${SAMPLE_SLUG}`))
        const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
        for (let step = 0; step < count; step++) {
          await page.waitForTimeout(900)
          const boxes = await page.$$eval('[data-presentation-footer] button', (els) =>
            els.map((el) => {
              const r = el.getBoundingClientRect()
              return { name: el.getAttribute('aria-label') ?? el.textContent, left: r.left, right: r.right }
            }),
          )
          for (const required of ['Previous step', 'Next step', 'Present']) {
            expect(boxes.some((b) => b.name === required), `step ${step + 1}: ${required} is rendered`).toBe(true)
          }
          expect(boxes.filter((b) => b.name?.startsWith('Step ')), `step ${step + 1}: progress dots`).toHaveLength(count)
          for (const b of boxes) {
            expect(b.left, `step ${step + 1}: ${b.name}`).toBeGreaterThanOrEqual(0)
            expect(b.right, `step ${step + 1}: ${b.name}`).toBeLessThanOrEqual(VIEWPORT.width)
          }
          await page.keyboard.press('ArrowRight')
        }
        await page.close()
      })
    } finally {
      await browser.close()
    }
  })
})
