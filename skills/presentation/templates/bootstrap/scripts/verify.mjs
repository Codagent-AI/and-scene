import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = Number(process.env.PORT || 4173)
const route = process.env.PRESENTATION_ROUTE
const origin = `http://${host}:${port}`
const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)))
})

let preview
let browser
try {
  await run('npm', ['run', 'build'])
  preview = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit' })
  let ready = false
  for (let i = 0; i < 80; i++) {
    if (preview.exitCode !== null) throw new Error('vite preview exited before becoming ready')
    try { const response = await fetch(origin); if (response.ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${origin}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  const checked = []
  const check = async (pathname) => {
    errors.length = 0
    await page.goto(new URL(pathname, origin).href, { waitUntil: 'networkidle' })
    await page.locator(pathname === '/' ? '[data-presentation-landing]' : '[data-presentation-stage]').first().waitFor({ state: 'visible' })
    if (errors.length) throw new Error(`browser errors on ${pathname}: ${errors.join('; ')}`)
    checked.push(pathname)
  }
  if (route) await check(new URL(route, origin).pathname)
  else {
    // Without an explicit route, check the landing page and every presentation it registers.
    await check('/')
    const registered = await page.locator('[data-presentation-landing] a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    for (const pathname of registered) await check(pathname)
  }
  console.log(`PASS: build and browser render ${origin}: ${checked.join(', ')}`)
} catch (error) {
  console.error(`VERIFY FAILED: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)]) }
}
