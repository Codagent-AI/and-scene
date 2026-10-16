#!/usr/bin/env node
// Project-local screenshot + advisory visual diagnostics helper. Usage:
//   npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--viewport <WxH>] [--no-build] [--build] [--root <dir>]
// Writes <root>/.inspection/<slug>/step-NN.png (one-based) from a production preview and
// prints advisory warnings (overlap, active-chrome, attribution). Warnings never change the
// exit code; only operational failures (unknown slug, preview/browser failure) do.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { HOST, freePort, killTree, run, waitReady } from './preview-server.mjs'

export const DEFAULT_SETTLE_MS = 1200
export const DEFAULT_VIEWPORT = { width: 1280, height: 800 }
const ADVANCE_TIMEOUT_MS = 4000
const OVERLAP_TOLERANCE_PX = 2
const MIN_ATTRIBUTION_FONT_PX = 11
const MIN_ATTRIBUTION_HEIGHT_PX = 14
const MIN_ATTRIBUTION_WIDTH_PX = 40

// ---------- pure analysis (unit-tested) ----------

export function parseViewport(value) {
  const m = /^(\d+)x(\d+)$/i.exec(String(value ?? '').trim())
  if (!m || Number(m[1]) < 1 || Number(m[2]) < 1) return null
  return { width: Number(m[1]), height: Number(m[2]) }
}

export function parseArgs(argv) {
  const out = { slug: undefined, out: undefined, settle: DEFAULT_SETTLE_MS, viewport: DEFAULT_VIEWPORT, build: 'auto', root: undefined, errors: [] }
  const value = (i, a, name) => (a.startsWith(`--${name}=`) ? a.slice(name.length + 3) : argv[i + 1])
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const inline = a.includes('=')
    const name = a.startsWith('--') ? a.slice(2).split('=')[0] : null
    if (name === 'no-build') out.build = 'never'
    else if (name === 'build') out.build = 'always'
    else if (name === 'out' || name === 'root' || name === 'settle' || name === 'viewport') {
      const v = value(i, a, name)
      if (!inline) i++
      if (v === undefined) out.errors.push(`--${name} requires a value`)
      else if (name === 'out') out.out = v
      else if (name === 'root') out.root = v
      else if (name === 'settle') {
        const n = Number(v)
        if (!Number.isFinite(n) || n < 0) out.errors.push(`invalid --settle "${v}"`)
        else out.settle = n
      } else {
        const vp = parseViewport(v)
        if (!vp) out.errors.push(`invalid --viewport "${v}" (expected WxH, e.g. 390x844)`)
        else out.viewport = vp
      }
    } else if (a.startsWith('--')) out.errors.push(`unknown option ${a}`)
    else if (out.slug === undefined) out.slug = a
    else out.errors.push(`unexpected argument ${a}`)
  }
  if (out.slug === undefined && out.errors.length === 0) out.errors.push('missing <slug>')
  return out
}

export function stepFileName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}

/** Slugs declared in the registry source (comments ignored). */
export function parseRegistrySlugs(source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
  return [...clean.matchAll(/\bslug\s*:\s*(['"`])([^'"`]+)\1/g)].map((m) => m[2])
}

const label = (el) => {
  const text = (el.text ?? '').replace(/\s+/g, ' ').trim()
  const snippet = text.length > 40 ? `${text.slice(0, 37)}...` : text
  return snippet ? `<${el.tag}> "${snippet}"` : `<${el.tag}> ${el.selector ?? ''}`.trim()
}

function rectsIntersect(a, b, tol) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > tol && h > tol
}

/**
 * elements: [{ id, ancestors: number[], tag, text?, selector?, rects: [{x,y,w,h}], allowOverlap: boolean }]
 * `ancestors` lists the ids of every DOM ancestor. Returns [{ kind: 'overlap', a, b, message }].
 */
export function findOverlaps(elements, tolerance = OVERLAP_TOLERANCE_PX) {
  const live = elements.filter((e) => !e.allowOverlap && e.rects.length > 0)
  const found = []
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
      if (a.rects.some((ra) => b.rects.some((rb) => rectsIntersect(ra, rb, tolerance)))) {
        found.push({ kind: 'overlap', a: label(a), b: label(b), message: `${label(a)} overlaps ${label(b)}` })
      }
    }
  }
  return found
}

const STYLE_KEYS = ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'opacity', 'fontWeight', 'width', 'height', 'transform', 'outline', 'boxShadow', 'textDecoration']

