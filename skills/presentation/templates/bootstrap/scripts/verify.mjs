import { spawn, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) throw new Error(`Build check failed: ${command} ${args.join(' ')} exited ${result.status ?? result.error}`)
}
let server
let browser
try {
  run('npm', ['run', 'build'])
  const registry = await readFile(resolve('src/presentations/index.ts'), 'utf8')
  const routes = [...registry.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map(match => match[1])
  if (!routes.length) throw new Error('Render check failed: no registered presentations to verify')
  const port = Number(process.env.AND_SCENE_VERIFY_PORT || 4178)
  const origin = `http://127.0.0.1:${port}`
  server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error('Render check failed: preview server exited before becoming ready')
    try { if ((await fetch(`${origin}/`)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Render check failed: preview readiness probe failed at ${origin}`)
  browser = process.env.PLAYWRIGHT_CDP_ENDPOINT
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_ENDPOINT)
    : await chromium.launch({ headless: true })
  for (const route of routes) {
    const page = await browser.newPage()
    const errors = []
    let activeIndex = 0
    page.on('pageerror', error => errors.push({ step: activeIndex, message: error.message }))
    page.on('console', message => { if (message.type() === 'error') errors.push({ step: activeIndex, message: message.text() }) })
    const response = await page.goto(`${origin}/${route}`, { waitUntil: 'networkidle' })
    if (!response?.ok()) throw new Error(`Render check failed for /${route}: route returned ${response?.status()}`)
    if (errors.length) throw new Error(`Browser error on /${route} at step 1: ${errors.map(error => error.message).join('; ')}`)
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!count) throw new Error(`Render check failed for /${route}: no presentation steps rendered`)
    for (let index = 0; index < count; index++) {
      activeIndex = index
      const actual = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
      if (actual !== index) throw new Error(`Render check failed for /${route} at step ${index + 1}: active index is ${actual}`)
      if (errors.length) throw new Error(`Browser error on /${route} at step ${index + 1}: ${errors.map(error => error.message).join('; ')}`)
      if (index + 1 < count) {
        activeIndex = index + 1
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(expectedIndex => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expectedIndex, index + 1, { timeout: 3000 })
        } catch {
          if (errors.length) throw new Error(`Browser error on /${route} at step ${index + 2}: ${errors.map(error => error.message).join('; ')}`)
          throw new Error(`Step transition failed for /${route} at step ${index + 2}: data-step-index did not advance`)
        }
      }
    }
    if (errors.length) throw new Error(`Browser error on /${route} at step ${activeIndex + 1}: ${errors.map(error => error.message).join('; ')}`)
    console.log(`Rendered /${route} (${count} steps).`)
    await page.close()
  }
  console.log(`Verification passed: all ${routes.length} registered presentations rendered on ${origin}.`)
} catch (error) {
  console.error(`Verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await delay(150) }
}
