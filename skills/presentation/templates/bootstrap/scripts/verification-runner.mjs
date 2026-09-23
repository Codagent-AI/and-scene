import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { parseActiveStepIndex } from './active-step-index.mjs'

export async function runRenderVerification({ route, expectedSteps, root = process.cwd(), port = Number(process.env.PORT || 4178) }) {
  const host = '127.0.0.1'
  const server = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
  let browser
  const stopPreview = async () => {
    if (server.exitCode !== null || server.signalCode !== null) return
    const exited = once(server, 'exit')
    server.kill('SIGTERM')
    await exited
  }
  try {
    const url = `http://${host}:${port}${route}`
    let ready = false
    for (let attempt = 0; attempt < 80; attempt++) {
      if (server.exitCode !== null) throw new Error(`preview exited with ${server.exitCode}`)
      try {
        if ((await fetch(url)).ok) {
          await delay(100)
          if (server.exitCode !== null) throw new Error(`preview exited with ${server.exitCode}`)
          ready = true
          break
        }
      } catch (error) {
        if (error.message.startsWith('preview exited')) throw error
      }
      await delay(250)
    }
    if (!ready) throw new Error(`preview did not become ready at ${url}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    let currentStep = 1
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(url, { waitUntil: 'networkidle' })
    const presentation = page.locator('[data-step-count]')
    await presentation.waitFor({ timeout: 5000 }).catch(() => { throw new Error('step 1: route did not expose data-step-count') })
    const count = Number(await presentation.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`step 1: expected a positive step count, found ${count}`)
    if (expectedSteps !== undefined && count !== expectedSteps) throw new Error(`step 1: expected ${expectedSteps} steps, found ${count}`)
    for (currentStep = 1; currentStep <= count; currentStep++) {
      await page.waitForTimeout(1050)
      if (errors.length) throw new Error(`step ${currentStep}: ${errors.join('; ')}`)
      const index = parseActiveStepIndex(await presentation.getAttribute('data-step-index'), currentStep)
      if (index !== currentStep - 1) throw new Error(`step ${currentStep}: expected data-step-index=${currentStep - 1}, found ${index}`)
      if (currentStep < count) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, currentStep, { timeout: 5000 }).catch(() => { throw new Error(`step ${currentStep + 1}: expected data-step-index=${currentStep}, transition timed out`) })
      }
    }
    if (errors.length) throw new Error(`step ${currentStep}: ${errors.join('; ')}`)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  } finally {
    try { await browser?.close() } finally { await stopPreview() }
  }
}
