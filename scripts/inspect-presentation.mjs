import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import process from 'node:process'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export function parseArgs(args) {
  const options = { out: '.presentation-inspection', settle: 1200, width: 1440, height: 900, skipBuild: false }
  let slug
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--skip-build') options.skipBuild = true
    else if (['--out', '--settle', '--width', '--height'].includes(arg)) {
      const value = args[++i]
      if (!value) throw new Error(`Missing value for ${arg}`)
      const key = { '--out': 'out', '--settle': 'settle', '--width': 'width', '--height': 'height' }[arg]
      options[key] = key === 'out' ? value : Number(value)
      if (key !== 'out' && (!Number.isFinite(options[key]) || options[key] <= 0)) throw new Error(`${arg} must be a positive number`)
    } else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
    else if (!slug) slug = arg
    else throw new Error(`Unexpected argument: ${arg}`)
  }
  if (!slug) throw new Error('Usage: npm run inspect -- <slug> [--out dir] [--settle ms] [--width W --height H] [--skip-build]')
  return { ...options, slug }
}

export function inspectPage() {
  const visible = element => {
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const description = element => {
    const selector = element.getAttribute('data-presentation-title') ? '[data-presentation-title]' : element.tagName.toLowerCase()
    const text = (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48)
    return `${selector}${text ? ` “${text}”` : ''}`
  }
  const allowed = (a, b) => Boolean(a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]'))
  const candidates = [...document.querySelectorAll('body *')].filter(element => visible(element) && ((element.children.length === 0 && (element.innerText || element.textContent || '').trim()) || element.matches('[data-presentation-header], [data-presentation-footer], [data-presentation-caption], [data-presentation-title], [data-presentation-progress], [data-presentation-toc], [data-presentation-attribution], [data-presentation-nav]')))
  const overlap = []
  for (let i = 0; i < candidates.length; i += 1) for (let j = i + 1; j < candidates.length; j += 1) {
    const a = candidates[i]; const b = candidates[j]
    if (a.contains(b) || b.contains(a) || allowed(a, b)) continue
    const x = a.getBoundingClientRect(); const y = b.getBoundingClientRect()
    if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) overlap.push([description(a), description(b)])
  }
  const sameStyle = (a, b) => {
    const keys = ['color', 'backgroundColor', 'borderColor', 'opacity', 'fontWeight', 'boxShadow', 'width', 'height', 'transform']
    const left = getComputedStyle(a); const right = getComputedStyle(b)
    return keys.every(key => left[key] === right[key])
  }
  const activeWarnings = []
  for (const active of document.querySelectorAll('[data-active="true"], [aria-current]:not([aria-current="false"])')) {
    const parent = active.parentElement
    const siblings = [...(parent?.children || [])].filter(item => item !== active && visible(item))
    if (siblings.some(item => sameStyle(active, item))) activeWarnings.push(description(active))
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  let attributionWarning = null
  if (!attribution) attributionWarning = 'missing [data-presentation-attribution]'
  else {
    const style = getComputedStyle(attribution)
    const isDefault = style.color === 'rgb(0, 0, 238)' || (style.textDecorationLine.includes('underline') && style.color === 'rgb(0, 0, 238)')
    if (parseFloat(style.fontSize) < 12 || isDefault) attributionWarning = `style [data-presentation-attribution] (font-size ${style.fontSize}, color ${style.color})`
  }
  return { overlap, activeWarnings, attributionWarning }
}

async function freePort() {
  const server = createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

async function run(command, args, onChild) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, detached: true, stdio: 'inherit' })
    onChild?.(child)
    child.on('error', reject)
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)))
  })
}

