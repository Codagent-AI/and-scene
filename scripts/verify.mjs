import { spawn, spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (build.status !== 0) { console.error('FAIL: build'); process.exit(1) }
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore', detached: true })
let browser
let step = 0
try {
  let ready = false
  for (let i = 0; i < 100; i++) { try { if ((await fetch('http://127.0.0.1:4173/')).ok) { ready = true; break } } catch {} await new Promise(r => setTimeout(r, 100)) }
  if (!ready) throw Error('preview did not start')
  const config = JSON.parse(await readFile(new URL('./verify-config.json', import.meta.url), 'utf8'))
  if (!config.slug || !Array.isArray(config.steps) || !config.steps.length || config.steps.some(s => typeof s.title !== 'string' || typeof s.caption !== 'string' || typeof s.era !== 'string')) throw Error('invalid verification config')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`http://127.0.0.1:4173/${config.slug}`)
  const root = page.locator('[data-presentation]')
  await root.waitFor({ timeout: 5000 })
  const count = Number(await root.getAttribute('data-step-count'))
  if (count !== config.steps.length) throw Error(`expected ${config.steps.length} steps, found ${count}`)
  for (step = 0; step < count; step++) {
    if (Number(await root.getAttribute('data-step-index')) !== step) throw Error('step did not advance')
    if ((await root.getAttribute('data-step-era')) !== config.steps[step].era || (await page.locator('[data-presentation-footer] h1').textContent()) !== config.steps[step].title || (await page.locator('[data-presentation-footer] p').textContent()) !== config.steps[step].caption) throw Error('sample title or caption mismatch')
    await page.waitForTimeout(1000)
    if (errors.length) throw Error(errors.join('; '))
    if (step + 1 < count) await page.keyboard.press('ArrowRight')
  }
  console.log(`PASS: build and ${count}-step browser verification`)
} catch (e) { console.error(`FAIL: verification at step ${step}: ${e.message}`); process.exitCode = 1 }
finally { await browser?.close(); try { process.kill(-server.pid, 'SIGTERM') } catch {} }
