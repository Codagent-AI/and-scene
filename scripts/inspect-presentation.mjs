import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const args = process.argv.slice(3)
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
for (let index = 0; index < args.length; index += 2) {
  if (!['--url', '--settle'].includes(args[index]) || !args[index + 1] || args[index + 1].startsWith('--')) {
    console.error('Options are [--url <base-url>] [--settle <ms>]')
    process.exit(2)
  }
}
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run inspect -- <presentation-slug> [--url <base-url>] [--settle <ms>]')
  process.exit(2)
}
// Motion nodes enter with a 650 ms delay and 350 ms animation; this adds review time after motion settles.
const settleMs = Number(option('--settle', process.env.INSPECT_SETTLE_MS ?? '1400'))
if (!Number.isFinite(settleMs) || settleMs < 0) {
  console.error('--settle must be a non-negative number of milliseconds')
  process.exit(2)
}
const suppliedUrl = option('--url')
const baseUrl = suppliedUrl?.replace(/\/$/, '')
const outputDir = path.resolve('artifacts/presentation-inspection', slug)
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})
const reservePort = () => new Promise((resolve, reject) => {
  const server = createServer()
  server.once('error', reject)
  server.listen(0, '127.0.0.1', () => {
    const address = server.address()
    if (!address || typeof address === 'string') return reject(new Error('Could not reserve an IPv4 preview port'))
    server.close((error) => error ? reject(error) : resolve(address.port))
  })
})

let preview
let browser
try {
  if (!baseUrl) await run('npm', ['run', 'build'])
  await mkdir(outputDir, { recursive: true })
  let url = baseUrl
  if (!url) {
    const port = await reservePort()
    url = `http://127.0.0.1:${port}`
    let startupOutput = ''
    let startupError
    preview = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'ignore', 'pipe'] })
    preview.on('error', (error) => { startupError = error })
    preview.stderr.setEncoding('utf8').on('data', (chunk) => { startupOutput += chunk })
    for (let attempt = 0; attempt < 60; attempt++) {
      if (startupError || preview.exitCode !== null) throw new Error(`Preview failed to start: ${startupError?.message ?? startupOutput}`)
      try { if ((await fetch(url)).ok) break } catch {}
      if (attempt === 59) throw new Error(`Preview did not become ready at ${url}: ${startupOutput}`)
      await delay(250)
    }
  }

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto(`${url}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`/${slug} does not expose a positive data-step-count`)
  for (let index = 0; index < count; index++) {
    await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index, { timeout: 5000 })
    try {
      await page.waitForFunction(() => document.getAnimations().every((animation) => animation.effect?.getComputedTiming().iterations === Infinity || animation.playState === 'finished' || animation.playState === 'idle'), undefined, { timeout: 10000 })
    } catch {
      console.warn(`WARN step ${index + 1}/${count}: animations did not fully settle before the 10 second limit`)
    }
    await page.waitForTimeout(settleMs)
    const warnings = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.1
      }
      const allow = (element) => element.closest('[data-presentation-allow-overlap]') !== null
      const candidates = [...document.querySelectorAll('h1,h2,h3,p,a,button,[data-presentation-title],[data-presentation-attribution],[data-presentation-toc-item],[data-presentation-step]')]
        .filter((element) => visible(element) && (element.textContent?.trim() || element.matches('button')) && !allow(element))
      const overlaps = []
      for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i].getBoundingClientRect(), b = candidates[j].getBoundingClientRect()
        const area = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
        // Ignore incidental edge contact and sub-four-pixel intersections.
        if (area > 16 && !candidates[i].contains(candidates[j]) && !candidates[j].contains(candidates[i])) overlaps.push(`“${candidates[i].textContent.trim().slice(0, 36)}” / “${candidates[j].textContent.trim().slice(0, 36)}”`)
      }
      const diagnostics = []
      if (overlaps.length) diagnostics.push(`overlap: ${[...new Set(overlaps)].slice(0, 4).join('; ')}`)
      const compare = (selector) => {
        const controls = [...document.querySelectorAll(selector)].filter(visible)
        const active = controls.find((item) => item.getAttribute('data-presentation-active') === 'true')
        const inactive = controls.find((item) => item.getAttribute('data-presentation-active') === 'false')
        if (!active || !inactive) return
        const a = getComputedStyle(active), b = getComputedStyle(inactive)
        const distinct = a.color !== b.color || a.backgroundColor !== b.backgroundColor || a.borderColor !== b.borderColor || a.fontWeight !== b.fontWeight || active.getBoundingClientRect().width !== inactive.getBoundingClientRect().width
        if (!distinct) diagnostics.push(`active navigation: ${selector} active state resembles inactive state`)
      }
      compare('[data-presentation-step]')
      compare('[data-presentation-toc-item]')
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution || !visible(attribution)) diagnostics.push('attribution: missing or not visible; style [data-presentation-attribution]')
      else {
        const style = getComputedStyle(attribution)
        const link = attribution.querySelector('a')
        if (parseFloat(style.fontSize) < 12 || style.fontFamily.includes('Times') || (link && getComputedStyle(link).color === 'rgb(0, 0, 238)')) diagnostics.push('attribution: browser-default or undersized; style [data-presentation-attribution]')
      }
      return diagnostics
    })
    for (const warning of warnings) console.warn(`WARN step ${index + 1}/${count}: ${warning}`)
    await page.screenshot({ path: path.join(outputDir, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled steps at ${outputDir}`)
} catch (error) {
  console.error(`Inspection failed for /${slug}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null) { preview.kill('SIGTERM'); await delay(200) }
}
