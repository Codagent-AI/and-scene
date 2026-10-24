#!/usr/bin/env node
// Build the whole app, then render every registered presentation step by step
// in Chromium against a production preview on 127.0.0.1. Exits non-zero on failure.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { readRegistrySlugs, runBuild, startPreview } from './lib.mjs'

const root = process.cwd()
const STEP_TIMEOUT_MS = 4000
const SETTLE_MS = 150

class CheckFailure extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

const log = (msg) => console.log(`[verify] ${msg}`)

function loadReference() {
  const file = path.join(root, 'scripts/reference-outline.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

async function renderPresentation(browser, baseUrl, slug, reference) {
  const page = await browser.newPage()
  let currentStep = 'load'
  const problems = []
  page.on('console', (m) => m.type() === 'error' && problems.push(`console.error at step ${currentStep}: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`uncaught exception at step ${currentStep}: ${e.message}`))
  const assertClean = () => {
    if (problems.length) throw new CheckFailure('render', `${slug}: ${problems[0]}`)
  }
  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
    } catch {
      assertClean()
      throw new CheckFailure('render', `${slug}: first step did not render (no [data-step-count] hook)`)
    }
    const hook = page.locator('[data-step-count]')
    const count = Number(await hook.getAttribute('data-step-count'))
    if (!(count > 0)) throw new CheckFailure('render', `${slug}: step count is ${count}`)
    if (reference && count !== reference.steps.length) {
      throw new CheckFailure('sample', `${slug}: expected ${reference.steps.length} steps, found ${count}`)
    }
    for (let i = 0; i < count; i++) {
      currentStep = String(i)
      const index = Number(await hook.getAttribute('data-step-index'))
      if (index !== i) throw new CheckFailure('render', `${slug}: step ${i}: expected step index ${i}, saw ${index}`)
      if (reference) {
        const want = reference.steps[i]
        const title = await page.locator('[data-presentation-step-title]').first().textContent()
        const caption = await page.locator('[data-presentation-step-caption]').first().textContent()
        if (title !== want.title || caption !== want.caption) {
          throw new CheckFailure('sample', `${slug}: step ${i}: title/caption do not match the reference outline (got "${title}" / "${caption}")`)
        }
      }
      await page.waitForTimeout(SETTLE_MS)
      assertClean()
      if (i < count - 1) {
        currentStep = String(i + 1) // errors raised by the transition belong to the step being entered
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (n) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(n),
            i + 1,
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          assertClean()
          throw new CheckFailure('render', `${slug}: step ${i}: transition to step ${i + 1} did not advance data-step-index`)
        }
      }
    }
    log(`${slug}: rendered ${count} steps without errors`)
  } finally {
    await page.close()
  }
}

async function main() {
  log('phase build: npm run build')
  const build = await runBuild(root)
  if (build.code !== 0) throw new CheckFailure('build', `npm run build failed (exit ${build.code}):\n${build.out}`)

  const reference = loadReference()
  const slugs = readRegistrySlugs(root)
  if (reference && !slugs.includes(reference.slug)) {
    throw new CheckFailure('sample', `reference sample "${reference.slug}" is not registered in src/presentations/index.ts`)
  }
  if (slugs.length === 0) log('no presentations registered; nothing to render')

  let preview
  let browser
  try {
    preview = await startPreview(root)
    log(`preview ready at ${preview.url}`)
    browser = await chromium.launch()
    for (const slug of slugs) {
      await renderPresentation(browser, preview.url, slug, reference?.slug === slug ? reference : null)
    }
  } finally {
    await browser?.close()
    await preview?.stop()
  }
}

main().then(
  () => {
    log('PASS: build, registry, and render checks succeeded')
  },
  (err) => {
    const phase = err instanceof CheckFailure ? err.phase : 'unexpected'
    console.error(`[verify] FAIL (${phase}): ${err.message}`)
    process.exitCode = 1
  },
)
