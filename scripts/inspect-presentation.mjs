// Screenshot capture and advisory visual diagnostics for one registered
// presentation: `npm run inspect -- <slug> [--viewport WxH] [--settle ms]`.
// Warnings never change the exit code; operational failures (unknown slug,
// preview not ready, build failure) exit non-zero.
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { HOST, buildApp, parseRegistrySlugs, previewUrl, withPreview } from './verify.mjs'

export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }
export const DEFAULT_SETTLE_MS = 800
export const MIN_ATTRIBUTION_PX = 11
const DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(0, 0, 255)'])

export class InspectError extends Error {}

export function parseArgs(argv) {
  const opts = { slug: undefined, viewport: { ...DEFAULT_VIEWPORT }, settleMs: DEFAULT_SETTLE_MS, build: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--viewport') {
      const m = /^(\d+)x(\d+)$/.exec(argv[++i] ?? '')
      if (!m) throw new InspectError('--viewport expects WxH, for example 1440x900')
      opts.viewport = { width: Number(m[1]), height: Number(m[2]) }
    } else if (a === '--settle') {
      const ms = Number(argv[++i])
      if (!Number.isFinite(ms) || ms < 0) throw new InspectError('--settle expects a number of milliseconds')
      opts.settleMs = ms
    } else if (a === '--skip-build') {
      opts.build = false
    } else if (a.startsWith('--')) {
      throw new InspectError(`unknown option ${a}`)
    } else if (!opts.slug) {
      opts.slug = a
    } else {
      throw new InspectError(`unexpected argument ${a}`)
    }
  }
  if (!opts.slug) throw new InspectError('usage: npm run inspect -- <slug> [--viewport WxH] [--settle ms]')
  return opts
}

/** 1-based, zero-padded: inspection/<slug>/step-01.png */
export function screenshotPath(root, slug, stepIndex) {
  return path.join(root, 'inspection', slug, `step-${String(stepIndex + 1).padStart(2, '0')}.png`)
}

const intersects = (a, b) =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1

/**
 * Pairs of visible text/chrome elements whose boxes intersect. Elements are
 * { id, label, rect, visible, allowOverlap, ancestors: id[] }. A pair is
 * exempt when either side sits inside an allow-overlap subtree, or when one
 * contains the other.
 */
export function findOverlaps(elements) {
  const out = []
  const live = elements.filter((e) => e.visible && e.rect.w > 0 && e.rect.h > 0)
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      if (a.allowOverlap || b.allowOverlap) continue
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
      if (intersects(a.rect, b.rect)) out.push([a.label, b.label])
    }
  }
  return out
}

const SIGNATURE_KEYS = [
  'color', 'backgroundColor', 'borderColor', 'borderWidth', 'opacity',
  'width', 'height', 'fontWeight', 'textDecorationLine', 'boxShadow', 'outlineStyle',
]
const signature = (s) => SIGNATURE_KEYS.map((k) => s[k]).join('|')

/** True when the active control's computed style matches every inactive sibling's. */
export function isActiveIndistinct(active, inactive) {
  return inactive.length > 0 && inactive.every((s) => signature(s) === signature(active))
}

export function isBrowserDefaultLink(style) {
  return DEFAULT_LINK_COLORS.has(style.color) && style.textDecorationLine.includes('underline')
}

/** Reason the attribution looks unpolished, or undefined when it is fine. */
export function attributionIssue(attribution) {
  if (!attribution) return 'attribution link is missing'
  if (attribution.fontSize < MIN_ATTRIBUTION_PX) {
    return `attribution text is ${attribution.fontSize}px, below ${MIN_ATTRIBUTION_PX}px`
  }
  if (isBrowserDefaultLink(attribution)) return 'attribution uses the browser-default link style'
  return undefined
}

/** Turns one step's page snapshot into advisory warning lines (without the step prefix). */
export function diagnose(snapshot) {
  const warnings = findOverlaps(snapshot.elements).map(
    ([a, b]) => `overlap between ${a} and ${b}; fix the collision or mark an intentional readable overlap with data-presentation-allow-overlap`,
  )
  for (const [kind, hook] of [['progress', 'data-presentation-progress-item'], ['table-of-contents', 'data-presentation-toc-item']]) {
    const group = snapshot.active[kind]
    if (group && isActiveIndistinct(group.active, group.inactive)) {
      warnings.push(`active ${kind} entry is indistinct from inactive entries; style [${hook}][data-presentation-active="true"]`)
    }
  }
  const issue = attributionIssue(snapshot.attribution)
  if (issue) warnings.push(`${issue}; style [data-presentation-attribution]`)
  return warnings
}

