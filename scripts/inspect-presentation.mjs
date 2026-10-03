#!/usr/bin/env node
/**
 * Project-local screenshot + visual-diagnostics helper.
 *
 * Usage: node scripts/inspect-presentation.mjs <slug> [--settle-ms <ms>] [--viewport <width>x<height>]
 * (or: npm run inspect -- <slug> [--settle-ms <ms>] [--viewport <width>x<height>])
 *
 * Builds the app, serves a production preview it owns exclusively (an
 * OS-assigned port on 127.0.0.1, via Vite's programmatic `preview()` API),
 * and steps through every step of the requested presentation, writing one
 * screenshot per step under `presentation-inspection/<slug>/` after
 * transitions settle. Prints advisory warnings (not pass/fail) for unmarked
 * text/chrome overlap, indistinct active navigation, and unpolished
 * attribution.
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import { HOST, ROOT, closePreviewServer, readRegisteredSlugs, run, startOwnedPreview } from './preview-utils.mjs'

const DEFAULT_SETTLE_MS = 900
const DEFAULT_VIEWPORT = { width: 1280, height: 800 }
const STEP_ADVANCE_TIMEOUT_MS = 5000

function parseArgs(argv) {
  const args = { slug: undefined, settleMs: DEFAULT_SETTLE_MS, viewport: DEFAULT_VIEWPORT }
  const rest = [...argv]
  while (rest.length > 0) {
    const token = rest.shift()
    if (token === '--settle-ms') {
      args.settleMs = Number(rest.shift())
    } else if (token === '--viewport') {
      const [width, height] = String(rest.shift()).split('x').map(Number)
      if (width && height) args.viewport = { width, height }
    } else if (!token.startsWith('--') && !args.slug) {
      args.slug = token
    }
  }
  return args
}

/**
 * Waits until the chrome's `data-step-index` hook reports `expectedIndex`,
 * rather than trusting a fixed timeout to mean navigation succeeded. Throws
 * naming the step that failed to advance if it never does.
 */
async function waitForStepIndex(page, expectedIndex) {
  try {
    await page.waitForFunction(
      (expected) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === expected,
      String(expectedIndex),
      { timeout: STEP_ADVANCE_TIMEOUT_MS },
    )
  } catch {
    throw new Error(`step ${expectedIndex + 1} did not become active within ${STEP_ADVANCE_TIMEOUT_MS}ms`)
  }
}

/**
 * Runs in the browser: finds pairs of visible text/chrome nodes whose boxes
 * intersect, minus allow-overlap subtrees. Ancestor/descendant pairs (e.g. a
 * card's own title label rendered inside its bordered box) are excluded —
 * that containment is normal composition, not a collision, and every
 * generated presentation nests text inside `Box`/`SymbolChip` like this.
 */
async function findOverlaps(page) {
  return page.evaluate(() => {
    const selectors = [
      '[data-presentation-title]',
      '[data-presentation-era]',
      '[data-presentation-caption]',
      '[data-presentation-progress]',
      '[data-presentation-toc]',
      '[data-presentation-controls]',
      '[data-presentation-attribution]',
      '[data-presentation-node="label"]',
      '[data-presentation-node="box"]',
      '[data-presentation-node="symbol-chip"]',
    ]
    const candidates = Array.from(document.querySelectorAll(selectors.join(',')))
      .filter((node) => !node.closest('[data-allow-overlap]'))
      .map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          node,
          selector: node.getAttribute('data-presentation-node') ?? node.tagName.toLowerCase(),
          text: (node.textContent ?? '').trim().slice(0, 40),
          rect,
        }
      })
      .filter((candidate) => candidate.rect.width > 0 && candidate.rect.height > 0 && candidate.text.length > 0)

    function intersects(a, b) {
      return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    }

    const overlaps = []
    for (let i = 0; i < candidates.length; i += 1) {
      for (let j = i + 1; j < candidates.length; j += 1) {
        const a = candidates[i]
        const b = candidates[j]
        if (a.node.contains(b.node) || b.node.contains(a.node)) continue
        if (intersects(a.rect, b.rect)) {
          overlaps.push([
            { selector: a.selector, text: a.text },
            { selector: b.selector, text: b.text },
          ])
        }
      }
    }
    return overlaps
  })
}

async function checkActiveStateDistinct(page, selector, activeSelector) {
  return page.evaluate(
    ({ selector, activeSelector }) => {
      const all = Array.from(document.querySelectorAll(selector))
      const active = all.find((node) => node.matches(activeSelector))
      const inactive = all.find((node) => !node.matches(activeSelector))
      if (!active || !inactive) return null
      const activeStyle = getComputedStyle(active)
      const inactiveStyle = getComputedStyle(inactive)
      const distinct =
        activeStyle.color !== inactiveStyle.color ||
        activeStyle.backgroundColor !== inactiveStyle.backgroundColor ||
        activeStyle.fontWeight !== inactiveStyle.fontWeight ||
        activeStyle.opacity !== inactiveStyle.opacity ||
        activeStyle.borderColor !== inactiveStyle.borderColor
      return { distinct }
    },
    { selector, activeSelector },
  )
}

