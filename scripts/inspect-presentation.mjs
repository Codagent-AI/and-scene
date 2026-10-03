import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { inspectWarnings } from './inspection-diagnostics.mjs'

const args = process.argv.slice(2)
const slug = args.find(argument => !argument.startsWith('--'))
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const viewportIndex = args.indexOf('--viewport')
if (viewportIndex >= 0 && (!args[viewportIndex + 1] || args[viewportIndex + 1].startsWith('--'))) throw new Error('missing viewport value; expected WIDTHxHEIGHT')
if (args.includes('--viewport=')) throw new Error('missing viewport value; expected WIDTHxHEIGHT')
const viewportArg = args.find(argument => argument.startsWith('--viewport='))?.slice('--viewport='.length)
  ?? (args.includes('--viewport') ? args[args.indexOf('--viewport') + 1] : undefined)
const viewport = args.includes('--narrow') ? { width: 390, height: 844 } : viewportArg ? (() => {
  const match = viewportArg.match(/^(\d+)x(\d+)$/i)
  if (!match) throw new Error(`invalid viewport "${viewportArg}"; expected WIDTHxHEIGHT`)
  return { width: Number(match[1]), height: Number(match[2]) }
})() : { width: 1440, height: 1000 }
if (!Number.isInteger(viewport.width) || !Number.isInteger(viewport.height) || viewport.width < 320 || viewport.height < 240) {
  throw new Error('viewport width must be at least 320px and height at least 240px')
}
const viewportName = viewport.width <= 760 ? 'narrow' : 'wide'
const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4179)
const preview = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
let previewOutput = ''
let previewError = ''
const stripAnsi = value => value.replace(/\x1b\[[0-9;]*m/g, '')
preview.stdout.setEncoding('utf8').on('data', chunk => { previewOutput += chunk })
preview.stderr.setEncoding('utf8').on('data', chunk => { previewError += chunk })
let browser
try {
  const url = `http://${host}:${port}/${encodeURIComponent(slug)}`
  let ready = false
  for (let i = 0; i < 80; i += 1) {
    if (preview.exitCode !== null) throw new Error(`vite preview exited before becoming ready${previewError ? `: ${previewError.trim()}` : ''}`)
    if (stripAnsi(previewOutput).includes(`${host}:${port}`)) {
      try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    }
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  const out = `artifacts/inspection/${slug}/${viewport.width}x${viewport.height}-${viewportName}`
  await mkdir(out, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(inspectWarnings)
    for (const warning of warnings) console.warn(`WARNING step ${index + 1}: ${warning}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled screenshots in ${out}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally { await browser?.close(); preview.kill('SIGTERM') }
