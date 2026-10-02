import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed (${code})`)))
})

let server
let browser
try {
  await run('npm', ['run', 'build'])
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const match = registry.match(/slug:\s*['"]([^'"]+)['"][^\n]*load:\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/)
  if (!match) throw new Error('Registered presentation check failed: no valid presentation route was found')
  const [, slug] = match
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch('http://127.0.0.1:4173/')).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('Render verification failed: preview did not become ready on 127.0.0.1:4173')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto(`http://127.0.0.1:4173/${slug}`)
  if (!response?.ok()) throw new Error(`Render verification failed: /${slug} returned ${response?.status()}`)
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!count) throw new Error(`Render verification failed: /${entry.slug} reported no steps`)
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(400)
    const actual = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`Render verification failed at step ${index}: observed index ${actual}`)
    if (errors.length) throw new Error(`Browser error at step ${index}: ${errors.join('; ')}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`PASS: built app and rendered ${count} step(s) at /${slug}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill('SIGTERM')
}
