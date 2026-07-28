#!/usr/bin/env node
// Project-local screenshot + visual-quality diagnostic helper.
//
// Usage: npm run inspect -- <slug> [outDir]
//
// Starts a preview server, steps through every step of the given
// presentation, waits for motion animations to settle, and captures a
// screenshot per step. Emits advisory warnings (not failures) for:
//   - unmarked visible text/chrome overlap (mark intentional overlap with
//     `data-allow-overlap="true"` on the overlapping element)
//   - visually indistinct active progress/table-of-contents state
//   - missing, browser-default, or undersized attribution
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { startPreviewServer } from './preview-server.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const HOST = '127.0.0.1'
const PORT = 4174
const SETTLE_MS = 500

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`\nfailed: ${command} ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

async function loadRegistry() {
  const server = await createServer({ root, server: { middlewareMode: true } })
  try {
    const module = await server.ssrLoadModule('/src/presentations/index.ts')
    return module.presentations ?? []
  } finally {
    await server.close()
  }
}


/**
 * Waits for the scene to settle before measuring. A step change that crosses a
 * `groupKey` boundary remounts the scene, and `AnimatePresence` keeps the
 * outgoing instance mounted while it fades out — so several scene layers are
 * briefly in the DOM at once. Measuring then reports the fading duplicates as
 * overlapping the incoming entities. Wait for the exit to finish (a single
 * scene layer) before falling back to the fixed settle delay for motion.
 */
async function waitForSceneSettled(page) {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('[data-scene-kit="scene-layer"]').length <= 1,
      undefined,
      { timeout: 5000 },
    )
  } catch {
    // Fall through to the fixed delay; a stuck exit is reported by the checks below.
  }
  await page.waitForTimeout(SETTLE_MS)
}

/** Bounding boxes overlap, sharing more than a sliver of area. */
function overlaps(a, b) {
  const left = Math.max(a.x, b.x)
  const right = Math.min(a.x + a.width, b.x + b.width)
  const top = Math.max(a.y, b.y)
  const bottom = Math.min(a.y + a.height, b.y + b.height)
  if (right <= left || bottom <= top) return false
  const overlapArea = (right - left) * (bottom - top)
  const smallerArea = Math.min(a.width * a.height, b.width * b.height)
  return smallerArea > 0 && overlapArea / smallerArea > 0.15
}

async function checkOverlap(page, warnings, stepLabel) {
  const boxes = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll(
        '[data-scene-kit="box"], [data-scene-kit="label"], [data-scene-kit="symbol-chip"], [data-scene-kit="header"], [data-scene-kit="footer"], [data-scene-kit="toc"]',
      ),
    )
    // The spec scopes this check to *visible* overlap: an entity that is
    // transparent, hidden, or mid-fade is not a composition problem.
    const isVisible = (node) => {
      let current = node
      let opacity = 1
      while (current && current !== document.documentElement) {
        const style = getComputedStyle(current)
        if (style.visibility === 'hidden' || style.display === 'none') return false
        opacity *= Number.parseFloat(style.opacity)
        if (!(opacity > 0.05)) return false
        current = current.parentElement
      }
      return true
    }

    return nodes
      .filter((node) => node.getAttribute('data-allow-overlap') !== 'true')
      .filter(isVisible)
      .map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          hook: node.getAttribute('data-scene-kit'),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }
      })
      .filter((box) => box.width > 0 && box.height > 0)
  })

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (overlaps(boxes[i], boxes[j])) {
        warnings.push(
          `${stepLabel}: unmarked overlap between "${boxes[i].hook}" and "${boxes[j].hook}" — mark intentional overlap with data-allow-overlap="true"`,
        )
      }
    }
  }
}

async function checkActiveState(page, warnings, stepLabel) {
  const activeMarks = await page.evaluate(() => {
    // Visual properties that could plausibly carry an active/inactive
    // distinction. `transform` is excluded: layout morphs leave per-element
    // transforms that differ for reasons unrelated to active styling.
    const VISUAL_PROPERTIES = [
      'backgroundColor',
      'color',
      'borderStyle',
      'borderColor',
      'borderWidth',
      'outlineStyle',
      'fontWeight',
      'opacity',
      'boxShadow',
      'textDecorationLine',
    ]
    // Covers the element *and its subtree*: the kit deliberately puts the
    // `data-active` hook on the control (e.g. the progress-dot button) while
    // presentations style an inner mark (`.sk-progress-dot__mark`), so reading
    // only the hook element itself would miss the distinction entirely.
    const signature = (el) => {
      const parts = []
      for (const node of [el, ...el.querySelectorAll('*')]) {
        const style = getComputedStyle(node)
        parts.push(VISUAL_PROPERTIES.map((property) => style[property]).join('|'))
      }
      return parts.join('||')
    }

    // Group by hook so each active element is compared against its own
    // inactive siblings. Comparing against the document body instead would
    // call an entry "distinct" merely for sharing a border with its siblings.
    const groups = new Map()
    for (const el of document.querySelectorAll('[data-active]')) {
      const hook = el.getAttribute('data-scene-kit') ?? '(unhooked)'
      if (!groups.has(hook)) groups.set(hook, [])
      groups.get(hook).push(el)
    }

    const results = []
    for (const [hook, elements] of groups) {
      const inactive = elements.filter((el) => el.getAttribute('data-active') !== 'true')
      // Nothing to contrast against: no active/inactive pair on this hook.
      if (inactive.length === 0) continue
      const inactiveSignatures = new Set(inactive.map(signature))
      for (const el of elements.filter((candidate) => candidate.getAttribute('data-active') === 'true')) {
        results.push({ hook, distinct: !inactiveSignatures.has(signature(el)) })
      }
    }
    return results
  })

  for (const mark of activeMarks) {
    if (!mark.distinct) {
      warnings.push(`${stepLabel}: active state on "${mark.hook}" is not visually distinct from its inactive siblings`)
    }
  }
}

async function checkAttribution(page, warnings, stepLabel) {
  const attribution = await page.evaluate(() => {
    const el = document.querySelector('[data-scene-kit="attribution"]')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)

    // Measure "browser default" against a throwaway unstyled anchor rather
    // than hardcoding this browser's default link colour. The probe is
    // inserted as a sibling so it inherits the same context, and only the
    // properties the UA stylesheet actually sets on a link are compared —
    // font size/family are inherited, so including them would mask a
    // genuinely unstyled attribution. Size is checked separately below.
    const probe = document.createElement('a')
    probe.href = el.getAttribute('href') ?? '#'
    probe.textContent = el.textContent
    ;(el.parentElement ?? document.body).appendChild(probe)
    const probeStyle = getComputedStyle(probe)
    const browserDefault =
      style.color === probeStyle.color && style.textDecorationLine === probeStyle.textDecorationLine
    probe.remove()

    return {
      width: rect.width,
      height: rect.height,
      fontSize: parseFloat(style.fontSize),
      browserDefault,
    }
  })

  if (!attribution) {
    warnings.push(`${stepLabel}: attribution hook is missing from the page`)
    return
  }
  if (attribution.width < 20 || attribution.height < 8) {
    warnings.push(`${stepLabel}: attribution renders undersized (${Math.round(attribution.width)}x${Math.round(attribution.height)}px)`)
  }
  if (attribution.fontSize && attribution.fontSize < 8) {
    warnings.push(`${stepLabel}: attribution font-size (${attribution.fontSize}px) reads as too small`)
  }
  if (attribution.browserDefault) {
    warnings.push(
      `${stepLabel}: attribution renders with browser-default anchor styling — presentation CSS should make it intentional`,
    )
  }
}

async function main() {
  const [slug, outDirArg] = process.argv.slice(2)
  if (!slug) {
    console.error('usage: npm run inspect -- <slug> [outDir]')
    process.exit(1)
  }

  const presentations = await loadRegistry()
  const entry = presentations.find((candidate) => candidate.slug === slug)
  if (!entry) {
    console.error(`no presentation registered with slug "${slug}"`)
    process.exit(1)
  }

  const outDir = path.resolve(root, outDirArg ?? path.join('.inspect', slug))
  fs.mkdirSync(outDir, { recursive: true })

  // `vite preview` serves whatever is already in `dist/`. Without building
  // first, the screenshots and advisory warnings describe a stale bundle, so
  // an edit under review appears to have had no effect.
  run('npm', ['run', 'build'])

  const preview = await startPreviewServer({ root, host: HOST, port: PORT })
  const baseUrl = `http://${HOST}:${PORT}`
  const warnings = []

  try {
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })

    const rootLocator = page.locator('[data-scene-kit="presentation"]')
    await rootLocator.waitFor({ state: 'attached', timeout: 10000 })
    // Without this guard a missing attribute (Number(null) === 0) or a
    // nonnumeric one (NaN) skips the loop entirely, and inspection reports
    // "no advisory warnings" having captured nothing.
    const rawStepCount = await rootLocator.getAttribute('data-step-count')
    const stepCount = Number(rawStepCount)
    if (!Number.isInteger(stepCount) || stepCount < 1) {
      throw new Error(
        `presentation "${slug}" exposes an invalid data-step-count: ${JSON.stringify(rawStepCount)}`,
      )
    }

    for (let index = 0; index < stepCount; index += 1) {
      await waitForSceneSettled(page)
      const stepLabel = `step ${index + 1}/${stepCount}`
      const file = path.join(outDir, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file })
      console.log(`captured ${file}`)

      await checkOverlap(page, warnings, stepLabel)
      await checkActiveState(page, warnings, stepLabel)
      await checkAttribution(page, warnings, stepLabel)

      if (index < stepCount - 1) {
        await page.keyboard.press('ArrowRight')
      }
    }

    await browser.close()
  } finally {
    await preview.close()
  }

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} advisory warning(s):`)
    for (const warning of warnings) console.log(`  - ${warning}`)
  } else {
    console.log('\nno advisory warnings')
  }
}

main().catch((error) => {
  console.error(`inspect failed: ${error.message}`)
  process.exit(1)
})