function styleDiffers(a, b) {
  return STYLE_KEYS.some((k) => {
    const x = a[k]
    const y = b[k]
    if (k === 'width' || k === 'height') return Math.abs(parseFloat(x) - parseFloat(y)) > 1
    return String(x ?? '') !== String(y ?? '')
  })
}

/**
 * groups: [{ kind: 'progress' | 'toc', items: [{ active, label?, style }] }].
 * Warns for a group whose active item is visually the same as every inactive sibling.
 */
export function findIndistinctActive(groups) {
  const found = []
  for (const g of groups) {
    const active = g.items.filter((i) => i.active)
    const inactive = g.items.filter((i) => !i.active)
    if (active.length === 0 || inactive.length === 0) continue
    for (const a of active) {
      if (!inactive.some((i) => styleDiffers(a.style, i.style))) {
        found.push({
          kind: 'active-chrome',
          message: `active ${g.kind} item${a.label ? ` "${a.label}"` : ''} looks identical to inactive siblings; style [data-presentation-active="true"] / [aria-current="step"]`,
        })
      }
    }
  }
  return found
}

/**
 * info: null when absent, else { rect: {w,h}, style: { fontSize, color, textDecoration, fontFamily }, defaults: { color, fontFamily } }.
 */
export function findAttributionIssues(info) {
  const hook = 'style the [data-presentation-attribution] hook'
  if (!info) return [{ kind: 'attribution', message: `attribution link [data-presentation-attribution] is missing; render it and ${hook}` }]
  const problems = []
  const fontSize = parseFloat(info.style.fontSize)
  if (fontSize < MIN_ATTRIBUTION_FONT_PX) problems.push(`font size ${fontSize}px is below ${MIN_ATTRIBUTION_FONT_PX}px`)
  if (info.rect.h < MIN_ATTRIBUTION_HEIGHT_PX || info.rect.w < MIN_ATTRIBUTION_WIDTH_PX) {
    problems.push(`hit area ${Math.round(info.rect.w)}x${Math.round(info.rect.h)}px is too small`)
  }
  if (
    info.style.color === info.defaults.color &&
    /underline/.test(info.style.textDecoration ?? '') &&
    info.style.fontFamily === info.defaults.fontFamily
  ) {
    problems.push('still uses browser-default link styling (default color, underline, and font)')
  }
  return problems.map((p) => ({ kind: 'attribution', message: `attribution link ${p}; ${hook}` }))
}

/** Runs all analyses over one step's collected page data. */
export function analyzeStep(data) {
  return [...findOverlaps(data.elements), ...findIndistinctActive(data.groups), ...findAttributionIssues(data.attribution)]
}

export function formatWarning(stepNumber, w) {
  return `warn step ${String(stepNumber).padStart(2, '0')} [${w.kind}] ${w.message}`
}

// ---------- in-page collector (serialises geometry/styles for the pure functions) ----------

