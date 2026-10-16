#!/usr/bin/env node
// Screenshot capture + advisory visual diagnostics for one presentation.
// Usage: node scripts/inspect-presentation.mjs <slug> [--settle ms] [--out dir] [--viewport WxH] [--no-build]
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PhaseError, ROOT, launchBrowser, registeredSlugs, runBuild, startPreview } from './verify.mjs'

export const DEFAULT_SETTLE_MS = 1200
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }
export const MIN_ATTRIBUTION_PX = 11
const DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'
const STYLE_KEYS = ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'opacity', 'fontWeight', 'width', 'height', 'transform', 'boxShadow', 'outlineWidth']

// ---------- pure detectors (unit tested) ----------

export function parseViewport(text) {
  const m = /^(\d+)x(\d+)$/i.exec(text ?? '')
  if (!m) throw new PhaseError('inspect', `invalid --viewport "${text}" (expected WxH, e.g. 390x844)`)
  return { width: Number(m[1]), height: Number(m[2]) }
}

export function intersectionArea(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 1 && h > 1 ? w * h : 0
}

/**
 * items: [{ id, label, rect, allowOverlap, ancestors: string[] }]
 * Returns [{ a, b }] label pairs that collide. Skips ancestor/descendant pairs
 * and anything inside an allow-overlap subtree.
 */
export function findOverlaps(items) {
  const out = []
  const checked = items.filter((i) => !i.allowOverlap)
  for (let i = 0; i < checked.length; i++) {
    for (let j = i + 1; j < checked.length; j++) {
      const a = checked[i]
      const b = checked[j]
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
      if (intersectionArea(a.rect, b.rect) > 0) out.push({ a: a.label, b: b.label })
    }
  }
  return out
}

/** Labels of active chrome whose style equals every inactive sibling's style. */
export function indistinctActive(groups) {
  const out = []
  for (const g of groups) {
    if (!g.active || g.inactive.length === 0) continue
    const same = g.inactive.every((s) => STYLE_KEYS.every((k) => s[k] === g.active[k]))
    if (same) out.push(g.label)
  }
  return out
}

/** attr: null (missing) or { fontSize, color, textDecorationLine, height }. */
export function attributionIssues(attr) {
  if (!attr) return ['attribution link is missing (data-presentation-attribution)']
  const issues = []
  if (attr.fontSize < MIN_ATTRIBUTION_PX || attr.height < MIN_ATTRIBUTION_PX) {
    issues.push(`attribution renders too small (${attr.fontSize}px font, ${Math.round(attr.height)}px tall; minimum ${MIN_ATTRIBUTION_PX}px)`)
  }
  if (attr.color === DEFAULT_LINK_COLOR && /underline/.test(attr.textDecorationLine)) {
    issues.push('attribution is browser-default (blue underlined link)')
  }
  return issues
}

export function formatWarnings(step, collected) {
  const w = []
  for (const o of findOverlaps(collected.items)) w.push(`overlap: ${o.a} overlaps ${o.b}`)
  for (const l of indistinctActive(collected.groups)) w.push(`indistinct active chrome: ${l} looks the same as its inactive siblings`)
  for (const i of attributionIssues(collected.attribution)) {
    w.push(`${i} — style it via the [data-presentation-attribution] hook in the presentation's CSS`)
  }
  return w.map((m) => `WARN step ${step}: ${m}`)
}

// ---------- in-page collection ----------

function collectInPage(styleKeys) {
  const visible = (el, rect) => {
    if (rect.width <= 0 || rect.height <= 0) return false
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false
    }
    return true
  }
  const describe = (el) => {
    const tag = el.tagName.toLowerCase()
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `<${tag}${hook ? ` ${hook.name}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const ids = new Map()
  const idOf = (el) => {
    if (!ids.has(el)) ids.set(el, ids.size)
    return ids.get(el)
  }
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const textRect = (el) => {
    const r = document.createRange()
    r.selectNodeContents(el)
    const b = r.getBoundingClientRect()
    return b.width > 0 ? b : el.getBoundingClientRect()
  }
  const root = document.querySelector('[data-presentation-chrome]')
  const items = []
  if (root) {
    const all = [root, ...root.querySelectorAll('*')]
    for (const el of all) {
      if (el === root) continue
      const tag = el.tagName.toLowerCase()
      if (tag === 'script' || tag === 'style') continue
      const chrome = [...el.attributes].some((a) => a.name.startsWith('data-presentation-'))
      const interactive = el.matches('button, a, [data-presentation-progress-item], [data-presentation-toc-entry], [data-presentation-prev], [data-presentation-next]')
      const isText = ownText(el)
      if (!(isText || (chrome && interactive))) continue
      const rect = isText ? textRect(el) : el.getBoundingClientRect()
      if (!visible(el, el.getBoundingClientRect())) continue
      const ancestors = []
      for (let n = el.parentElement; n; n = n.parentElement) ancestors.push(idOf(n))
      items.push({
        id: idOf(el),
        label: describe(el),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        allowOverlap: !!el.closest('[data-presentation-allow-overlap]'),
        ancestors,
      })
    }
  }
  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    const out = {}
    for (const k of styleKeys) out[k] = cs[k]
    return out
  }
  const groups = []
  for (const [sel, name] of [['[data-presentation-progress-item]', 'progress item'], ['[data-presentation-toc-entry]', 'table-of-contents entry']]) {
    const els = [...document.querySelectorAll(sel)]
    const active = els.find((e) => e.getAttribute('aria-current') === 'step')
    if (!active) continue
    groups.push({
      label: `active ${name} ${describe(active)}`,
      active: styleOf(active),
      inactive: els.filter((e) => e !== active).map(styleOf),
    })
  }
  const a = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (a) {
    const cs = getComputedStyle(a)
    attribution = {
      fontSize: parseFloat(cs.fontSize),
      color: cs.color,
      textDecorationLine: cs.textDecorationLine,
      height: a.getBoundingClientRect().height,
    }
  }
  return { items, groups, attribution }
}

