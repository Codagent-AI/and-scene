#!/usr/bin/env node
// Project-local screenshot + visual-quality helper.
//
// Usage: npm run inspect -- <slug> [--viewport=WIDTHxHEIGHT] [--out=DIR]
//
// Captures a screenshot of every step of the named presentation from a
// production preview, after step-transition animations settle, and prints
// advisory warnings for:
//   - unmarked visible text/chrome overlap (mark an intentional subtree with
//     data-presentation-allow-overlap="true" to suppress)
//   - an active progress dot or table-of-contents entry that is visually
//     indistinguishable from its inactive siblings
//   - a missing, browser-default, or undersized attribution link
//
// These warnings are advisory inspection artifacts, not pass/fail signals;
// `scripts/verify.mjs` is the automated gate.

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../..')
const HOST = '127.0.0.1'
const PORT = Number(process.env.INSPECT_PORT ?? 4174)
const BASE_URL = `http://${HOST}:${PORT}`
// The kit's Appear nodes mount after ENTER_DELAY (0.5s) and then fade in over
// ENTER_T (0.35s) — see src/presentation-kit/constants.ts. Capture after that
// completes, plus a small buffer, so screenshots show the settled composition
// rather than a half-mounted one.
const SETTLE_MS = 900

function parseArgs(argv) {
  const [slug, ...rest] = argv
  const options = { slug, viewport: { width: 1280, height: 800 }, outDir: path.join(projectRoot, 'artifacts/presentation-screenshots') }
  for (const arg of rest) {
    if (arg.startsWith('--viewport=')) {
      const [width, height] = arg.slice('--viewport='.length).split('x').map(Number)
      if (width && height) options.viewport = { width, height }
    } else if (arg.startsWith('--out=')) {
      options.outDir = path.resolve(arg.slice('--out='.length))
    }
  }
  return options
}

function readRegisteredSlugs() {
  const indexPath = path.join(projectRoot, 'src/presentations/index.ts')
  const source = readFileSync(indexPath, 'utf8')
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

async function waitForServer(url, timeoutMs = 20_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Preview server at ${url} did not become ready within ${timeoutMs}ms`)
}

// Runs inside the page. Returns advisory warnings for the currently rendered step.
function collectWarnings(stepIndex) {
  const warnings = []

  function isAllowedOverlap(el) {
    let node = el
    while (node) {
      if (node.getAttribute && node.getAttribute('data-presentation-allow-overlap') === 'true') return true
      node = node.parentElement
    }
    return false
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    const style = window.getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false
    return true
  }

  function hasOwnText(el) {
    return Array.from(el.childNodes).some((node) => node.nodeType === 3 && node.textContent.trim().length > 0)
  }

  const candidates = Array.from(
    document.querySelectorAll('[data-presentation-node], [data-presentation-chrome]'),
  ).filter((el) => isVisible(el) && hasOwnText(el))

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i]
      const b = candidates[j]
      if (a.contains(b) || b.contains(a)) continue
      if (isAllowedOverlap(a) || isAllowedOverlap(b)) continue
      const ra = a.getBoundingClientRect()
      const rb = b.getBoundingClientRect()
      const overlaps = ra.left < rb.right && ra.right > rb.left && ra.top < rb.bottom && ra.bottom > rb.top
      if (overlaps) {
        warnings.push(
          `step ${stepIndex}: unmarked overlap between ` +
            `${a.getAttribute('data-presentation-node') ?? a.getAttribute('data-presentation-chrome')} and ` +
            `${b.getAttribute('data-presentation-node') ?? b.getAttribute('data-presentation-chrome')}`,
        )
      }
    }
  }

  function styleSignature(el) {
    const style = window.getComputedStyle(el)
    return [style.color, style.backgroundColor, style.fontWeight, style.opacity, style.borderColor].join('|')
  }

  for (const groupSelector of ['[data-presentation-node="progress-dot"]', '[data-presentation-node="toc-entry"]']) {
    const items = Array.from(document.querySelectorAll(groupSelector))
    const active = items.find((el) => el.getAttribute('data-presentation-active') === 'true')
    const inactive = items.find((el) => el.getAttribute('data-presentation-active') !== 'true')
    if (active && inactive && styleSignature(active) === styleSignature(inactive)) {
      warnings.push(`step ${stepIndex}: active state for ${groupSelector} is visually indistinct from inactive state`)
    }
  }

  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    warnings.push(`step ${stepIndex}: attribution link is missing`)
  } else {
    const style = window.getComputedStyle(attribution)
    const fontSize = parseFloat(style.fontSize)
    const isBrowserDefaultLinkColor = style.color === 'rgb(0, 0, 238)' || style.color === 'rgb(85, 26, 139)'
    if (fontSize && fontSize < 10) {
      warnings.push(`step ${stepIndex}: attribution text is undersized (${style.fontSize})`)
    }
    if (isBrowserDefaultLinkColor && style.textDecorationLine === 'underline') {
      warnings.push(`step ${stepIndex}: attribution uses the browser default link style`)
    }
  }

  return warnings
}

async function inspect(browser, slug, options) {
  const page = await browser.newPage({ viewport: options.viewport })
  const url = slug ? `${BASE_URL}/${slug}` : BASE_URL
  await page.goto(url, { waitUntil: 'networkidle' })

  const outDir = path.join(options.outDir, slug ?? 'landing')
  mkdirSync(outDir, { recursive: true })

  const root = page.locator('[data-presentation-root]')
  const stepCount = Number(await root.getAttribute('data-step-count'))
  const allWarnings = []

  for (let index = 0; index < stepCount; index += 1) {
    await page.waitForTimeout(SETTLE_MS)
    const file = path.join(outDir, `step-${String(index).padStart(2, '0')}.png`)
    await page.screenshot({ path: file })
    const warnings = await page.evaluate(collectWarnings, index)
    allWarnings.push(...warnings)
    console.log(`[inspect] captured ${file}`)
    if (index < stepCount - 1) {
      await page.keyboard.press('ArrowRight')
    }
  }

  await page.close()
  return allWarnings
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const slugs = options.slug ? [options.slug] : readRegisteredSlugs()
  if (slugs.length === 0) {
    console.warn('[inspect] no presentations registered in src/presentations/index.ts')
    return
  }

  // detached + killing the negative pid terminates the whole process group —
  // spawning through a shell means `preview.kill()` alone would only kill the
  // shell wrapper and leave the actual vite server running, hanging this script.
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { cwd: projectRoot, stdio: 'pipe', shell: true, detached: true },
  )

  try {
    await waitForServer(BASE_URL)
    const browser = await chromium.launch()
    try {
      for (const slug of slugs) {
        console.log(`[inspect] /${slug}`)
        const warnings = await inspect(browser, slug, options)
        if (warnings.length === 0) {
          console.log(`[inspect] /${slug}: no advisory warnings`)
        } else {
          console.warn(`[inspect] /${slug}: ${warnings.length} advisory warning(s):`)
          for (const warning of warnings) console.warn(`  - ${warning}`)
        }
      }
    } finally {
      await browser.close()
    }
  } finally {
    try {
      process.kill(-preview.pid, 'SIGKILL')
    } catch {
      // process group already gone
    }
  }
}

await main()
