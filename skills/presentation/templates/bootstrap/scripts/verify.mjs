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
//
// Exits non-zero with a description of the first failure.

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { stopServer, waitForServer } from './local-server.mjs'
import {
  countRegisteredSlugs,
  findDiscoveryFailures,
  readRegistrySource,
} from './registry-discovery.mjs'

const HOST = '127.0.0.1'
const PORT = 4173
const BASE_URL = `http://${HOST}:${PORT}`
const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_PATH = path.join(PROJECT_ROOT, 'src/presentations/index.ts')

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
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(`console.error on /${slug}: ${message.text()}`)
  }
  const onPageError = (error) => {
    errors.push(`uncaught page error on /${slug}: ${error.message}`)
  }
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  try {
    await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-step-count]').first()
    await chrome.waitFor({ state: 'attached', timeout: 10_000 })

    const stepCount = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(stepCount) || stepCount < 1) {
      errors.push(`/${slug}: invalid data-step-count "${await chrome.getAttribute('data-step-count')}"`)
      return errors
    }

    for (let expectedIndex = 0; expectedIndex < stepCount; expectedIndex += 1) {
      const actualIndex = Number(await chrome.getAttribute('data-step-index'))
      if (actualIndex !== expectedIndex) {
        errors.push(
          `/${slug}: expected data-step-index ${expectedIndex} but found ${actualIndex}`,
        )
        return errors
      }
      if (expectedIndex < stepCount - 1) {
        await page.keyboard.press('ArrowRight')
        await delay(50)
      }
    }
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
  }

  return errors
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

      const registeredCount = countRegisteredSlugs(await readRegistrySource(REGISTRY_PATH))
      failures.push(...findDiscoveryFailures(registeredCount, slugs))

      if (slugs.length === 0 && registeredCount === 0) {
        console.warn('No presentations registered in src/presentations/index.ts; skipping render checks.')
      }

      for (const slug of slugs) {
        const slugFailures = await verifyPresentation(page, slug)
        failures.push(...slugFailures)
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