// ---------- staleness + run ----------

function newestMtime(p) {
  if (!fs.existsSync(p)) return 0
  const st = fs.statSync(p)
  if (!st.isDirectory()) return st.mtimeMs
  return fs.readdirSync(p).reduce((m, f) => Math.max(m, newestMtime(path.join(p, f))), st.mtimeMs)
}

export function distIsStale(root = ROOT) {
  const dist = path.join(root, 'dist', 'index.html')
  if (!fs.existsSync(dist)) return true
  const built = fs.statSync(dist).mtimeMs
  const inputs = ['src', 'public', 'index.html', 'package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json']
  return inputs.some((i) => newestMtime(path.join(root, i)) > built)
}

export async function inspectPresentation({ slug, root = ROOT, settle = DEFAULT_SETTLE_MS, out, viewport = DEFAULT_VIEWPORT, build = true, log = console.log }) {
  if (!slug) throw new PhaseError('inspect', 'usage: inspect-presentation <slug> [--settle ms] [--out dir] [--viewport WxH] [--no-build]')
  if (!registeredSlugs(root).includes(slug)) {
    throw new PhaseError('inspect', `slug "${slug}" is not registered in src/presentations/index.ts (known: ${registeredSlugs(root).join(', ')})`)
  }
  const outDir = path.resolve(out ?? path.join(root, '.inspection', slug))
  if (build && distIsStale(root)) {
    log('[inspect] dist is missing or stale — building')
    runBuild(root)
  }
  fs.mkdirSync(outDir, { recursive: true })
  const preview = await startPreview(root)
  let browser
  const files = []
  const warnings = []
  try {
    browser = await launchBrowser()
    const page = await browser.newPage({ viewport })
    const url = `${preview.url}/${slug}`
    await page.goto(url, { waitUntil: 'load' })
    const chrome = page.locator('[data-presentation-chrome]')
    await chrome.waitFor({ state: 'attached', timeout: 10000 })
    const count = Number(await chrome.getAttribute('data-step-count'))
    log(`[inspect] ${url} — ${count} steps at ${viewport.width}x${viewport.height}, settle ${settle}ms`)
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((want) => document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index') === String(want), i, { timeout: 5000 })
      }
      log(`[inspect] step ${i + 1}: settling ${settle}ms`)
      await page.waitForTimeout(settle)
      const file = path.join(outDir, `step-${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      files.push(file)
      log(`[inspect] step ${i + 1}: captured ${file}`)
      const found = formatWarnings(i + 1, await page.evaluate(collectInPage, STYLE_KEYS))
      for (const w of found) {
        warnings.push(w)
        log(w)
      }
    }
    await page.close()
  } finally {
    if (browser) await browser.close().catch(() => {})
    await preview.stop()
  }
  log(warnings.length ? `[inspect] done: ${files.length} screenshots, ${warnings.length} advisory warning(s)` : `[inspect] done: ${files.length} screenshots, no advisory warnings`)
  return { files, warnings }
}

export function parseInspectArgs(argv) {
  const o = { build: true }
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const val = () => {
      if (i + 1 >= argv.length) throw new PhaseError('inspect', `${a} needs a value`)
      return argv[++i]
    }
    if (a === '--settle') {
      o.settle = Number(val())
      if (!Number.isFinite(o.settle) || o.settle < 0) throw new PhaseError('inspect', '--settle must be a non-negative number of milliseconds')
    } else if (a === '--out') o.out = val()
    else if (a === '--viewport') o.viewport = parseViewport(val())
    else if (a === '--no-build') o.build = false
    else if (a.startsWith('--')) throw new PhaseError('inspect', `unknown option ${a}`)
    else rest.push(a)
  }
  o.slug = rest[0]
  return o
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await inspectPresentation(parseInspectArgs(process.argv.slice(2)))
  } catch (e) {
    console.error(`inspect error: ${e instanceof PhaseError ? e.message : (e?.stack ?? e)}`)
    process.exit(1)
  }
}