function collectInPage() {
  const ids = new Map()
  let next = 0
  const idOf = (el) => {
    if (!ids.has(el)) ids.set(el, next++)
    return ids.get(el)
  }
  const ancestorsOf = (el) => {
    const out = []
    for (let p = el.parentElement; p; p = p.parentElement) out.push(idOf(p))
    return out
  }
  const selectorOf = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))
    return hook ? `[${hook.name}]` : el.tagName.toLowerCase()
  }
  const visible = (el) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false
    }
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh
  }
  const plain = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })
  const elements = []
  const seen = new Set()
  const add = (el, rects, text) => {
    if (seen.has(el) || rects.length === 0) return
    seen.add(el)
    elements.push({
      id: idOf(el),
      ancestors: ancestorsOf(el),
      tag: el.tagName.toLowerCase(),
      text,
      selector: selectorOf(el),
      rects,
      allowOverlap: !!el.closest('[data-presentation-allow-overlap]'),
    })
  }
  const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT'])
  for (const el of document.body.querySelectorAll('*')) {
    if (skip.has(el.tagName) || !visible(el)) continue
    const textNodes = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    if (textNodes.length === 0) continue
    const rects = []
    for (const n of textNodes) {
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) rects.push(plain(r))
    }
    add(el, rects, textNodes.map((n) => n.textContent.trim()).join(' '))
  }
  // Presentation chrome controls (may be icon-only, so use their own box).
  for (const el of document.querySelectorAll('[data-presentation-progress-item], [data-presentation-prev], [data-presentation-next], [data-presentation-attribution]')) {
    if (visible(el)) add(el, [plain(el.getBoundingClientRect())], el.getAttribute('aria-label') ?? el.textContent ?? '')
  }

  const styleOf = (el) => {
    const s = getComputedStyle(el)
    return {
      color: s.color,
      backgroundColor: s.backgroundColor,
      borderColor: s.borderColor,
      borderWidth: s.borderWidth,
      opacity: s.opacity,
      fontWeight: s.fontWeight,
      width: s.width,
      height: s.height,
      transform: s.transform,
      outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
      boxShadow: s.boxShadow,
      textDecoration: s.textDecorationLine,
    }
  }
  const groups = []
  for (const [kind, sel] of [
    ['progress', '[data-presentation-progress-item]'],
    ['toc', '[data-presentation-toc-item]'],
  ]) {
    const items = [...document.querySelectorAll(sel)].filter(visible).map((el) => ({
      active: el.getAttribute('data-presentation-active') === 'true' || el.getAttribute('aria-current') === 'step',
      label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim(),
      style: styleOf(el),
    }))
    if (items.length > 0) groups.push({ kind, items })
  }

  let attribution = null
  const a = document.querySelector('[data-presentation-attribution]')
  if (a) {
    const s = getComputedStyle(a)
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;left:-9999px;width:10px;height:10px;visibility:hidden'
    document.body.appendChild(frame)
    const fdoc = frame.contentDocument
    const probe = fdoc.createElement('a')
    probe.href = 'https://example.com/'
    probe.textContent = 'x'
    fdoc.body.appendChild(probe)
    const ds = frame.contentWindow.getComputedStyle(probe)
    const defaults = { color: ds.color, fontFamily: ds.fontFamily }
    frame.remove()
    const r = a.getBoundingClientRect()
    attribution = {
      rect: { w: r.width, h: r.height },
      style: { fontSize: s.fontSize, color: s.color, textDecoration: s.textDecorationLine, fontFamily: s.fontFamily },
      defaults,
    }
  }
  return { elements, groups, attribution }
}

// ---------- main ----------

class OperationalError extends Error {}

