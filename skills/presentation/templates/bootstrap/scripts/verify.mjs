import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const entries = [...registry.matchAll(/slug:\s*['\"]([^'\"]+)['\"]/g)].map((match) => match[1])

const slug = entries[0]
if (!slug) { console.error('FAIL: no presentation is registered; add one before running verify.'); process.exit(1) }
const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT || 4179)
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`http://${host}:${port}/${slug}`)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('production preview did not become ready')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://${host}:${port}/${slug}`)
  await page.locator('[data-presentation]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  for (let index = 0; index < count; index++) {
    await page.locator(`[data-step-index="${index}"]`).waitFor()
    if (errors.length) throw new Error(`browser error at step ${index + 1}: ${errors.join('; ')}`)
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`PASS: ${slug} rendered ${count} step(s) on ${host}`)
} catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1 }
finally { await browser?.close(); server.kill('SIGTERM') }
