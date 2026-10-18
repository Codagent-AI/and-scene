#!/usr/bin/env node
// Capture one settled screenshot per step of a registered presentation from a production
// preview, and print advisory visual warnings. Usage:
//   npm run inspect -- <slug> [--settle <ms>] [--viewport <WxH>] [--out <dir>] [--no-build]
// Screenshots land in .inspection/<slug>/step-NN.png. Warnings never change the exit status.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants.ts'
import { projectRoot, readRegistrySlugs, resolvePort, runBuild, withPreview } from './lib.mjs'

/** Longer than the kit's longest enter delay plus its layout transition. */
export const DEFAULT_SETTLE_MS = Math.ceil((ENTER_DELAY + ENTER_T + LAYOUT_T) * 1000) + 300
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }
export const MIN_ATTRIBUTION_FONT_PX = 12
export const UA_LINK_COLOR = 'rgb(0, 0, 238)'
const MIN_OVERLAP_PX = 2

/** Strict rectangle intersection: touching edges do not overlap. */
export function intersects(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > MIN_OVERLAP_PX && h > MIN_OVERLAP_PX
}

/**
 * Pairs of visible text/chrome items whose rectangles overlap. Items inside an allow-overlap
 * subtree, and ancestor/descendant pairs, are exempt.
 * item: { desc, rect, allowed, contains(otherIndex) via `path` } where `path` is the ancestor chain ids.
 */
export function findOverlaps(items) {
  const found = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      if (a.lineage.includes(b.uid) || b.lineage.includes(a.uid)) continue
      if (intersects(a.rect, b.rect)) found.push([a.desc, b.desc])
    }
  }
  return found
}

export const SIGNATURE_KEYS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'fontWeight', 'opacity',
  'width', 'height', 'textDecorationLine', 'boxShadow', 'outlineStyle', 'outlineColor', 'outlineWidth', 'transform',
]

/** Drop properties that cannot be seen: the colour of a border that is not drawn, or of an absent outline. */
export function normalizeSignature(raw) {
  const sig = { ...raw }
  if (sig.borderTopStyle === 'none' || sig.borderTopStyle === 'hidden' || parseFloat(sig.borderTopWidth) === 0) {
    sig.borderTopColor = ''
    sig.borderTopWidth = ''
    sig.borderTopStyle = ''
  }
  if (sig.outlineStyle === 'none' || parseFloat(sig.outlineWidth) === 0) {
    sig.outlineColor = ''
    sig.outlineWidth = ''
  }
  if (sig.boxShadow === 'none') sig.boxShadow = ''
  return sig
}

/** True when the active control's computed look differs from an inactive sibling's. */
export function isDistinct(active, inactive) {
  const a = normalizeSignature(active)
  const b = normalizeSignature(inactive)
  return SIGNATURE_KEYS.some((key) => a[key] !== b[key])
}

/** Reasons the attribution looks unpolished; `info` is null when it is missing. */
export function attributionIssues(info) {
  if (!info) return ['link is missing']
  const issues = []
  if (info.fontSizePx < MIN_ATTRIBUTION_FONT_PX) {
    issues.push(`font size ${info.fontSizePx}px is below ${MIN_ATTRIBUTION_FONT_PX}px`)
  }
  if (info.color === UA_LINK_COLOR) issues.push('uses the browser-default link color')
  else if (info.textDecorationLine.includes('underline') && !info.authorStyled) {
    issues.push('is underlined with no author styles applied')
  }
  return issues
}

/** Runs inside the page: gathers geometry and computed styles for the diagnostics. */
function collectDiagnostics(signatureKeys) {
  const root = document.querySelector('[data-presentation-root]')
  const visible = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })
  const describe = (el) => {
    const id = el.closest('[data-presentation-id]')?.getAttribute('data-presentation-id')
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))?.name
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 28)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook}` : ''}${id ? ` id=${id}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const textRect = (el) => {
    let box = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const r of range.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue
        box = box
          ? { x: Math.min(box.x, r.x), y: Math.min(box.y, r.y), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
          : { x: r.x, y: r.y, right: r.right, bottom: r.bottom }
      }
    }
    return box && { x: box.x, y: box.y, width: box.right - box.x, height: box.bottom - box.y }
  }
  const uids = new Map()
  const uid = (el) => {
    if (!uids.has(el)) uids.set(el, uids.size)
    return uids.get(el)
  }
  const lineage = (el) => {
    const chain = []
    for (let p = el.parentElement; p; p = p.parentElement) chain.push(uid(p))
    return chain
  }
  const items = []
  const add = (el, rect) => {
    if (!rect || !visible(el)) return
    items.push({
      uid: uid(el),
      desc: describe(el),
      rect,
      allowed: el.closest('[data-presentation-allow-overlap]') !== null,
      lineage: lineage(el),
    })
  }
  for (const el of root?.querySelectorAll('*') ?? []) {
    // Controls collide by their whole box (padding, border, icon-only), not just their label text.
    if (el.matches('button, a[href], [role="button"], [data-presentation-progress-item]')) {
      const r = el.getBoundingClientRect()
      add(el, { x: r.x, y: r.y, width: r.width, height: r.height })
    } else {
      add(el, textRect(el))
    }
  }
  // Text-sized controls differ in width/height just because their labels differ, so only
  // text-free controls (progress dots) compare their box size.
  const signature = (el) => {
    const s = getComputedStyle(el)
    const sized = !(el.textContent ?? '').trim()
    return Object.fromEntries(
      signatureKeys.map((k) => [k, !sized && (k === 'width' || k === 'height') ? '' : s[k]]),
    )
  }
  const chrome = (selector) => {
    const all = [...document.querySelectorAll(selector)]
    const active = all.find((el) => el.getAttribute('aria-current') !== null || el.hasAttribute('data-presentation-active'))
    const inactive = all.find((el) => el !== active)
    return active && inactive ? { active: signature(active), inactive: signature(inactive), desc: describe(active) } : null
  }
  const link = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link) {
    const s = getComputedStyle(link)
    let authorStyled = false
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      for (const rule of rules) {
        try {
          if (rule.selectorText && link.matches(rule.selectorText)) authorStyled = true
        } catch {
          /* unsupported selector */
        }
      }
    }
    attribution = { fontSizePx: parseFloat(s.fontSize), color: s.color, textDecorationLine: s.textDecorationLine, authorStyled }
  }
  return {
    items,
    progress: chrome('[data-presentation-progress-item]'),
    toc: chrome('[data-presentation-toc-item]'),
    attribution,
    pendingAnimations: document.getAnimations().filter((a) => a.playState === 'running').length,
  }
}

