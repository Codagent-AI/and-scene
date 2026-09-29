import { spawn, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) throw new Error(`Build failed: ${command} ${args.join(' ')}`)
}
let server
let browser
try {
  run('npm', ['run', 'build'])
  server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'ignore' })
  const url = 'http://127.0.0.1:4178/'
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Preview server exited before becoming ready')
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('Preview did not become ready at 127.0.0.1:4178')
  browser = await chromium.launch({ headless: true })
  const registry = await readFile(resolve('src/presentations/index.ts'), 'utf8')
  const routes = [...registry.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map(match => match[1])
  if (!routes.length) throw new Error('Render check failed: no registered presentations to verify')
  const page = await browser.newPage()
  for (const route of routes) {
    const errors = []
    page.removeAllListeners('pageerror')
    page.removeAllListeners('console')
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto(`${url}${route}`, { waitUntil: 'networkidle' })
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count') || 0)
    if (!count) throw new Error(`Render check failed for /${route}: no presentation steps were rendered`)
    for (let index = 0; index < count; index++) {
      const actual = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
      if (actual !== index) throw new Error(`Render failed for /${route} at step ${index}: active index is ${actual}`)
      if (errors.length) throw new Error(`Browser error for /${route} at step ${index}: ${errors.join('; ')}`)
      if (index + 1 < count) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
        } catch { throw new Error(`Step transition failed for /${route} at step ${index + 1}`) }
      }
    }
    console.log(`Rendered /${route} (${count} steps).`)
  }
  console.log('Verification passed.')
} catch (error) {
  console.error(`Verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await delay(100) }
}
