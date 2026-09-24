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
  await page.goto('http://127.0.0.1:4178/example', { waitUntil: 'networkidle' })
  const state = page.locator('[data-step-count]')
  if (await state.getAttribute('data-step-count') !== '2') throw new Error('example route did not render two steps')
  for (let index = 0; index < 2; index++) {
    if (Number(await state.getAttribute('data-step-index')) !== index) throw new Error(`step ${index} did not render`)
    if (!(await page.locator('[data-presentation-narration], .presentation-narration').count())) throw new Error(`step ${index} has no caption region`)
    if (index === 0) await page.getByRole('button', { name: 'Next step' }).click()
  }
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
  console.log('PASS: example route rendered both steps without browser errors')
} catch (error) {
  console.error(`FAIL: browser render verification: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  child.kill('SIGTERM')
}