async function checkAttribution(page) {
  return page.evaluate(() => {
    const link = document.querySelector('[data-presentation-attribution]')
    if (!link) return { present: false }
    const style = getComputedStyle(link)
    const fontSize = Number.parseFloat(style.fontSize)
    const looksBrowserDefault = style.color === 'rgb(0, 0, 238)' || style.textDecorationLine === 'underline'
    const undersized = Number.isFinite(fontSize) && fontSize < 10
    return { present: true, fontSize, looksBrowserDefault, undersized }
  })
}

async function main() {
  const { slug: requestedSlug, settleMs, viewport } = parseArgs(process.argv.slice(2))
  const slugs = await readRegisteredSlugs()
  const slug = requestedSlug ?? slugs[0]

  if (!slug) {
    console.error('[inspect] No presentation slug given and none are registered in src/presentations/index.ts')
    process.exitCode = 1
    return
  }
  if (!slugs.includes(slug)) {
    console.error(`[inspect] "${slug}" is not registered. Known slugs: ${slugs.join(', ') || '(none)'}`)
    process.exitCode = 1
    return
  }

  const outDir = path.join(ROOT, 'presentation-inspection', slug)
  mkdirSync(outDir, { recursive: true })

  console.log('[inspect] building application...')
  await run('npm', ['run', 'build'])

  console.log(`[inspect] starting an owned preview on ${HOST}...`)
  const { server, baseUrl } = await startOwnedPreview()
  console.log(`[inspect] preview listening at ${baseUrl}`)

  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport })
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    await waitForStepIndex(page, 0)

    const stepCount = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
    if (!Number.isFinite(stepCount) || stepCount < 1) {
      throw new Error(`route /${slug} has no readable data-step-count hook`)
    }

    const warnings = []

    for (let step = 0; step < stepCount; step += 1) {
      // Navigation (below) already confirmed data-step-index === step via
      // waitForStepIndex; wait for the transition to visually settle before
      // capturing so the screenshot reflects the arrived-at step, not a
      // mid-animation frame of it.
      await page.waitForTimeout(settleMs)

      const screenshotPath = path.join(outDir, `step-${String(step + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: screenshotPath })
      console.log(`[inspect] wrote ${path.relative(ROOT, screenshotPath)}`)

      const overlaps = await findOverlaps(page)
      for (const [a, b] of overlaps) {
        warnings.push(
          `step ${step + 1}: unmarked overlap between "${a.text}" (${a.selector}) and "${b.text}" (${b.selector}) — wrap intentional composition in [data-allow-overlap] to exempt it`,
        )
      }

      const progressState = await checkActiveStateDistinct(
        page,
        '[data-presentation-progress-dot]',
        '[data-presentation-progress-dot][data-active="true"]',
      )
      if (progressState && progressState.distinct === false) {
        warnings.push(`step ${step + 1}: active progress dot is not visually distinct from inactive dots`)
      }

      const tocState = await checkActiveStateDistinct(
        page,
        '[data-presentation-toc-entry]',
        '[data-presentation-toc-entry][data-active="true"]',
      )
      if (tocState && tocState.distinct === false) {
        warnings.push(`step ${step + 1}: active table-of-contents entry is not visually distinct from inactive entries`)
      }

      const attribution = await checkAttribution(page)
      if (!attribution.present) {
        warnings.push(`step ${step + 1}: attribution link [data-presentation-attribution] is missing`)
      } else if (attribution.undersized) {
        warnings.push(`step ${step + 1}: attribution font-size (${attribution.fontSize}px) looks undersized`)
      } else if (attribution.looksBrowserDefault) {
        warnings.push(`step ${step + 1}: attribution looks unstyled (browser-default link color/underline)`)
      }

      if (step < stepCount - 1) {
        await page.keyboard.press('ArrowRight')
        await waitForStepIndex(page, step + 1)
      }
    }

    if (warnings.length > 0) {
      console.log(`\n[inspect] ${warnings.length} advisory warning(s):`)
      for (const warning of warnings) console.log(`  - ${warning}`)
    } else {
      console.log('\n[inspect] no advisory warnings')
    }
  } finally {
    try {
      if (browser) await browser.close()
    } finally {
      await closePreviewServer(server)
    }
  }
}

main().catch((error) => {
  console.error(`[inspect] FAIL: ${error.stack ?? String(error)}`)
  process.exitCode = 1
})
