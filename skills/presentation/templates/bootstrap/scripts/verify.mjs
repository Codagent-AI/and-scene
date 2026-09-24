import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error('vite preview exited before becoming ready')
    try { ready = (await fetch('http://127.0.0.1:4178/')).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('vite preview did not become ready at 127.0.0.1:4178')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  const base = 'http://127.0.0.1:4178'
  await page.goto(base, { waitUntil: 'networkidle' })
  const routes = await page.locator('[data-presentation-landing] a[data-presentation-link]').evaluateAll((links) => links.map((link) => link.href))
  if (!routes.length) throw new Error('No registered presentation routes were found on the landing page')

  for (const route of routes) {
    errors.length = 0
    await page.goto(route, { waitUntil: 'networkidle' })
    const state = page.locator('[data-step-count]').first()
    await state.waitFor({ state: 'attached', timeout: 10000 }).catch(() => { throw new Error(`No presentation rendered at ${route}`) })
    const count = Number(await state.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`No steps rendered at ${route}`)
    if (await page.locator('[data-presentation-mode="present"]').count()) {
      await page.getByRole('button', { name: 'Switch to browse mode' }).click()
    }

    for (let index = 0; index < count; index++) {
      const current = Number(await state.getAttribute('data-step-index'))
      if (current !== index) throw new Error(`Step ${index} did not render at ${route}; found index ${current}`)
      const caption = await page.locator('.presentation-narration p').textContent()
      if (!caption?.trim()) throw new Error(`Step ${index} has no caption at ${route}`)
      if (index < count - 1) {
        await page.getByRole('button', { name: 'Next step' }).click()
        await page.waitForFunction((expected) => Number(document.querySelector('[data-step-count]')?.getAttribute('data-step-index')) === expected, index + 1)
      }
    }
    if (errors.length) throw new Error(`Browser errors at ${route}: ${errors.join('; ')}`)
    console.log(`PASS: ${route} rendered ${count} step${count === 1 ? '' : 's'} without browser errors`)
  }
} catch (error) {
  console.error(`FAIL: browser render verification: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  child.kill('SIGTERM')
}
