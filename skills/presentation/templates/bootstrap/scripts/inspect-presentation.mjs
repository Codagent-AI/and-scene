#!/usr/bin/env node
// Project-local screenshot + visual-quality helper for a single presentation.
//
// Usage:
//   node scripts/inspect-presentation.mjs <slug> [--steps=0,3,8] [--narrow]
//
// Starts a Vite dev server on 127.0.0.1, opens the presentation route, and for
// each requested step (default: every step) waits for entrance/layout motion to
// settle, then captures a screenshot to .presentation-inspect/<slug>/ and prints
// advisory warnings for:
//   - unmarked overlap between visible scene content and chrome (caption, toc,
//     progress, nav, header) — mark an element `data-presentation-allow-overlap`
//     to declare an overlap intentional and readable
//   - a progress dot or table-of-contents entry whose active state is not
//     visually distinct from its inactive siblings
//   - a missing, browser-default, or undersized attribution link
//
// Screenshots are written under a gitignored directory; nothing here is meant
// to be committed.

import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { stopServer, waitForServer } from './local-server.mjs'
import { resolveTargetSteps, screenshotFileName } from './step-targets.mjs'
import {
  checkAttribution,
  findIndistinctActiveState,
  findUnmarkedOverlaps,
} from './inspect-checks.mjs'

const HOST = '127.0.0.1'
const PORT = 5183
const BASE_URL = `http://${HOST}:${PORT}`
const SETTLE_MS = 1000

function parseArgs(argv) {
  const [slug, ...rest] = argv
  if (!slug || slug.startsWith('-')) {
    throw new Error('Usage: node scripts/inspect-presentation.mjs <slug> [--steps=0,3,8] [--narrow]')
  }
  const options = { slug, steps: null, narrow: false }
  for (const arg of rest) {
    if (arg === '--narrow') options.narrow = true
    else if (arg.startsWith('--steps=')) {
      options.steps = arg
        .slice('--steps='.length)
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value))
    }
  }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const outDir = path.join(process.cwd(), '.presentation-inspect', options.slug)
  await mkdir(outDir, { recursive: true })

  const devServer = spawn(
    'npx',
    ['vite', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { stdio: 'inherit', detached: true },
  )

  try {
    await waitForServer(BASE_URL)

    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({
        viewport: options.narrow ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      })
      await page.goto(`${BASE_URL}/${options.slug}`, { waitUntil: 'networkidle' })

      const chrome = page.locator('[data-step-count]').first()
      await chrome.waitFor({ state: 'attached', timeout: 10_000 })
      const stepCount = Number(await chrome.getAttribute('data-step-count'))
      const targetSteps = resolveTargetSteps(options.steps, stepCount)

      let currentIndex = 0
      let anyWarnings = false
      for (const targetIndex of targetSteps) {
        while (currentIndex < targetIndex) {
          await page.keyboard.press('ArrowRight')
          currentIndex += 1
        }
        await delay(SETTLE_MS)

        const screenshotPath = path.join(outDir, screenshotFileName(targetIndex, options.narrow))
        await page.screenshot({ path: screenshotPath })
        console.log(`captured ${screenshotPath}`)

        const warnings = [
          ...(await page.evaluate(findUnmarkedOverlaps)),
          ...(await page.evaluate(findIndistinctActiveState)),
          ...(await page.evaluate(checkAttribution)),
        ]
        for (const warning of warnings) {
          anyWarnings = true
          console.warn(`  [step ${targetIndex}] warning: ${warning}`)
        }
      }

      if (!anyWarnings) {
        console.log('\nNo advisory warnings.')
      }
    } finally {
      await browser.close()
    }
  } finally {
    stopServer(devServer)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
