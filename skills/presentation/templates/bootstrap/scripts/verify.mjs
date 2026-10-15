import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { validateSample, referenceOutline } from './sample-outline.mjs'

const root = path.resolve(process.env.AND_SCENE_ROOT || process.cwd())
const slug = process.env.AND_SCENE_SAMPLE_SLUG || 'how-to-make-a-presentation'
function fail(phase, message) { throw new Error(`[${phase}] ${message}`) }
async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: options.stdio || 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code ?? signal}`)))
  })
}

async function renderSample() {
  const require = createRequire(path.join(root, 'package.json'))
  const { chromium } = require('playwright')
  const portServer = await import('node:net').then(({ createServer }) => new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)) })
  }))
  const url = `http://127.0.0.1:${portServer}`
  let preview
  let browser
  let interrupt
  let currentStep = 0
  const errors = []
  try {
    preview = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(portServer), '--strictPort'], { cwd: root, stdio: 'ignore' })
    interrupt = async () => {
      preview?.kill('SIGTERM')
      await browser?.close().catch(() => {})
      process.exit(130)
    }
    process.once('SIGINT', interrupt)
    process.once('SIGTERM', interrupt)
    for (let attempt = 0; attempt < 100; attempt++) {
      if (preview.exitCode !== null) fail('render', 'vite preview exited before readiness')
      try { const response = await fetch(`${url}/`); if (response.ok) break } catch {}
      if (attempt === 99) fail('render', 'preview readiness timed out')
      await delay(100)
    }
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      if (/favicon/i.test(message.text()) || /favicon/i.test(message.location().url || '')) return
      errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-presentation-chrome]')
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count !== referenceOutline.length) fail('render', `expected ${referenceOutline.length} steps, found ${count}`)
    for (currentStep = 0; currentStep < count; currentStep++) {
      await chrome.waitFor({ state: 'visible' })
      const actual = Number(await chrome.getAttribute('data-step-index'))
      if (actual !== currentStep) fail('render', `step ${currentStep + 1}: expected index ${currentStep}, observed ${actual}`)
      await page.locator('[data-presentation-mode-toggle]').click()
      const visibleTitle = (await page.locator('[data-presentation-title]').textContent()).replace(/^\d+\s*\/\s*\d+\s*·\s*/, '').trim()
      if (visibleTitle !== referenceOutline[currentStep][1]) fail('render', `step ${currentStep + 1}: expected visible title "${referenceOutline[currentStep][1]}", observed "${visibleTitle}"`)
      await page.locator('[data-presentation-mode-toggle]').click()
      const visibleCaption = (await page.locator('[data-presentation-caption]').innerText()).trim()
      if (visibleCaption !== referenceOutline[currentStep][2]) fail('render', `step ${currentStep + 1}: expected visible caption "${referenceOutline[currentStep][2]}", observed "${visibleCaption}"`)
      if (errors.length) fail('render', `step ${currentStep + 1}: ${errors.shift()}`)
      if (currentStep + 1 < count) {
        await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((next) => Number(document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index')) === next, currentStep + 1, { timeout: 4000 }).catch((error) => fail('render', `step ${currentStep + 2}: ArrowRight did not advance (${error.message.split('\n')[0]})`))
      }
    }
    if (errors.length) fail('render', `step ${count}: ${errors[0]}`)
  } finally {
    if (interrupt) {
      process.removeListener('SIGINT', interrupt)
      process.removeListener('SIGTERM', interrupt)
    }
    await browser?.close().catch(() => {})
    if (preview && preview.exitCode === null) {
      preview.kill('SIGTERM')
      await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)] )
      if (preview.exitCode === null) preview.kill('SIGKILL')
    }
  }
}

try {
  console.log('[build] running npm run build')
  await run('npm', ['run', 'build'])
  console.log('[build] PASS')
} catch (error) { console.error(`[build] FAIL: ${error.message}`); process.exitCode = 1 }
if (!process.exitCode) {
  try { console.log('[sample] validating reference outline'); await validateSample(root, slug); console.log('[sample] PASS (9 ordered steps)') }
  catch (error) { console.error(`[sample] FAIL: ${error.message}`); process.exitCode = 1 }
}
if (!process.exitCode) {
  try { console.log('[render] checking production preview in Chromium'); await renderSample(); console.log('[render] PASS (all steps)') }
  catch (error) { console.error(`[render] FAIL: ${error.message}`); process.exitCode = 1 }
}
if (process.exitCode) console.error('VERIFY FAIL')
else console.log('VERIFY PASS: build, sample, render')
