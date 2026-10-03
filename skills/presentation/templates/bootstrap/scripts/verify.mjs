import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4178)
const route = process.env.PRESENTATION_ROUTE ?? '/'
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (build.status !== 0) {
  console.error('FAIL: presentation verification build phase')
  process.exit(build.status ?? 1)
}
const preview = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
let currentStep = 1
try {
  const url = `http://${host}:${port}${route}`
  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (preview.exitCode !== null) throw new Error('vite preview exited before becoming ready')
    try { const response = await fetch(url); if (response.ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const presentation = await page.locator('[data-presentation]').count()
  if (route !== '/' && presentation !== 1) throw new Error(`route ${route} did not render a presentation`)
  const chrome = page.locator('[data-step-count]')
  if (await chrome.count()) {
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`invalid data-step-count: ${count}`)
    for (let stepNumber = 1; stepNumber <= count; stepNumber += 1) {
      currentStep = stepNumber
      const expectedIndex = stepNumber - 1
      const actualIndex = Number(await chrome.getAttribute('data-step-index'))
      if (actualIndex !== expectedIndex) throw new Error(`step ${currentStep}: expected data-step-index ${expectedIndex}, got ${actualIndex}`)
      if (await page.locator('[data-presentation-scene]').count() !== 1) throw new Error(`step ${currentStep}: expected exactly one active scene`)
      const progress = page.locator('[data-presentation-progress]')
      if (await progress.count()) {
        const active = page.locator('[data-presentation-progress][data-presentation-active="true"]')
        if (await active.count() !== 1 || await progress.nth(expectedIndex).getAttribute('data-presentation-active') !== 'true' || await progress.nth(expectedIndex).getAttribute('aria-current') !== 'step') {
          throw new Error(`step ${currentStep}: progress active-state hooks do not match the current index`)
        }
      }
      if (errors.length) throw new Error(`browser error at step ${currentStep}: ${errors.join('; ')}`)
      if (currentStep < count) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, expectedIndex + 1)
        } catch {
          throw new Error(`step ${currentStep + 1}: data-step-index did not advance`)
        }
        await page.waitForTimeout(700)
      }
    }
  } else if (route !== '/') {
    throw new Error(`route ${route} has no data-step-count hook`)
  }
  if (errors.length) throw new Error(`browser error at step ${currentStep}: ${errors.join('; ')}`)
  console.log(`PASS: build and browser route smoke check (${url})`)
} catch (error) {
  console.error(`FAIL: presentation verification at step ${currentStep}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