/** Runs inside the page: collects plain data for diagnose(). */
function collectSnapshot() {
  const CHROME = '[data-presentation-progress-item],[data-presentation-toc-item],[data-presentation-prev],[data-presentation-next],[data-presentation-mode-toggle],[data-presentation-attribution]'
  const root = document.querySelector('[data-presentation-root]') ?? document.body
  const style = (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      color: s.color, backgroundColor: s.backgroundColor, borderColor: s.borderTopColor,
      borderWidth: s.borderTopWidth, opacity: s.opacity, width: `${Math.round(r.width)}`,
      height: `${Math.round(r.height)}`, fontWeight: s.fontWeight, textDecorationLine: s.textDecorationLine,
      boxShadow: s.boxShadow, outlineStyle: s.outlineStyle, fontSize: parseFloat(s.fontSize),
    }
  }
  const label = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.value === '')
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook.name}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const candidates = [...root.querySelectorAll('*')].filter(
    (el) => !['SCRIPT', 'STYLE', 'SVG', 'PATH', 'LINE', 'POLYGON'].includes(el.tagName.toUpperCase()) &&
      (hasOwnText(el) || el.matches(CHROME)),
  )
  const ids = new Map(candidates.map((el, i) => [el, i]))
  const elements = candidates.map((el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const ancestors = []
    for (let p = el.parentElement; p; p = p.parentElement) if (ids.has(p)) ancestors.push(ids.get(p))
    return {
      id: ids.get(el),
      label: label(el),
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      visible: s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0,
      allowOverlap: el.closest('[data-presentation-allow-overlap]') !== null,
      ancestors,
    }
  })
  const group = (selector) => {
    const items = [...document.querySelectorAll(selector)]
    const active = items.find((el) => el.getAttribute('data-presentation-active') === 'true')
    if (!active) return undefined
    return { active: style(active), inactive: items.filter((el) => el !== active).map(style) }
  }
  const attr = document.querySelector('[data-presentation-attribution]')
  return {
    elements,
    active: {
      progress: group('[data-presentation-progress-item]'),
      'table-of-contents': group('[data-presentation-toc-item]'),
    },
    attribution: attr ? style(attr) : null,
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export async function inspect(root, argv, log = console.log) {
  const opts = parseArgs(argv)
  const registryFile = path.join(root, 'src/presentations/index.ts')
  const slugs = existsSync(registryFile) ? parseRegistrySlugs(readFileSync(registryFile, 'utf8')) : []
  if (!slugs.includes(opts.slug)) {
    throw new InspectError(`unknown presentation "${opts.slug}"; registered: ${slugs.join(', ') || 'none'}`)
  }
  if (opts.build) await buildApp(root)
  const { chromium } = await import('playwright')
  let warnings = 0
  await withPreview(
    root,
    async (port) => {
      const browser = await chromium.launch()
      try {
        const page = await browser.newPage({ viewport: opts.viewport })
        const url = previewUrl(port, `/${opts.slug}`)
        await page.goto(url, { waitUntil: 'load' })
        const chrome = page.locator('[data-step-count]')
        await chrome.waitFor({ timeout: 10_000 })
        const count = Number(await chrome.getAttribute('data-step-count'))
        for (let i = 0; i < count; i++) {
          const started = Date.now()
          await delay(opts.settleMs)
          const file = screenshotPath(root, opts.slug, i)
          mkdirSync(path.dirname(file), { recursive: true })
          await page.screenshot({ path: file })
          log(`[inspect] step ${i + 1}/${count} captured ${path.relative(root, file)} (settled ${Date.now() - started}ms)`)
          for (const w of diagnose(await page.evaluate(collectSnapshot))) {
            warnings++
            log(`WARN step ${i + 1}: ${w}`)
          }
          if (i < count - 1) {
            await page.keyboard.press('ArrowRight')
            await page.waitForFunction(
              (n) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(n),
              i + 1,
              { timeout: 3000 },
            )
          }
        }
      } finally {
        await browser.close()
      }
    },
    log,
  )
  log(`[inspect] done: ${warnings} advisory warning(s) at ${HOST}; screenshots are inspection artifacts, not pass/fail evidence`)
  return { warnings }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  try {
    await inspect(root, process.argv.slice(2))
  } catch (err) {
    console.error(`[inspect] ERROR: ${err.message}`)
    process.exit(1)
  }
}