/** Advisory warning lines for one step's diagnostics. */
export function analyze(step, diag) {
  const warnings = []
  for (const [a, b] of findOverlaps(diag.items)) {
    warnings.push(`step ${step}: overlap between ${a} and ${b} (mark an intentional readable overlap with data-presentation-allow-overlap)`)
  }
  for (const [name, entry] of [['progress indicator', diag.progress], ['table-of-contents entry', diag.toc]]) {
    if (entry && !isDistinct(entry.active, entry.inactive)) {
      warnings.push(`step ${step}: active ${name} ${entry.desc} looks identical to inactive ones; style [data-presentation-active]`)
    }
  }
  for (const issue of attributionIssues(diag.attribution)) {
    warnings.push(`step ${step}: attribution ${issue}; style [data-presentation-attribution]`)
  }
  return warnings
}

export function parseArgs(argv) {
  const args = { settle: DEFAULT_SETTLE_MS, viewport: DEFAULT_VIEWPORT, build: true, out: undefined, slug: undefined }
  const value = (i, flag) => {
    if (argv[i] === undefined || argv[i].startsWith('--')) throw new Error(`${flag} needs a value`)
    return argv[i]
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--settle') {
      const raw = value(++i, arg)
      args.settle = Number(raw)
      if (!/^\d+(\.\d+)?$/.test(raw) || !Number.isFinite(args.settle)) throw new Error(`--settle must be a non-negative number of milliseconds, got "${raw}"`)
    } else if (arg === '--viewport') {
      const raw = value(++i, arg)
      if (!/^\d+x\d+$/.test(raw)) throw new Error(`--viewport must look like 1440x900, got "${raw}"`)
      const [width, height] = raw.split('x').map(Number)
      args.viewport = { width, height }
    } else if (arg === '--out') args.out = value(++i, arg)
    else if (arg === '--no-build') args.build = false
    else if (!arg.startsWith('--')) args.slug = arg
  }
  return args
}

async function main() {
  const root = projectRoot()
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error(`inspect: ${err.message}`)
    process.exit(2)
  }
  if (!args.slug) {
    console.error('usage: npm run inspect -- <slug> [--settle <ms>] [--viewport <WxH>] [--out <dir>] [--no-build]')
    process.exit(2)
  }
  if (!readRegistrySlugs(root).includes(args.slug)) {
    console.error(`inspect: "${args.slug}" is not registered in src/presentations/index.ts`)
    process.exit(2)
  }
  if (args.build) {
    const build = await runBuild(root)
    if (build.code !== 0) {
      console.error(build.output.trim().split('\n').slice(-25).join('\n'))
      console.error('inspect: build failed')
      process.exit(1)
    }
  }
  const outDir = path.resolve(root, args.out ?? path.join('.inspection', args.slug))
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const manifest = []
  const warnings = []
  await withPreview(root, await resolvePort(), async ({ baseUrl }) => {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: args.viewport })
      await page.goto(`${baseUrl}/${args.slug}`)
      await page.waitForSelector('[data-step-count]')
      const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
      for (let i = 0; i < count; i++) {
        if (i > 0) {
          await page.keyboard.press('ArrowRight')
          await page.waitForFunction((want) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(want), i)
        }
        const waitedFrom = Date.now()
        await page.waitForTimeout(args.settle)
        // Wait out any animation still running after the settle interval.
        for (let n = 0; n < 40 && (await page.evaluate(() => document.getAnimations().some((a) => a.playState === 'running'))); n++) {
          await page.waitForTimeout(100)
        }
        const file = `step-${String(i + 1).padStart(2, '0')}.png`
        await page.screenshot({ path: path.join(outDir, file) })
        const diag = await page.evaluate(collectDiagnostics, SIGNATURE_KEYS)
        manifest.push({ step: i + 1, file, settleMs: args.settle, capturedAfterMs: Date.now() - waitedFrom, pendingAnimations: diag.pendingAnimations })
        warnings.push(...analyze(i + 1, diag))
        if (diag.pendingAnimations > 0) {
          warnings.push(`step ${i + 1}: ${diag.pendingAnimations} animation(s) still running at capture, so the screenshot may be unsettled; raise --settle`)
        }
      }
    } finally {
      await browser.close()
    }
  })
  writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`inspect: wrote ${manifest.length} screenshots to ${path.relative(root, outDir) || '.'}`)
  for (const w of warnings) console.log(`WARN ${w}`)
  console.log(`inspect: ${warnings.length} advisory warning(s); screenshots are for human review, not a pass/fail result`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`inspect: ${err.stack ?? err}`)
    process.exit(1)
  })
}
