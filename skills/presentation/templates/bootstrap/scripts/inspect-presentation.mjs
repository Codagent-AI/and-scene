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
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const HOST = '127.0.0.1'
const PORT = 4174
const SETTLE_MS = 500

async function loadRegistry() {
  const server = await createServer({ root, server: { middlewareMode: true } })
  try {
    const module = await server.ssrLoadModule('/src/presentations/index.ts')
    return module.presentations ?? []
  } finally {
    await server.close()
  }
}

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const response = await fetch(url)
        if (response.ok || response.status < 500) return resolve()
      } catch {
        // not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`server at ${url} did not become ready`))
      setTimeout(attempt, 200)
    }
    attempt()
  })
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
    return nodes
      .filter((node) => node.getAttribute('data-allow-overlap') !== 'true')
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
    const results = []
    for (const el of document.querySelectorAll('[data-active="true"]')) {
      const style = getComputedStyle(el)
      const distinct =
        style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        style.color !== getComputedStyle(document.body).color ||
        style.borderStyle !== 'none' ||
        style.outlineStyle !== 'none' ||
        style.fontWeight !== getComputedStyle(document.body).fontWeight
      results.push({ hook: el.getAttribute('data-scene-kit'), distinct })
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
    return {
      width: rect.width,
      height: rect.height,
      fontSize: parseFloat(style.fontSize),
      color: style.color,
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
    warnings.push(`${stepLabel}: attribution font-size (${attribution.fontSize}px) reads as browser-default/too small`)
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

  const preview = spawn('npx', ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: root,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  })

  const baseUrl = `http://${HOST}:${PORT}`
  const warnings = []

  try {
    await waitForServer(baseUrl)
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })

    const rootLocator = page.locator('[data-scene-kit="presentation"]')
    await rootLocator.waitFor({ state: 'attached', timeout: 10000 })
    const stepCount = Number(await rootLocator.getAttribute('data-step-count'))

    for (let index = 0; index < stepCount; index += 1) {
      await page.waitForTimeout(SETTLE_MS)
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
    preview.kill()
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
