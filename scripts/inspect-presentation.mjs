import { spawnSync } from 'node:child_process'
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { chromium, installSignalCleanup, rootPath, startPreview, stopPreview, waitForStep } from './preview-utils.mjs'

const usage = 'Usage: npm run inspect -- <slug> [--width N] [--height N] [--settle MS] [--no-build] [--port N]'
let slug, width, height, settle, port, noBuild
try {
  const parsed = parseArgs({ args: process.argv.slice(2), options: {
    width: { type: 'string' }, height: { type: 'string' }, settle: { type: 'string' }, port: { type: 'string' }, 'no-build': { type: 'boolean' },
  }, allowPositionals: true })
  ;({ width = '1440', height = '900', settle = '1400', port, 'no-build': noBuild = false } = parsed.values)
  ;[slug] = parsed.positionals
  const numeric = (name, value, { integer = false, max = Infinity } = {}) => {
    if (value === undefined) return value
    const number = Number(value)
    if (!Number.isFinite(number) || number <= 0) throw new Error(`${name} must be a finite positive number`)
    if (integer && !Number.isInteger(number)) throw new Error(`${name} must be a whole number`)
    if (number > max) throw new Error(`${name} must be at most ${max}`)
    return number
  }
  width = numeric('--width', width, { integer: true })
  height = numeric('--height', height, { integer: true })
  settle = numeric('--settle', settle)
  port = numeric('--port', port, { integer: true, max: 65535 })
  if (!slug || parsed.positionals.length !== 1) throw new Error('provide exactly one presentation slug')
} catch (error) {
  console.error(`${error.message}\n${usage}`)
  process.exit(2)
}
const run = (command, params) => spawnSync(command, params, { cwd: rootPath, encoding: 'utf8', stdio: 'inherit' })
async function latestSourceTime(directory) {
  let latest = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) latest = Math.max(latest, await latestSourceTime(target))
    else if (/\.(tsx?|css|html|json)$/.test(entry.name)) latest = Math.max(latest, (await stat(target)).mtimeMs)
  }
  return latest
}
let preview, browser
installSignalCleanup(() => ({ child: preview?.child, browser }))
const warnings = []
try {
  let buildNeeded = true
  try {
    const [built, sources, html] = await Promise.all([stat(path.join(rootPath, 'dist', 'index.html')), latestSourceTime(path.join(rootPath, 'src')), stat(path.join(rootPath, 'index.html'))])
    const configTimes = await Promise.all(['package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json'].map(file => stat(path.join(rootPath, file)).then(item => item.mtimeMs, () => 0)))
    buildNeeded = built.mtimeMs < Math.max(sources, html.mtimeMs, ...configTimes)
  } catch {}
  if (!noBuild && buildNeeded) { const result = run('npm', ['run', 'build']); if (result.status !== 0) throw new Error('build failed') }
  preview = await startPreview({ port, onUrl: url => console.log(`[INFO] preview host=${url} readiness=${url}`) })
  browser = await chromium()
  const page = await browser.newPage({ viewport: { width, height } })
  const url = `${preview.url}/${encodeURIComponent(slug)}`
  console.log(`[INFO] browser URL=${url}`)
  await page.goto(url, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`route ${slug} has no valid data-step-count`)
  const out = path.join(rootPath, '.inspection', slug, `${width}x${height}`)
  await mkdir(out, { recursive: true })
  for (let step = 0; step < count; step++) {
    if (step) { await page.keyboard.press('ArrowRight'); await waitForStep(page, step) }
    await page.waitForTimeout(settle)
    console.log(`[INFO] settled step ${step + 1} after ${settle}ms`)
    const diagnostics = await page.evaluate(() => {
      const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0 }
      const label = el => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.getAttribute('data-presentation-title') !== null ? '[title]' : ''}${el.getAttribute('data-presentation-caption') !== null ? '[caption]' : ''}`
      const candidates = [...document.querySelectorAll('[data-presentation-header], [data-presentation-footer], [data-presentation-title], [data-presentation-caption], [data-presentation-progress-indicator], [data-presentation-toc-entry], [data-presentation-attribution], [data-presentation-stage] *')].filter(visible).filter(el => el.children.length === 0 || el.matches('[data-presentation-header], [data-presentation-footer], [data-presentation-stage]'))
      const overlaps = []
      for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i], b = candidates[j]
        if (a.contains(b) || b.contains(a) || a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]')) continue
        const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
        if (Math.min(x.right, y.right) > Math.max(x.left, y.left) + 2 && Math.min(x.bottom, y.bottom) > Math.max(x.top, y.top) + 2) overlaps.push(`${label(a)} overlaps ${label(b)}`)
      }
      const navWarnings = []
      for (const selector of ['[data-presentation-progress-indicator]', '[data-presentation-toc-entry]']) {
        const entries = [...document.querySelectorAll(selector)].filter(visible)
        const active = entries.find(el => el.getAttribute('aria-current') === 'step' && el.dataset.active === 'true')
        const inactive = entries.find(el => el.dataset.active === 'false')
        if (active && inactive) {
          const signature = el => { const s = getComputedStyle(el), r = el.getBoundingClientRect(); return [s.color, s.backgroundColor, s.borderColor, s.borderWidth, s.opacity, s.fontSize, s.fontWeight, r.width, r.height].join('|') }
          if (signature(active) === signature(inactive)) navWarnings.push(`${selector} active state is indistinguishable from inactive state`)
        }
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      let attributionWarning = ''
      if (!attribution || visible(attribution) && (() => { const s = getComputedStyle(attribution), r = attribution.getBoundingClientRect(); return parseFloat(s.fontSize) < 11 || r.width < 36 || r.height < 16 || (s.color === 'rgb(0, 0, 238)' && s.textDecorationLine.includes('underline')) })()) attributionWarning = 'attribution is missing, too small, or browser-default; style [data-presentation-attribution]'
      return { overlaps, navWarnings, attributionWarning }
    })
    const stepWarnings = [...diagnostics.overlaps.map(message => `collision: ${message}`), ...diagnostics.navWarnings, ...(diagnostics.attributionWarning ? [diagnostics.attributionWarning] : [])]
    for (const warning of stepWarnings) { warnings.push({ step: step + 1, warning }); console.warn(`[WARN] step ${step + 1}: ${warning}`) }
    const filename = path.join(out, `step-${String(step + 1).padStart(2, '0')}.png`)
    await page.screenshot({ path: filename, fullPage: true })
    console.log(`[INFO] captured ${path.relative(rootPath, filename)}`)
  }
  console.log(warnings.length ? `Warnings summary: ${warnings.length} advisory warning(s) across ${new Set(warnings.map(w => w.step)).size} step(s)` : 'Warnings summary: no warnings')
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally { await browser?.close(); await stopPreview(preview?.child) }
