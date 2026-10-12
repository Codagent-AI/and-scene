import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser } from 'playwright'
import { freePort, waitReady } from './verify.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let server: ChildProcess, browser: Browser, base: string

beforeAll(async () => {
  const port = await freePort()
  base = `http://127.0.0.1:${port}`
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
  await waitReady(`${base}/`, server)
  browser = await chromium.launch()
}, 60_000)
afterAll(async () => { await browser?.close(); server?.kill('SIGTERM') })

describe('reference sample entrance motion in a real browser', () => {
  it('fades a newly introduced step card in after navigating forward, sampled from the click itself', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${base}/how-to-make-a-presentation`)
    await page.waitForSelector('[data-step-count]')
    await page.click('button[aria-label^="Go to step 2"]')
    await page.waitForSelector('[data-step-index="1"]')
    await page.waitForTimeout(1500)
    const samples = await page.evaluate(() => new Promise<{ t: number; opacity: number; animations: number }[]>((resolve) => {
      const out: { t: number; opacity: number; animations: number }[] = []
      const t0 = performance.now()
      ;(document.querySelector('button[aria-label="Next step"]') as HTMLElement).click()
      const frame = () => {
        const wrapper = document.querySelector('.step-card')?.closest('[data-presentation-appear]')
        if (wrapper) out.push({ t: performance.now() - t0, opacity: Number(getComputedStyle(wrapper).opacity), animations: document.getAnimations().length })
        if (performance.now() - t0 < 1400) requestAnimationFrame(frame); else resolve(out)
      }
      requestAnimationFrame(frame)
    }))
    expect(samples.length).toBeGreaterThan(10)
    expect(samples[0]!.opacity).toBeLessThan(0.1)
    expect(samples.some((s) => s.animations > 0)).toBe(true)
    expect(samples.some((s) => s.opacity > 0.1 && s.opacity < 0.9)).toBe(true)
    expect(samples.at(-1)!.opacity).toBe(1)
    await page.close()
  }, 30_000)
})
