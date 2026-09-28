#!/usr/bin/env node
/**
 * Project-local screenshot + visual-diagnostics helper.
 *
 * Usage: node scripts/inspect-presentation.mjs <slug> [--settle-ms <ms>] [--viewport <width>x<height>]
 * (or: npm run inspect -- <slug> [--settle-ms <ms>] [--viewport <width>x<height>])
 *
 * Builds the app, serves a production preview on 127.0.0.1, and steps through
 * every step of the requested presentation, writing one screenshot per step
 * under `presentation-inspection/<slug>/` after transitions settle. Prints
 * advisory warnings (not pass/fail) for unmarked text/chrome overlap,
 * indistinct active navigation, and unpolished attribution.
 */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

/** Kills a spawned process (and its group) without hanging if it ignores the signal. */
async function killProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }
  const exited = await Promise.race([
    once(child, 'exit').then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 3000)),
  ])
  if (!exited) {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      child.kill('SIGKILL')
    }
    await once(child, 'exit').catch(() => {})
  }
}

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const HOST = '127.0.0.1'
const PORT = 4736
const BASE_URL = `http://${HOST}:${PORT}`
const DEFAULT_SETTLE_MS = 900
const DEFAULT_VIEWPORT = { width: 1280, height: 800 }

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

function readRegisteredSlugs() {
  const indexPath = path.join(ROOT, 'src', 'presentations', 'index.ts')
  const source = readFileSync(indexPath, 'utf8')
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd: ROOT, ...options })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`))))
    child.on('error', reject)
  })
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Preview server did not become ready at ${url} within ${timeoutMs}ms`)
}

/** Runs in the browser: collects bounding boxes for visible text/chrome nodes, minus allow-overlap subtrees. */
async function collectOverlapCandidates(page) {
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
    const nodes = Array.from(document.querySelectorAll(selectors.join(',')))
    return nodes
      .filter((node) => !node.closest('[data-allow-overlap]'))
      .map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          selector: node.getAttribute('data-presentation-node') ?? node.tagName.toLowerCase(),
          text: (node.textContent ?? '').trim().slice(0, 40),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }
      })
      .filter((box) => box.width > 0 && box.height > 0 && box.text.length > 0)
  })
}

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function findOverlaps(boxes) {
  const overlaps = []
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (intersects(boxes[i], boxes[j])) overlaps.push([boxes[i], boxes[j]])
    }
  }
  return overlaps
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
  const slugs = readRegisteredSlugs()
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

  console.log(`[inspect] starting preview on ${BASE_URL}...`)
  const viteBin = path.join(ROOT, 'node_modules', '.bin', 'vite')
  const preview = spawn(
    viteBin,
    ['preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'pipe', detached: true },
  )
  preview.stdout.on('data', () => {})
  preview.stderr.on('data', () => {})

  let browser
  try {
    await waitForServer(`${BASE_URL}/`)
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport })
    await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(settleMs)

    const stepCount = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
    if (!Number.isFinite(stepCount) || stepCount < 1) {
      throw new Error(`route /${slug} has no readable data-step-count hook`)
    }

    const warnings = []

    for (let step = 0; step < stepCount; step += 1) {
      const screenshotPath = path.join(outDir, `step-${String(step + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: screenshotPath })
      console.log(`[inspect] wrote ${path.relative(ROOT, screenshotPath)}`)

      const boxes = await collectOverlapCandidates(page)
      for (const [a, b] of findOverlaps(boxes)) {
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
        await page.waitForTimeout(settleMs)
      }
    }

    if (warnings.length > 0) {
      console.log(`\n[inspect] ${warnings.length} advisory warning(s):`)
      for (const warning of warnings) console.log(`  - ${warning}`)
    } else {
      console.log('\n[inspect] no advisory warnings')
    }
  } finally {
    if (browser) await browser.close()
    await killProcess(preview)
  }
}

main().catch((error) => {
  console.error(`[inspect] FAIL: ${error.stack ?? String(error)}`)
  process.exitCode = 1
})
