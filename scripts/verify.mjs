#!/usr/bin/env node
// Deterministic build + browser-render verification for this presentation app.
//
// 1. Runs the production build (fails on any type/build error).
// 2. Starts `vite preview` on 127.0.0.1.
// 3. Opens the landing page, discovers every registered presentation from its
//    links, then opens each presentation route and steps through every step
//    using the `data-step-count` / `data-step-index` chrome hooks.
// 4. Fails on any console error, uncaught page error, or a step index that
//    does not advance, or if the registry declares presentations that landing
//    page discovery missed (which would otherwise skip every render check).
// 5. Asserts the canonical nine-step reference sample is registered and that
//    every step's title/caption matches the outline in
//    openspec/changes/create-and-scene/specs/presentation-verification/spec.md,
//    in order.
//
// Exits non-zero with a description of the first failure.

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { CANONICAL_SLUG, findCanonicalMismatches } from './canonical-sample.mjs'
import { stopServer, waitForServer } from './local-server.mjs'
import {
  describeDetachedChrome,
  formatStepLocation,
  readStepIndexSafely,
} from './verify-diagnostics.mjs'
import {
  findDiscoveryFailures,
  parseRegisteredSlugs,
  readRegistrySource,
} from './registry-discovery.mjs'

const HOST = '127.0.0.1'
const PORT = 4173
const BASE_URL = `http://${HOST}:${PORT}`
const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const CANONICAL_OUTLINE_PATH = path.join(
  REPO_ROOT,
  'src/presentations/how-to-make-a-presentation/canonical-outline.json',
)
const REGISTRY_PATH = path.join(REPO_ROOT, 'src/presentations/index.ts')

// The kit renders the active step's title in the header in browse mode and in
// the footer in present mode, so match whichever hook this presentation's mode
// actually mounted instead of blocking on one of them.
const TITLE_SELECTOR = '[data-presentation-header-title], [data-presentation-footer-title]'

/** Reads a hook's text, or '' when this mode does not mount it (no auto-wait). */
async function readOptionalText(page, selector) {
  const locator = page.locator(selector).first()
  if ((await locator.count()) === 0) return ''
  return (await locator.textContent())?.trim() ?? ''
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function discoverSlugs(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  const hrefs = await page
    .locator('[data-testid="presentation-registry"] a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
  return hrefs.filter(Boolean).map((href) => href.replace(/^\/+/, ''))
}

async function verifyPresentation(page, slug) {
  const errors = []
  const steps = []
  // Updated as the run advances so console/page errors name the failing step.
  let currentStep = 0
  const onConsole = (message) => {
    if (message.type() === 'error') {
      errors.push(`console.error on ${formatStepLocation(slug, currentStep)}: ${message.text()}`)
    }
  }
  const onPageError = (error) => {
    errors.push(`uncaught page error on ${formatStepLocation(slug, currentStep)}: ${error.message}`)
  }
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  try {
    await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-step-count]').first()
    try {
      await chrome.waitFor({ state: 'attached', timeout: 10_000 })
    } catch {
      errors.push(describeDetachedChrome(slug, currentStep))
      return { errors, steps }
    }

    const stepCount = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(stepCount) || stepCount < 1) {
      errors.push(`/${slug}: invalid data-step-count "${await chrome.getAttribute('data-step-count')}"`)
      return { errors, steps }
    }

    for (let expectedIndex = 0; expectedIndex < stepCount; expectedIndex += 1) {
      currentStep = expectedIndex
      const actualIndex = await readStepIndexSafely(chrome)
      if (actualIndex === null) {
        errors.push(describeDetachedChrome(slug, expectedIndex))
        return { errors, steps }
      }
      if (actualIndex !== expectedIndex) {
        errors.push(
          `/${slug}: expected data-step-index ${expectedIndex} but found ${actualIndex}`,
        )
        return { errors, steps }
      }

      const title = await readOptionalText(page, TITLE_SELECTOR)
      const caption = await readOptionalText(page, '[data-presentation-caption]')
      steps.push({ title, caption })

      if (expectedIndex < stepCount - 1) {
        // Attribute anything thrown by the incoming render to the step being
        // entered, not the one being left.
        currentStep = expectedIndex + 1
        await page.keyboard.press('ArrowRight')
        await delay(50)
      }
    }
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
  }

  return { errors, steps }
}

async function main() {
  await run('npm', ['run', 'build'])

  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { stdio: 'inherit', detached: true },
  )

  const failures = []
  try {
    await waitForServer(BASE_URL)

    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      const slugs = await discoverSlugs(page)

      const registeredSlugs = parseRegisteredSlugs(await readRegistrySource(REGISTRY_PATH))
      failures.push(...findDiscoveryFailures(registeredSlugs, slugs))

      if (slugs.length === 0 && registeredSlugs.length === 0) {
        console.warn('No presentations registered in src/presentations/index.ts; skipping render checks.')
      }

      if (!slugs.includes(CANONICAL_SLUG)) {
        failures.push(
          `canonical reference sample "${CANONICAL_SLUG}" is not registered/reachable in src/presentations/index.ts`,
        )
      }

      for (const slug of slugs) {
        const { errors, steps } = await verifyPresentation(page, slug)
        failures.push(...errors)

        if (slug === CANONICAL_SLUG && errors.length === 0) {
          const canonicalOutline = JSON.parse(await readFile(CANONICAL_OUTLINE_PATH, 'utf8'))
          failures.push(...findCanonicalMismatches(steps, canonicalOutline))
        }
      }
    } finally {
      await browser.close()
    }
  } finally {
    stopServer(preview)
  }

  if (failures.length > 0) {
    console.error('\nVerification failed:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exitCode = 1
    return
  }

  console.log('\nVerification passed: build succeeded and every registered presentation rendered all steps cleanly.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
