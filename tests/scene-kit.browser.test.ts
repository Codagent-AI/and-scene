// @vitest-environment node
import { mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { preview } from 'vite'
import type { PreviewServer } from 'vite'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { afterAll, beforeAll, expect, it } from 'vitest'

let server: PreviewServer
let browser: Browser
let page: Page
const errors: string[] = []
const url = 'http://127.0.0.1:4187/tests/fixtures/scene-kit/index.html'

beforeAll(async () => {
  // Build in a subprocess so Vitest's NODE_ENV=test cannot select React's dev runtime.
  await promisify(execFile)(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'tests/browser.vite.config.ts'], { env: { ...process.env, NODE_ENV: 'production' } })
  server = await preview({ configFile: 'tests/browser.vite.config.ts', preview: { host: '127.0.0.1', port: 4187, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await mkdir('.artifacts/scene-kit', { recursive: true })
}, 120000)

afterAll(async () => {
  await browser?.close()
  if (server) await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
})

async function index() { return Number(await page.locator('[data-presentation-chrome]').getAttribute('data-step-index')) }
async function settle() { await page.waitForTimeout(950) }

it('morphs continuing entities, delays newcomers, removes departures, and preserves grouped instances', async () => {
  await page.goto(url)
  await settle()
  const anchor = page.getByTestId('anchor')
  const handle = await anchor.elementHandle()
  const instance = await page.locator('[data-scene-instance]').getAttribute('data-scene-instance')
  // Sample on browser frames: IPC latency must not turn a mid-morph probe into
  // a settled-state probe on a loaded runner. Navigation is exercised below.
  const motion = await page.evaluate(async () => {
    const anchor = document.querySelector('[data-testid="anchor"]')!
    const before = anchor.getBoundingClientRect().x
    const positions: number[] = [], opacities: number[] = []
    let firstVisibleX: number | null = null
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    const start = performance.now()
    await new Promise<void>(resolve => {
      function sample() {
        positions.push(anchor.getBoundingClientRect().x)
        const newcomer = document.querySelector('[data-testid="new"]')
        if (newcomer) {
          const opacity = Number(getComputedStyle(newcomer).opacity)
          opacities.push(opacity)
          if (opacity > 0.05 && firstVisibleX === null) firstVisibleX = anchor.getBoundingClientRect().x
        }
        if (performance.now() - start >= 950) resolve()
        else requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    return { before, after: anchor.getBoundingClientRect().x, positions, opacities, firstVisibleX }
  })
  await expect.poll(index).toBe(1)
  expect(await page.locator('[data-scene-instance]').getAttribute('data-scene-instance')).toBe(instance)
  expect(await anchor.evaluate((element, prior) => element === prior, handle)).toBe(true)
  expect(Math.min(...motion.opacities)).toBeLessThan(0.1)
  expect(motion.firstVisibleX).not.toBeNull()
  // Allow up to 5 px of final projection jitter; early entry during the 220 px
  // morph still fails, without requiring a subpixel-perfect sampled frame.
  expect(Math.abs(motion.firstVisibleX! - motion.after)).toBeLessThanOrEqual(5)
  expect(motion.after).toBeGreaterThan(motion.before)
  expect(motion.positions.some(x => x > motion.before + 1 && x < motion.after - 1)).toBe(true)
  expect(await page.getByTestId('new').evaluate(element => Number(getComputedStyle(element).opacity))).toBe(1)
  expect(await page.getByTestId('depart').count()).toBe(0)
  expect(await anchor.evaluate(element => Number(getComputedStyle(element).opacity))).toBe(1)
  expect(errors).toEqual([])
})

it('supports keyboard, controls, era jumps, focus protection, swipes, modes, and boundaries in Chromium', async () => {
  await page.goto(url); await settle()
  await page.evaluate(() => {
    const widget = document.createElement('div')
    widget.id = 'custom-widget'
    widget.setAttribute('role', 'listbox')
    widget.tabIndex = 0
    document.querySelector('[data-presentation-chrome]')!.appendChild(widget)
    widget.focus()
  })
  await page.keyboard.press('p'); await page.keyboard.press('Space')
  expect(await index()).toBe(0)
  expect(await page.locator('[data-presentation-chrome]').getAttribute('data-presentation-mode')).toBe('browse')
  await page.evaluate(() => document.getElementById('custom-widget')!.remove())
  await page.keyboard.press('ArrowLeft'); expect(await index()).toBe(0)
  await page.keyboard.press('Space'); expect(await index()).toBe(1)
  await page.keyboard.press('PageDown'); expect(await index()).toBe(2)
  await page.keyboard.press('p')
  expect(await index()).toBe(2)
  expect(await page.locator('[data-presentation-caption]').count()).toBe(0)
  await page.keyboard.press('p')
  await page.getByRole('button', { name: 'the idea', exact: true }).click(); expect(await index()).toBe(0)
  await page.getByRole('button', { name: 'Next step', exact: true }).focus()
  await page.keyboard.press('ArrowRight'); expect(await index()).toBe(0)
  await page.keyboard.press('Space'); expect(await index()).toBe(1)
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.evaluate(() => {
    const root = document.querySelector('[data-presentation-chrome]')!
    const start = new Touch({ identifier: 1, target: root, clientX: 200, clientY: 250 })
    const end = new Touch({ identifier: 1, target: root, clientX: 100, clientY: 255 })
    root.dispatchEvent(new TouchEvent('touchstart', { touches: [start], bubbles: true }))
    root.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], bubbles: true }))
  })
  expect(await index()).toBe(2)
  await page.keyboard.press('PageUp'); expect(await index()).toBe(1)
  await page.keyboard.press('ArrowRight'); await settle()
  const morph = await page.evaluate(async () => {
    const previous = document.querySelector('[data-testid="anchor"]')!.getBoundingClientRect().height
    const heights: number[] = []
    document.querySelector<HTMLButtonElement>('[aria-label="Go to step 4: Carry the idea through"]')!.click()
    const start = performance.now()
    await new Promise<void>(resolve => {
      function sample() {
        const anchors = document.querySelectorAll('[data-testid="anchor"]')
        heights.push(anchors[anchors.length - 1].getBoundingClientRect().height)
        if (performance.now() - start >= 950) resolve()
        else requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    return { previous, heights }
  })
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.press('ArrowRight'); expect(await index()).toBe(3)
  await settle()
  const final = (await page.getByTestId('anchor').boundingBox())!
  expect(final.height).toBeGreaterThan(morph.previous)
  expect(morph.heights.some(height => height > morph.previous + 0.1 && height < final.height - 0.1)).toBe(true)
  expect(await page.locator('[data-scene-instance]').getAttribute('data-scene-instance')).toBe('closing')
  expect(errors).toEqual([])
})

it('captures all settled steps at desktop and narrow sizes and checks canvas/chrome separation', async () => {
  for (const [name, width, height] of [['desktop', 1440, 900], ['narrow', 390, 844]] as const) {
    await page.setViewportSize({ width, height })
    await page.goto(url); await settle()
    expect(await page.locator('[data-presentation-toc]').count()).toBe(name === 'desktop' ? 1 : 0)
    for (let i = 0; i < 4; i++) {
      expect(await index()).toBe(i)
      await settle()
      const stage = (await page.locator('[data-presentation-stage]').boundingBox())!
      const title = (await page.locator('[data-presentation-title]').boundingBox())!
      const caption = (await page.locator('[data-presentation-caption]').boundingBox())!
      expect(stage.x).toBeGreaterThanOrEqual(0)
      expect(stage.x + stage.width).toBeLessThanOrEqual(width)
      expect(stage.y).toBeGreaterThan(title.y + title.height)
      expect(stage.y + stage.height).toBeLessThan(caption.y)
      expect(stage.width / stage.height).toBeCloseTo(880 / 380, 3)
      expect(await page.locator('[aria-current="step"][data-presentation-active="true"]').count()).toBe(1)
      await page.screenshot({ path: `.artifacts/scene-kit/${name}-step-${i + 1}.png` })
      await page.keyboard.press('ArrowRight')
    }
  }
  expect(errors).toEqual([])
}, 120000)


it('contains render and chunk-load failures with a usable recovery link at both viewport sizes', async () => {
  for (const failure of ['render', 'chunk']) {
    const failedPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const uncaught: string[] = []
    failedPage.on('pageerror', error => uncaught.push(error.message))
    try {
      let blocked = false
      if (failure === 'chunk') await failedPage.route('**/Talk-*.js', route => { blocked = true; return route.abort('failed') })
      await failedPage.goto(`${url}${failure === 'render' ? '?empty' : ''}`)
      await failedPage.getByRole('alert').waitFor()
      expect(await failedPage.getByRole('alert').textContent()).toContain('Unable to open this presentation')
      if (failure === 'chunk') expect(blocked).toBe(true)
      const back = failedPage.getByRole('link', { name: 'Back to presentations' })
      expect(await back.getAttribute('href')).toBe('/')
      for (const [name, width, height] of [['desktop', 1440, 900], ['narrow', 390, 844]] as const) {
        await failedPage.setViewportSize({ width, height })
        const bounds = (await back.boundingBox())!
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(height)
        await failedPage.screenshot({ path: `.artifacts/scene-kit/${failure}-error-${name}.png` })
      }
      expect(uncaught).toEqual([])
    } finally { await failedPage.close() }
  }
}, 60000)
