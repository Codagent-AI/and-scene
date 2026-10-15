import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { validateSample, referenceOutline } from './sample-outline.mjs'

const root = path.resolve(process.env.AND_SCENE_ROOT || process.cwd())
const args = process.argv.slice(2)
const smokeIndex = args.indexOf('--smoke')
const smokeSlug = smokeIndex >= 0 ? args[smokeIndex + 1] : undefined
if (smokeIndex >= 0 && (!smokeSlug || smokeSlug.startsWith('--'))) throw new Error('Usage: verify.mjs [--smoke <registered-slug>]')
const slug = smokeSlug || process.env.AND_SCENE_SAMPLE_SLUG || 'how-to-make-a-presentation'
function fail(phase, message) { throw new Error(`[${phase}] ${message}`) }
async function run(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: options.stdio || 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code ?? signal}`)))
  })
}
async function renderRoute() {
  const require = createRequire(path.join(root, 'package.json'))
  const { chromium } = require('playwright')
  const port = await import('node:net').then(({ createServer }) => new Promise((resolve, reject) => {
    const server = createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const value = server.address().port; server.close(() => resolve(value)) })
  }))
  const url = `http://127.0.0.1:${port}`
  let preview, browser
  const errors = []
  try {
    preview = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' })
    for (let attempt = 0; attempt < 100; attempt++) {
      if (preview.exitCode !== null) fail('render', 'vite preview exited before readiness')
      try { if ((await fetch(`${url}/`)).ok) break } catch {}
      if (attempt === 99) fail('render', 'preview readiness timed out')
      await delay(100)
    }
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    page.on('console', (message) => { if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-presentation-chrome]')
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) fail('render', `route ${slug} has invalid step count ${count}`)
    if (!smokeSlug && count !== referenceOutline.length) fail('render', `expected ${referenceOutline.length} steps, found ${count}`)
    for (let index = 0; index < count; index++) {
      const actual = Number(await chrome.getAttribute('data-step-index'))
      if (actual !== index) fail('render', `step ${index + 1}: expected index ${index}, observed ${actual}`)
      if (!smokeSlug) {
        await page.locator('[data-presentation-mode-toggle]').click()
        const title = (await page.locator('[data-presentation-title]').textContent()).replace(/^\d+\s*\/\s*\d+\s*·\s*/, '').trim()
        if (title !== referenceOutline[index][1]) fail('render', `step ${index + 1}: expected title "${referenceOutline[index][1]}", got "${title}"`)
        await page.locator('[data-presentation-mode-toggle]').click()
        if ((await page.locator('[data-presentation-caption]').innerText()).trim() !== referenceOutline[index][2]) fail('render', `step ${index + 1}: caption mismatch`)
      }
      if (errors.length) fail('render', `step ${index + 1}: ${errors.shift()}`)
      if (index + 1 < count) {
        await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((next) => Number(document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index')) === next, index + 1, { timeout: 4000 }).catch((error) => fail('render', `step ${index + 2}: did not advance (${error.message.split('\n')[0]})`))
      }
    }
    if (errors.length) fail('render', errors[0])
  } finally {
    await browser?.close().catch(() => {})
    if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)]); if (preview.exitCode === null) preview.kill('SIGKILL') }
  }
}
try { console.log('[build] running npm run build'); await run('npm', ['run', 'build']); console.log('[build] PASS') }
catch (error) { console.error(`[build] FAIL: ${error.message}`); process.exitCode = 1 }
if (!process.exitCode) {
  try {
    if (smokeSlug) { const { validateRegistration } = await import('./sample-outline.mjs'); await validateRegistration(root, slug); console.log(`[route] registered smoke target ${slug}`) }
    else { await validateSample(root, slug); console.log('[sample] PASS (9 ordered steps)') }
  } catch (error) { console.error(`[sample] FAIL: ${error.message}`); process.exitCode = 1 }
}
if (!process.exitCode) {
  try { console.log('[render] checking production preview in Chromium'); await renderRoute(); console.log(`[render] PASS (${smokeSlug ? 'starter route smoke' : 'all steps'})`) }
  catch (error) { console.error(`[render] FAIL: ${error.message}`); process.exitCode = 1 }
}
if (process.exitCode) console.error('VERIFY FAIL')
else console.log('VERIFY PASS: build, route, render')
