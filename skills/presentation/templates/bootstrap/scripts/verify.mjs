import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { registeredSlugs, startPreview } from './preview-utils.mjs'

const registryPath = new URL('../src/presentations/index.ts', import.meta.url)
const slugs = await registeredSlugs(registryPath)
if (!slugs.length) {
  console.error('FAIL: no presentation is registered; add one before running verify.')
  process.exit(1)
}

let previewServer
let browser
try {
  previewServer = await startPreview()
  browser = await chromium.launch({ headless: true })
  for (const slug of slugs) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      const response = await page.goto(`http://${previewServer.host}:${previewServer.port}/${slug}`)
      if (!response?.ok()) throw new Error(`route returned HTTP ${response?.status() ?? 'no response'}`)
      await page.locator('[data-presentation]').waitFor()
      const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error('presentation reports no steps')
      for (let index = 0; index < count; index++) {
        await page.waitForFunction((expected) => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(expected), index)
        await delay(100)
        if (errors.length) throw new Error(`browser error at step ${index + 1}: ${errors.join('; ')}`)
        if (index < count - 1) await page.keyboard.press('ArrowRight')
      }
      console.log(`PASS: ${slug} rendered ${count} step(s) on ${previewServer.host}`)
    } catch (error) {
      throw new Error(`${slug}: ${error.message}`)
    } finally {
      await page.close()
    }
  }
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  try { await browser?.close() } catch (error) { console.warn(`Browser cleanup failed: ${error.message}`) }
  try { await previewServer?.close() } catch (error) { console.warn(`Preview cleanup failed: ${error.message}`) }
}
