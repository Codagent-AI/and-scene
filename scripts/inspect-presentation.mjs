// Screenshot capture and advisory visual diagnostics for one presentation.
// Usage: npm run inspect -- <slug> [--settle <ms>] [--viewport <W>x<H>] [--out <dir>] [--no-build]
// Screenshots land in inspection/<slug>/step-NN.png. Warnings are advisory (exit 0);
// an unknown slug or a browser/preview failure exits non-zero.
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PhaseError, defaultDeps, previewUrl } from './lib/preview.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const DEFAULT_SETTLE_MS = 1200
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }
export const MIN_ATTRIBUTION_PX = 11
const OVERLAP_EPSILON = 0.5
const DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)'])

export function parseArgs(argv, env = {}) {
  const options = {
    slug: null,
    settleMs: Number(env.INSPECT_SETTLE_MS) || DEFAULT_SETTLE_MS,
    viewport: DEFAULT_VIEWPORT,
    out: 'inspection',
    build: true,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--settle') options.settleMs = Number(argv[++i])
    else if (arg === '--viewport') {
      const match = /^(\d+)x(\d+)$/.exec(argv[++i] ?? '')
      if (!match) throw new PhaseError('args', '--viewport expects <W>x<H>')
      options.viewport = { width: Number(match[1]), height: Number(match[2]) }
    } else if (arg === '--out') options.out = argv[++i]
    else if (arg === '--no-build') options.build = false
    else if (arg.startsWith('--')) throw new PhaseError('args', `unknown option ${arg}`)
    else options.slug = arg
  }
  if (!options.slug) throw new PhaseError('args', 'usage: npm run inspect -- <slug> [--settle ms] [--viewport WxH] [--out dir] [--no-build]')
  if (!Number.isFinite(options.settleMs) || options.settleMs < 0) throw new PhaseError('args', '--settle expects milliseconds')
  return options
}

export function isRegistered(root, slug) {
  const file = join(root, 'src', 'presentations', 'index.ts')
  return existsSync(file) && new RegExp(`slug:\\s*['"]${slug}['"]`).test(readFileSync(file, 'utf8'))
}

export const stepFileName = (index) => `step-${String(index + 1).padStart(2, '0')}.png`

export function outputDir(root, out, slug, viewport) {
  const isDefault = viewport.width === DEFAULT_VIEWPORT.width && viewport.height === DEFAULT_VIEWPORT.height
  return join(root, out, isDefault ? slug : `${slug}-${viewport.width}x${viewport.height}`)
}

const intersects = (a, b) =>
  Math.min(a.r, b.r) - Math.max(a.l, b.l) > OVERLAP_EPSILON && Math.min(a.b, b.b) - Math.max(a.t, b.t) > OVERLAP_EPSILON

/**
 * Candidates are visible text/chrome boxes: { label, rect, allowed, containers }.
 * Elements inside an allow-overlap subtree and ancestor/descendant pairs are exempt.
 */
export function findOverlaps(candidates) {
  const found = []
  candidates.forEach((a, i) => {
    candidates.forEach((b, j) => {
      if (j <= i || a.allowed || b.allowed) return
      if (a.containers.includes(j) || b.containers.includes(i)) return
      if (intersects(a.rect, b.rect)) found.push([a.label, b.label])
    })
  })
  return found
}

/** Active chrome is indistinct when it looks like the most common inactive sibling. */
export function isIndistinct(active, inactive) {
  if (!active || inactive.length === 0) return false
  const counts = new Map()
  inactive.forEach((sig) => counts.set(JSON.stringify(sig), (counts.get(JSON.stringify(sig)) ?? 0) + 1))
  const [common] = [...counts.entries()].sort((x, y) => y[1] - x[1])[0]
  return JSON.stringify(active) === common
}

export function attributionIssues(attribution) {
  if (!attribution) return ['the attribution link is missing']
  const issues = []
  if (attribution.fontSize < MIN_ATTRIBUTION_PX) issues.push(`text is too small (${attribution.fontSize}px)`)
  const defaultFont = /times/i.test(attribution.fontFamily)
  if (DEFAULT_LINK_COLORS.has(attribution.color) || (attribution.textDecorationLine.includes('underline') && defaultFont)) {
    issues.push('it uses the browser-default link styling')
  }
  return issues
}

export function warningsFor(step, page) {
  const warnings = []
  for (const [a, b] of findOverlaps(page.candidates)) {
    warnings.push(`WARN [overlap] step ${step}: ${a} overlaps ${b} (mark intentional overlaps with data-presentation-allow-overlap)`)
  }
  for (const kind of ['progress', 'toc']) {
    const chrome = page[kind]
    if (isIndistinct(chrome.active, chrome.inactive)) {
      warnings.push(`WARN [active-nav] step ${step}: the active ${kind === 'toc' ? 'table-of-contents entry' : 'progress indicator'} looks the same as inactive ones (style [data-presentation-active="true"])`)
    }
  }
  for (const issue of attributionIssues(page.attribution)) {
    warnings.push(`WARN [attribution] step ${step}: ${issue}; style [data-presentation-attribution]`)
  }
  return warnings
}

