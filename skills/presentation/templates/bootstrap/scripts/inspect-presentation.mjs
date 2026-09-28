#!/usr/bin/env node
/**
 * Project-local visual inspection helper.
 *
 * Usage: npm run inspect -- <slug> [--settle=700] [--viewport=1280x800]
 *
 * Captures a settled screenshot per step under `inspection/<slug>/step-N.png`
 * and prints advisory warnings for unmarked text/chrome overlap, visually
 * indistinct active navigation state, and unpolished attribution. Warnings
 * are advisory only — they do not fail the process.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { readRegistrySlugs, startPreviewServer, PROJECT_ROOT } from './lib/preview-server.mjs'

const ALLOW_OVERLAP_ATTR = 'data-presentation-allow-overlap'
const TEXT_SELECTOR = [
  '[data-presentation-caption]',
  '[data-presentation-step-title]',
  '[data-presentation-deck-title]',
  '[data-presentation-marker]',
  '[data-presentation-toc-item]',
  '[data-presentation-progress-dot]',
  '[data-presentation-box]',
  '[data-presentation-label]',
  '[data-presentation-symbol-chip-label]',
  '[data-presentation-attribution]',
].join(', ')

function parseArgs(argv) {
  const [slug, ...rest] = argv
  const options = { settleMs: 700, width: 1280, height: 800 }
  for (const arg of rest) {
    if (arg.startsWith('--settle=')) options.settleMs = Number(arg.slice('--settle='.length))
    if (arg.startsWith('--viewport=')) {
      const [w, h] = arg.slice('--viewport='.length).split('x').map(Number)
      if (w && h) {
        options.width = w
        options.height = h
      }
    }
  }
  return { slug, options }
}

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

async function collectWarnings(page, stepIndex) {
  return page.evaluate(
    ({ selector, allowAttr, index }) => {
      const warnings = []
      const nodes = Array.from(document.querySelectorAll(selector)).filter((el) => {
        const style = window.getComputedStyle(el)
        return style.visibility !== 'hidden' && style.display !== 'none' && el.textContent?.trim()
      })

      function allowsOverlap(el) {
        return el.closest(`[${allowAttr}]`) !== null
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]
          const b = nodes[j]
          if (a.contains(b) || b.contains(a)) continue
          if (allowsOverlap(a) || allowsOverlap(b)) continue
          const rectA = a.getBoundingClientRect()
          const rectB = b.getBoundingClientRect()
          const overlaps = rectA.left < rectB.right && rectA.right > rectB.left && rectA.top < rectB.bottom && rectA.bottom > rectB.top
          if (overlaps) {
            warnings.push(
              `step ${index}: unmarked overlap between "${a.textContent?.trim().slice(0, 30)}" and "${b.textContent?.trim().slice(0, 30)}"`,
            )
          }
        }
      }

      function checkActiveDistinction(activeSelector, label) {
        const active = document.querySelector(`${activeSelector}[data-presentation-active="true"]`)
        const inactive = document.querySelector(`${activeSelector}[data-presentation-active="false"]`)
        if (!active || !inactive) return
        const activeStyle = window.getComputedStyle(active)
        const inactiveStyle = window.getComputedStyle(inactive)
        const same =
          activeStyle.backgroundColor === inactiveStyle.backgroundColor &&
          activeStyle.color === inactiveStyle.color &&
          activeStyle.fontWeight === inactiveStyle.fontWeight &&
          activeStyle.borderColor === inactiveStyle.borderColor &&
          activeStyle.outlineStyle === inactiveStyle.outlineStyle
        if (same) {
          warnings.push(`step ${index}: ${label} active state is not visually distinct from inactive state`)
        }
      }

      checkActiveDistinction('[data-presentation-progress-dot]', 'progress indicator')
      checkActiveDistinction('[data-presentation-toc-item]', 'table-of-contents entry')

      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) {
        warnings.push(`step ${index}: attribution link is missing`)
      } else {
        const style = window.getComputedStyle(attribution)
        const fontSize = parseFloat(style.fontSize)
        const isBrowserDefaultBlue = style.color === 'rgb(0, 0, 238)'
        if (fontSize < 11 || isBrowserDefaultBlue) {
          warnings.push(`step ${index}: attribution link appears too small or browser-default; style it via its data hook`)
        }
      }

      return warnings
    },
    { selector: TEXT_SELECTOR, allowAttr: ALLOW_OVERLAP_ATTR, index: stepIndex },
  )
}

async function inspectSlug(chromium, baseUrl, entry, outDir, options) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: options.width, height: options.height } })
  const warnings = []

  await page.goto(`${baseUrl}/${entry.slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation-root]')
  await root.waitFor({ state: 'visible', timeout: 10_000 })
  const stepCount = Number(await root.getAttribute('data-step-count'))

  const slugDir = path.join(outDir, entry.slug)
  await mkdir(slugDir, { recursive: true })

  for (let index = 0; index < stepCount; index += 1) {
    await page.waitForTimeout(options.settleMs)
    const shotPath = path.join(slugDir, `step-${index}.png`)
    await page.screenshot({ path: shotPath })
    console.log(`[inspect] wrote ${path.relative(PROJECT_ROOT, shotPath)}`)
    warnings.push(...(await collectWarnings(page, index)))

    if (index < stepCount - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(
        (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
        index + 1,
        { timeout: 5_000 },
      )
    }
  }

  await browser.close()
  return warnings
}

async function main() {
  const { slug, options } = parseArgs(process.argv.slice(2))
  const registry = await readRegistrySlugs()
  const targets = slug ? registry.filter((entry) => entry.slug === slug) : registry

  if (targets.length === 0) {
    console.error(slug ? `[inspect] no registered presentation matches "${slug}"` : '[inspect] no presentations registered')
    process.exit(1)
  }

  const { chromium } = await import('playwright')
  const server = await startPreviewServer()
  const outDir = path.join(PROJECT_ROOT, 'inspection')

  try {
    let allWarnings = []
    for (const entry of targets) {
      console.log(`[inspect] capturing "${entry.slug}"...`)
      const warnings = await inspectSlug(chromium, server.baseUrl, entry, outDir, options)
      allWarnings = allWarnings.concat(warnings)
    }

    if (allWarnings.length > 0) {
      console.log('\n[inspect] advisory warnings:')
      for (const warning of allWarnings) console.log(`  - ${warning}`)
    } else {
      console.log('\n[inspect] no advisory warnings')
    }
  } finally {
    await server.stop()
  }
}

main().catch((error) => {
  console.error(`[inspect] error: ${error.stack ?? error}`)
  process.exit(1)
})