export async function inspect({ root, slug, outDir, settle = DEFAULT_SETTLE_MS, viewport = DEFAULT_VIEWPORT, build = 'auto', log = console.log }) {
  const indexPath = path.join(root, 'src/presentations/index.ts')
  if (existsSync(indexPath) && !parseRegistrySlugs(readFileSync(indexPath, 'utf8')).includes(slug)) {
    throw new OperationalError(`unknown slug "${slug}": not registered in src/presentations/index.ts`)
  }
  let preview
  let browser
  const cleanup = async () => {
    await browser?.close().catch(() => {})
    killTree(preview)
  }
  const onSignal = (sig) => {
    cleanup().finally(() => process.exit(sig === 'SIGINT' ? 130 : 143))
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  try {
    if (build === 'always' || (build === 'auto' && !existsSync(path.join(root, 'dist')))) {
      log('building...')
      const b = await run('npm', ['run', 'build'], root)
      if (b.code !== 0) throw new OperationalError(`npm run build failed:\n${b.out.trim().split('\n').slice(-15).join('\n')}`)
    } else if (!existsSync(path.join(root, 'dist'))) {
      throw new OperationalError('no dist/ found and --no-build was given')
    }

    const port = await freePort()
    const baseUrl = `http://${HOST}:${port}`
    const viteBin = path.join(root, 'node_modules/vite/bin/vite.js')
    preview = spawn(process.execPath, [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
      cwd: root,
      stdio: 'ignore',
      detached: true,
    })
    preview.on('error', () => {})
    if (!(await waitReady(`${baseUrl}/`, preview))) throw new OperationalError(`preview did not become ready at ${baseUrl}`)

    const requireFromRoot = createRequire(path.join(root, 'package.json'))
    const { chromium } = requireFromRoot('playwright')
    browser = await chromium.launch({ args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] })
    const page = await browser.newPage({ viewport })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 15000 })
    } catch {
      throw new OperationalError(`"${slug}" did not render a presentation (no data-step-count hook)${errors.length ? `: ${errors[0]}` : ''}`)
    }
    const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new OperationalError('invalid data-step-count')

    const dir = path.resolve(outDir ?? path.join(root, '.inspection', slug))
    mkdirSync(dir, { recursive: true })
    // Only clear screenshots this helper owns; --out may point at a directory holding other files.
    for (const f of readdirSync(dir)) if (/^step-\d+\.png$/.test(f)) rmSync(path.join(dir, f))
    const readIndex = () =>
      page.locator('[data-step-index]').first().getAttribute('data-step-index', { timeout: 1000 }).then(Number, () => NaN)

    let warnings = 0
    log(`inspecting "${slug}" (${count} steps, ${viewport.width}x${viewport.height}, settle ${settle}ms) at ${baseUrl}/${slug}`)
    let changedAt = Date.now()
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        const deadline = Date.now() + ADVANCE_TIMEOUT_MS
        let idx = await readIndex()
        while (idx !== i && Date.now() < deadline) {
          await page.waitForTimeout(50)
          idx = await readIndex()
        }
        if (idx !== i) throw new OperationalError(`transition failed: data-step-index stayed at ${Number.isNaN(idx) ? 'missing' : idx}, expected ${i}`)
        changedAt = Date.now()
      }
      await page.waitForTimeout(settle)
      const file = path.join(dir, stepFileName(i))
      const waited = Date.now() - changedAt
      await page.screenshot({ path: file })
      log(`captured step ${String(i + 1).padStart(2, '0')} after ${waited}ms settle: ${path.relative(root, file) || file}`)
      const data = await page.evaluate(collectInPage)
      for (const w of analyzeStep(data)) {
        warnings++
        log(formatWarning(i + 1, w))
      }
    }
    if (errors.length) log(`note: page errors observed: ${errors.join('; ')}`)
    log(`done: ${count} screenshot(s) in ${path.relative(root, dir) || dir}, ${warnings} advisory warning(s)`)
    return { dir, count, warnings, size: statSync(path.join(dir, stepFileName(0))).size }
  } finally {
    await cleanup()
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2))
  if (args.errors.length) {
    console.error(`inspect: ${args.errors.join('; ')}`)
    console.error('usage: npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--viewport <WxH>] [--no-build]')
    process.exit(2)
  }
  try {
    await inspect({ root: path.resolve(args.root ?? process.cwd()), slug: args.slug, outDir: args.out, settle: args.settle, viewport: args.viewport, build: args.build })
    process.exit(0)
  } catch (e) {
    console.error(`inspect: ${e instanceof OperationalError ? e.message : (e?.stack ?? e)}`)
    process.exit(1)
  }
}
