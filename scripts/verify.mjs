#!/usr/bin/env node
// Build + browser-render verification: `npm run verify`.
import { chromium } from 'playwright'
import { expectations } from './verify.expectations.mjs'
import { HOST, PhaseError, projectRoot, readRegistry, runBuild, startPreview, waitForStepIndex } from './lib/preview.mjs'
import { checkSample } from './lib/sample-check.mjs'

const root = projectRoot(import.meta.url)
const SETTLE_MS = 700
const STEP_TIMEOUT_MS = 5000

const log = (message) => console.log(`[verify] ${message}`)
const stepLabel = (index) => `step ${index + 1} (index ${index})`

async function renderPresentation(browser, base, slug, expected) {
  const page = await browser.newPage()
  let current = 0
  const errors = []
  // Listeners start before navigation and stay attached through the last step.
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ step: current, text: `console.error: ${message.text()}` })
  })
  page.on('pageerror', (error) => errors.push({ step: current, text: `uncaught exception: ${error.message}` }))
  const assertClean = () => {
    if (errors.length > 0) {
      const [{ step, text }] = errors
      throw new PhaseError('render', `${slug}: ${text} at ${stepLabel(step)}`)
    }
  }

  const url = `http://${HOST}:${new URL(base).port}/${slug}`
  log(`opening ${url}`)
  await page.goto(url, { waitUntil: 'load' })
  try {
    await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS * 2 })
  } catch {
    assertClean()
    throw new PhaseError('render', `${slug}: presentation did not render a step (no data-step-count hook)`)
  }
  const root = page.locator('[data-presentation-root]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (expected) {
    const problem = checkSample.count(expected, count)
    if (problem) throw new PhaseError('sample', `${slug}: ${problem}`)
    if ((await root.getAttribute('data-presentation-mode')) !== 'browse') await page.keyboard.press('p')
  }

  for (let index = 0; index < count; index++) {
    current = index
    try {
      await waitForStepIndex(page, index, STEP_TIMEOUT_MS)
    } catch {
      assertClean()
      throw new PhaseError('render', `${slug}: transition did not advance to ${stepLabel(index)}`)
    }
    await page.waitForTimeout(SETTLE_MS)
    assertClean()
    if (expected) {
      const actual = {
        title: (await page.locator('[data-presentation-title]').first().textContent())?.trim(),
        caption: (await page.locator('[data-presentation-caption]').first().textContent())?.trim(),
        era: (await page.locator('[data-presentation-era]').first().textContent())?.trim(),
      }
      const problem = checkSample.step(expected, index, actual)
      if (problem) throw new PhaseError('sample', `${slug}: ${problem} at ${stepLabel(index)}`)
    }
    log(`${slug}: ${stepLabel(index)} ok`)
    if (index < count - 1) {
      // errors raised while moving on belong to the step being entered
      current = index + 1
      await page.keyboard.press('ArrowRight')
    }
  }
  assertClean()
  await page.close()
  return count
}

async function main() {
  log('phase build: npm run build')
  const build = await runBuild(root)
  if (build.code !== 0) {
    throw new PhaseError('build', `npm run build failed (exit ${build.code})\n${build.output.trim().split('\n').slice(-25).join('\n')}`)
  }

  log('phase sample: registry')
  const registry = readRegistry(root)
  for (const expected of expectations) {
    const problem = checkSample.registered(expected, registry)
    if (problem) throw new PhaseError('sample', problem)
  }

  log('phase render: vite preview + chromium')
  let preview
  let browser
  try {
    preview = await startPreview(root, log)
    browser = await chromium.launch()
    let steps = 0
    for (const entry of registry) {
      const expected = expectations.find((candidate) => candidate.slug === entry.slug)
      steps += await renderPresentation(browser, preview.base, entry.slug, expected)
    }
    console.log(`PASS verify: build, sample, render (${registry.length} presentation(s), ${steps} step(s))`)
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(`FAIL verify [${error.phase ?? 'error'}]: ${error.message}`)
    process.exit(1)
  },
)
