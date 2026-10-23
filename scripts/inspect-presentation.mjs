#!/usr/bin/env node
// Captures one settled screenshot per step of a registered presentation from a
// production preview, and prints advisory visual warnings. Warnings never change
// the exit code; only execution failures (unknown slug, browser or build errors) do.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startPreview } from './lib/browser.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const VIEWPORT = { width: 1440, height: 900 }
/** Longer than the morph (0.6s) plus newcomer delay (0.7s) and fade (0.45s). */
const DEFAULT_SETTLE_MS = 2000

const USAGE = `usage: npm run inspect -- <slug> [--settle <ms>] [--out <dir>] [--viewport <width>]

Captures .inspection/<slug>/step-NN.png for every step and prints advisory warnings.
  --settle    wait after each step change before capturing (default ${DEFAULT_SETTLE_MS} ms,
              or INSPECT_SETTLE_MS)
  --out       artifact directory (default .inspection/<slug>)
  --viewport  viewport width in px; height stays ${VIEWPORT.height} (default ${VIEWPORT.width})
`

export function parseArgs(argv) {
  const options = { settle: Number(process.env.INSPECT_SETTLE_MS ?? DEFAULT_SETTLE_MS), width: VIEWPORT.width }
  const positional = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--settle') options.settle = Number(argv[++i])
    else if (arg === '--out') options.out = argv[++i]
    else if (arg === '--viewport') options.width = Number(argv[++i])
    else positional.push(arg)
  }
  options.slug = positional[0]
  return options
}

/** Runs in the page: returns advisory warnings for the current step. */
function collectWarnings() {
  const root = document.querySelector('[data-presentation-root]')
  const warnings = []
  if (!root) return [{ kind: 'render', message: 'no presentation root rendered' }]

  const exempt = (el) => el.closest('[data-presentation-allow-overlap]') !== null
  const visible = (el) => {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) > 0.05
  }
  const ownText = (el) => [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '')
  const describe = (el) => {
    const entity = el.closest('[data-presentation-entity]')?.getAttribute('data-presentation-entity')
    const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28) || el.getAttribute('aria-label') || el.tagName.toLowerCase()
    return `${entity ? `${entity} ` : ''}"${text}"`
  }

  // Overlap between visible text/chrome that is not nested and not explicitly allowed.
  // Chrome dots and controls have no text of their own, but still collide with text.
  const chrome = '[data-presentation-progress], [data-presentation-prev], [data-presentation-next], [data-presentation-mode-toggle]'
  const texts = [...root.querySelectorAll('*')].filter(
    (el) =>
      el.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
      (ownText(el) || el.matches(chrome)) &&
      visible(el) &&
      !exempt(el),
  )
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const a = texts[i]
      const b = texts[j]
      if (a.contains(b) || b.contains(a)) continue
      const ra = a.getBoundingClientRect()
      const rb = b.getBoundingClientRect()
      const dx = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
      const dy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
      if (dx > 2 && dy > 2) {
        warnings.push({ kind: 'overlap', message: `${describe(a)} overlaps ${describe(b)}` })
      }
    }
  }

  // Active chrome must differ visibly from an inactive sibling.
  const props = ['color', 'background-color', 'font-weight', 'border-top-color', 'border-top-width', 'opacity', 'outline-style']
  const signature = (el) => {
    const style = getComputedStyle(el)
    return props.map((prop) => style.getPropertyValue(prop)).join('|')
  }
  for (const [selector, label] of [
    ['[data-presentation-progress]', 'progress indicator'],
    ['[data-presentation-toc-entry]', 'table-of-contents entry'],
  ]) {
    const all = [...root.querySelectorAll(selector)]
    const active = all.filter((el) => el.getAttribute('data-presentation-active') === 'true')
    const inactive = all.find((el) => el.getAttribute('data-presentation-active') !== 'true')
    for (const el of active) {
      if (inactive && signature(el) === signature(inactive)) {
        warnings.push({ kind: 'active-chrome', message: `active ${label} is visually indistinct from inactive controls` })
      }
    }
  }

  // Attribution: present, not too small, not browser default.
  const attribution = root.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    warnings.push({ kind: 'attribution', message: 'attribution link missing; keep [data-presentation-attribution]' })
  } else {
    const style = getComputedStyle(attribution)
    const size = Number.parseFloat(style.fontSize)
    if (size < 11) {
      warnings.push({ kind: 'attribution', message: `attribution font-size ${size}px is too small; style [data-presentation-attribution]` })
    }
    const browserDefault = style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline') && size === 16
    if (browserDefault) {
      warnings.push({ kind: 'attribution', message: 'attribution is browser-default; style it via [data-presentation-attribution]' })
    }
  }
  return warnings
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(USAGE)
    return
  }
  if (!options.slug) return fail(`missing <slug>\n\n${USAGE}`)

  const build = spawnSync(process.execPath, [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (build.status !== 0) return fail(`vite build failed\n${build.stdout}${build.stderr}`)

  const outDir = resolve(ROOT, options.out ?? join('.inspection', options.slug))
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const warningLines = []
  let count = 0
  let preview = null
  let browser = null
  try {
    preview = await startPreview(ROOT)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: options.width, height: VIEWPORT.height } })
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(`uncaught: ${error.message}`))
    const response = await page.goto(`${preview.url}/${options.slug}`, { waitUntil: 'load' })
    if (!response || !response.ok()) return fail(`no presentation route for "${options.slug}"`)
    await page.waitForSelector('[data-step-count]', { timeout: 15_000 }).catch(() => {
      throw new Error(`"${options.slug}" did not render a presentation`)
    })
    count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    let pressedAt = Date.now()
    for (let index = 0; index < count; index += 1) {
      await page.waitForTimeout(options.settle)
      const number = String(index + 1).padStart(2, '0')
      const shown = Number(await page.getAttribute('[data-step-index]', 'data-step-index'))
      if (shown !== index) throw new Error(`expected step ${index} before capture, page shows ${shown}`)
      for (const warning of await page.evaluate(collectWarnings)) {
        warningLines.push(`WARN step ${number} ${warning.kind}: ${warning.message}`)
      }
      const elapsed = Date.now() - pressedAt
      if (elapsed < options.settle) throw new Error(`step ${number} captured before the settle interval elapsed`)
      await page.screenshot({ path: join(outDir, `step-${number}.png`) })
      console.log(`step ${number} captured ${elapsed} ms after its step change (settle ${options.settle} ms)`)
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        pressedAt = Date.now()
      }
    }
    if (errors.length > 0) return fail(`runtime errors while inspecting:\n${errors.join('\n')}`)
  } finally {
    if (browser) await browser.close()
    if (preview) await preview.stop()
  }
  writeFileSync(join(outDir, 'warnings.txt'), warningLines.map((line) => `${line}\n`).join(''))
  for (const line of warningLines) console.log(line)
  console.log(`captured ${count} screenshots in ${outDir}; ${warningLines.length} advisory warning(s)`)
}

await main()