export async function main(args = process.argv.slice(2)) {
  let server
  let browser
  let buildChild
  let interrupted = false
  const terminate = child => {
    if (child?.pid) try { process.kill(-child.pid, 'SIGTERM') } catch { /* already exited */ }
  }
  const stop = signal => {
    interrupted = true
    process.exitCode = signal === 'SIGINT' ? 130 : 143
    terminate(buildChild)
    if (server?.pid) try { process.kill(-server.pid, 'SIGTERM') } catch { /* already exited */ }
    if (browser) void browser.close().catch(() => {})
  }
  const onInterrupt = () => stop('SIGINT')
  const onTerminate = () => stop('SIGTERM')
  const ensureRunning = () => { if (interrupted) throw new Error('Inspection interrupted') }
  process.once('SIGINT', onInterrupt)
  process.once('SIGTERM', onTerminate)
  try {
    const options = parseArgs(args)
    const registry = await fs.readFile(path.join(root, 'src/presentations/index.ts'), 'utf8')
    ensureRunning()
    if (!registry.includes(`"${options.slug}"`) && !registry.includes(`'${options.slug}'`)) throw new Error(`Presentation slug is not registered: ${options.slug}`)
    if (!options.skipBuild) {
      console.log('[inspect] build: running npm run build')
      const buildPromise = run('npm', ['run', 'build'], child => { buildChild = child })
      await buildPromise
      ensureRunning()
    }
    const port = await freePort()
    ensureRunning()
    server = spawn('npm', ['exec', '--', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, detached: true, stdio: 'ignore' })
    const base = `http://127.0.0.1:${port}/`
    let ready = false
    for (let i = 0; i < 100; i += 1) {
      ensureRunning()
      if (server.exitCode !== null) break
      try { if ((await fetch(base)).ok) { ready = true; break } } catch { /* preview is not listening yet */ }
      await sleep(100)
    }
    if (!ready) throw new Error(`Preview failed to start at ${base}`)
    const browserOptions = {}
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH
    if (executablePath) browserOptions.executablePath = executablePath
    try { browser = await chromium.launch({ headless: true, ...browserOptions }) }
    catch (error) { throw new Error(`Could not launch Chromium. Install it with "npx playwright install chromium" or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH/CHROME_PATH. ${error.message}`, { cause: error }) }
    const page = await browser.newPage({ viewport: { width: options.width, height: options.height } })
    await page.goto(`${base}${options.slug}`, { waitUntil: 'networkidle' })
    ensureRunning()
    const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
    ensureRunning()
    if (!Number.isInteger(count) || count < 1) throw new Error(`Route ${options.slug} has no valid [data-step-count] hook`)
    const output = path.resolve(root, options.out, options.slug)
    await fs.mkdir(output, { recursive: true })
    let warnings = 0
    for (let step = 1; step <= count; step += 1) {
      ensureRunning()
      if (step > 1) await page.keyboard.press('ArrowRight')
      await page.waitForFunction(index => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index - 1, step, { timeout: 5000 })
      ensureRunning()
      await page.waitForTimeout(options.settle)
      ensureRunning()
      const marker = await page.locator('[data-inspect-settle-marker]').first().getAttribute('data-inspect-settle-marker').catch(() => null)
      const diagnostics = await page.evaluate(inspectPage)
      const file = path.join(output, `step-${String(step).padStart(2, '0')}.png`)
      await page.screenshot({ path: file, fullPage: true })
      console.log(`[inspect] captured step ${step}/${count}: ${file}${marker === null ? '' : ` marker=${marker}`}`)
      for (const [left, right] of diagnostics.overlap) { warnings += 1; console.warn(`[inspect] WARN step=${step} overlap: ${left} intersects ${right}`) }
      for (const active of diagnostics.activeWarnings) { warnings += 1; console.warn(`[inspect] WARN step=${step} active-nav: ${active} matches inactive sibling styling`) }
      if (diagnostics.attributionWarning) { warnings += 1; console.warn(`[inspect] WARN step=${step} attribution: ${diagnostics.attributionWarning}; style the data-presentation-attribution hook`) }
    }
    console.log(`[inspect] done: ${count} screenshots, ${warnings} warnings`)
  } catch (error) {
    if (!interrupted) {
      console.error(`[inspect] FAIL ${error.stack || error.message}`)
      process.exitCode = 1
    }
  } finally {
    process.removeListener('SIGINT', onInterrupt)
    process.removeListener('SIGTERM', onTerminate)
    if (browser) await browser.close().catch(() => {})
    terminate(buildChild)
    terminate(server)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
/* global document, getComputedStyle */
