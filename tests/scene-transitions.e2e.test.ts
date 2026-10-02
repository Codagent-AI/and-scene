import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

const freePort = () => new Promise<number>((resolve) => {
  const server = createServer().listen(0, '127.0.0.1', () => {
    const { port } = server.address() as { port: number }
    server.close(() => resolve(port))
  })
})

describe('reference presentation transitions in a production browser', () => {
  let outDir = ''
  let preview: ChildProcess
  let browser: Browser
  let base = ''

  beforeAll(async () => {
    outDir = mkdtempSync(join(tmpdir(), 'and-scene-transitions-'))
    execFileSync(process.execPath, [vite, 'build', '--outDir', outDir, '--emptyOutDir'], { stdio: 'inherit' })
    const port = await freePort()
    base = `http://127.0.0.1:${port}/how-to-make-a-presentation`
    preview = spawn(process.execPath, [vite, 'preview', '--outDir', outDir, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'inherit' })
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await fetch(base).then((response) => response.ok, () => false)) break
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    browser = await chromium.launch({ headless: true })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    preview?.kill()
    await new Promise((resolve) => (preview && preview.exitCode === null ? preview.once('exit', resolve) : resolve(undefined)))
    rmSync(outDir, { recursive: true, force: true })
  })

  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    await page.goto(base)
    await page.waitForSelector('[data-step-index="0"]')
    return page
  }
  const stepIndex = (page: Awaited<ReturnType<typeof open>>) => page.locator('[data-step-index]').first().getAttribute('data-step-index')

  it('fades a newcomer in after continuing entities start moving and fades a departing entity out', async () => {
    const page = await open()
    const opacity = (selector: string) => page.evaluate((s) => { const el = document.querySelector(s); return el ? Number(getComputedStyle(el).opacity) : null }, selector)
    await page.keyboard.press('ArrowRight')
    await page.waitForSelector('[data-step-index="1"]')
    expect(await opacity('.person.skill')).toBeLessThan(0.5)
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.person.skill')!).opacity) === 1)
    for (let step = 2; step <= 7; step++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForSelector(`[data-step-index="${step}"]`)
    }
    await page.waitForTimeout(1200)
    expect(await opacity('[data-entity-id="how-to.scene-caption"]')).toBe(1)
    await page.keyboard.press('ArrowRight')
    await page.waitForSelector('[data-step-index="8"]')
    expect(await page.locator('[data-entity-id="how-to.scene-caption"]').count()).toBe(1)
    await page.waitForSelector('[data-entity-id="how-to.scene-caption"]', { state: 'detached' })
    await page.close()
  }, 60_000)

  it('leaves presentation-owned opacity intact once an entrance settles', async () => {
    const page = await open()
    for (let step = 1; step <= 4; step++) await page.keyboard.press('ArrowRight')
    await page.waitForSelector('.ghost-card')
    await page.waitForTimeout(1500)
    expect(await page.locator('.ghost-card').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.72')
    await page.close()
  }, 30_000)

  it('does not advance the deck when a focused progress control receives navigation keys', async () => {
    const page = await open()
    await page.locator('[data-presentation-progress-item]').nth(4).click()
    await page.waitForSelector('[data-step-index="4"]')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(150)
    expect(await stepIndex(page)).toBe('4')
    await page.close()
  }, 30_000)
})
