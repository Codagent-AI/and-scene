import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { run, startPreview, stopPreview } from './preview.mjs'

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let preview
let browser
try {
  await run('npm', ['run', 'build'], project)
  preview = startPreview(project)
  const url = await preview.ready
  browser = await chromium.launch({ headless: true })
  const landing = await browser.newPage()
  await landing.goto(url)
  const routes = await landing.locator('main li a').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter(Boolean))
  await landing.close()
  if (!routes.length) throw new Error('render check: landing page has no registered presentation routes')

  for (const route of routes) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    try {
      await page.goto(new URL(route, url).href)
      try { await page.locator('[data-step-count]').waitFor({ timeout: 10000 }) } catch {
        throw new Error(`route ${route} did not mount a presentation${errors.length ? `: ${errors.join('; ')}` : ''}`)
      }
      const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error(`route ${route} reports invalid step count ${count}`)
      for (let index = 0; index < count; index++) {
        await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
        if (errors.length) throw new Error(`step ${index}: ${errors.join('; ')}`)
        if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(800) }
      }
      console.log(`PASS: rendered ${count} step(s) at ${route}`)
    } catch (error) {
      throw new Error(`render check failed for ${route}: ${error.message}`)
    } finally {
      await page.close()
    }
  }
  console.log(`PASS: build and rendered ${routes.length} registered presentation(s) on 127.0.0.1`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview) await stopPreview(preview)
}