/** Runs in the browser: gathers visible text/chrome boxes and active-chrome styles. */
export function collectPage() {
  const root = document.querySelector('[data-presentation-root]')
  const CHROME = '[data-presentation-nav-prev],[data-presentation-nav-next],[data-presentation-progress-dot],[data-presentation-toc-entry],[data-presentation-attribution]'
  const visible = (el) => {
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    let opacity = 1
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity)
    }
    return opacity > 0.05
  }
  const textRect = (el) => {
    const range = document.createRange()
    const rects = []
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        range.selectNodeContents(node)
        rects.push(...range.getClientRects())
      }
    }
    if (rects.length === 0) return el.getBoundingClientRect()
    return {
      left: Math.min(...rects.map((r) => r.left)), top: Math.min(...rects.map((r) => r.top)),
      right: Math.max(...rects.map((r) => r.right)), bottom: Math.max(...rects.map((r) => r.bottom)),
    }
  }
  const hasText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const els = [...root.querySelectorAll('*')].filter((el) => (hasText(el) || el.matches(CHROME)) && !(el instanceof SVGElement) && visible(el))
  const describe = (el) => {
    const hook = el.getAttributeNames().find((n) => n.startsWith('data-presentation-') && n !== 'data-presentation-active')
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 28)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const candidates = els
    .map((el) => ({ el, rect: textRect(el) }))
    .filter(({ rect }) => rect.right - rect.left > 0 && rect.bottom - rect.top > 0)
  const out = candidates.map(({ el, rect }) => ({
    label: describe(el),
    rect: { l: rect.left, t: rect.top, r: rect.right, b: rect.bottom },
    allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    containers: candidates.map((c, j) => (c.el !== el && c.el.contains(el) ? j : -1)).filter((j) => j >= 0),
  }))
  const signature = (el) => {
    const s = getComputedStyle(el)
    return {
      color: s.color, backgroundColor: s.backgroundColor, borderColor: s.borderTopColor, borderWidth: s.borderTopWidth,
      opacity: s.opacity, fontWeight: s.fontWeight, width: s.width, height: s.height, boxShadow: s.boxShadow,
      textDecorationLine: s.textDecorationLine, outlineStyle: s.outlineStyle, transform: s.transform,
    }
  }
  const chrome = (selector) => {
    const all = [...root.querySelectorAll(selector)]
    const active = all.find((el) => el.getAttribute('data-presentation-active') === 'true')
    return {
      active: active ? signature(active) : null,
      inactive: all.filter((el) => el !== active).map(signature),
    }
  }
  const link = root.querySelector('[data-presentation-attribution]')
  const ls = link ? getComputedStyle(link) : null
  return {
    candidates: out,
    progress: chrome('[data-presentation-progress-dot]'),
    toc: chrome('[data-presentation-toc-entry]'),
    attribution: link
      ? { fontSize: parseFloat(ls.fontSize), color: ls.color, textDecorationLine: ls.textDecorationLine, fontFamily: ls.fontFamily }
      : null,
  }
}

/** Visit every step: advance, wait out the settle interval, then capture and diagnose. */
export async function inspectSteps(page, { count, settleMs, sleep, dir, log = console.log }) {
  let warnings = 0
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(
        (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
        i,
        { timeout: 5000 },
      )
    }
    await sleep(settleMs)
    await page.screenshot({ path: join(dir, stepFileName(i)) })
    for (const line of warningsFor(i + 1, await page.evaluate(collectPage))) {
      warnings++
      log(line)
    }
  }
  return warnings
}

export async function inspect(argv, { root = ROOT, env = process.env, log = console.log, deps = defaultDeps } = {}) {
  const options = parseArgs(argv, env)
  if (!isRegistered(root, options.slug)) {
    throw new PhaseError('args', `"${options.slug}" is not registered in src/presentations/index.ts`)
  }
  if (options.build) await deps.runBuild(root)
  else if (!existsSync(join(root, 'dist', 'index.html'))) throw new PhaseError('build', 'no dist/ found; run npm run build or omit --no-build')
  const preview = await deps.startPreview(root)
  let browser
  try {
    browser = await deps.launchBrowser()
    const page = await browser.newPage({ viewport: options.viewport })
    const url = previewUrl(preview.port, `/${options.slug}`)
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForSelector('[data-presentation-root]', { timeout: 15000 }).catch(() => {
      throw new PhaseError('render', `${url} did not render a presentation`)
    })
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    const dir = outputDir(root, options.out, options.slug, options.viewport)
    mkdirSync(dir, { recursive: true })
    const warnings = await inspectSteps(page, {
      count, settleMs: options.settleMs, dir, log,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    })
    log(`inspect: wrote ${count} screenshots to ${dir}; ${warnings} advisory warning(s)`)
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  inspect(process.argv.slice(2)).catch((error) => {
    console.error(`FAIL inspect [${error.phase ?? 'error'}]: ${error.message}`)
    process.exitCode = 1
  })
}
