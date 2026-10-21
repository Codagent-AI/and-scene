#!/usr/bin/env node
// Build the whole app, confirm the reference sample, and render every step of it
// in Chromium against a production preview. Exits non-zero on any failure.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { HOST, PROJECT_ROOT, launchBrowser, readRegistry, runBuild, startPreview } from './lib/project.mjs'
import { checkAdvance, diffStep, formatError, selectTarget } from './lib/verify-core.mjs'

const SETTLE_MS = 800
const STEP_TIMEOUT_MS = 4000

class PhaseError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

async function phase(name, fn) {
  try {
    const result = await fn()
    console.log(`[verify] ${name}: ok`)
    return result
  } catch (error) {
    if (error instanceof PhaseError) throw error
    throw new PhaseError(name, error instanceof Error ? error.message : String(error))
  }
}

async function readConfig() {
  const raw = await readFile(path.join(PROJECT_ROOT, 'scripts/verify.config.json'), 'utf8')
  return JSON.parse(raw)
}

async function waitForIndex(page, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const value = await page.getAttribute('[data-presentation-root]', 'data-step-index', { timeout: 250 }).catch(() => null)
    const index = value === null ? null : Number(value)
    if (predicate(index)) return index
    if (Date.now() > deadline) return index
    await page.waitForTimeout(50)
  }
}

async function readStep(page) {
  return page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? null
    return {
      era: text('[data-presentation-era]'),
      title: text('[data-presentation-title]'),
      caption: text('[data-presentation-caption]'),
    }
  })
}

async function renderRoute(url, slug, expected) {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    let current = 0
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(formatError('console error', current, message.text()))
    })
    page.on('pageerror', (error) => errors.push(formatError('uncaught error', current, error.message)))
    const fail = (message) => {
      throw new PhaseError('render', [message, ...errors].join('\n  '))
    }
    const checkErrors = () => {
      if (errors.length > 0) fail(`step ${current} reported browser errors`)
    }

    await page.goto(`${url}/${slug}`)
    const root = await page.waitForSelector('[data-presentation-root]', { timeout: 10000 }).catch(() => null)
    if (!root) fail(`step 0 did not render at ${url}/${slug}`)
    const count = Number(await page.getAttribute('[data-presentation-root]', 'data-step-count'))
    if (expected && count !== expected.length) fail(`found ${count} steps, expected ${expected.length}`)
    if (expected && (await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== 'browse') {
      await page.keyboard.press('p')
    }

    for (let i = 0; i < count; i++) {
      current = i
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        const reached = await waitForIndex(page, (v) => v !== i - 1, STEP_TIMEOUT_MS)
        if (reached === null) fail(`step ${i} did not render (presentation unmounted)`)
        const problem = checkAdvance(i - 1, reached)
        if (problem) fail(`transition to step ${i} failed: ${problem}`)
      }
      if (expected) {
        const mismatch = diffStep(expected[i], await readStep(page))
        if (mismatch) fail(`step ${i}: ${mismatch}`)
      }
      await page.waitForTimeout(SETTLE_MS)
      checkErrors()
    }
    return count
  } finally {
    await browser.close()
  }
}

async function main() {
  const config = await readConfig()
  await phase('build', async () => {
    const result = await runBuild(PROJECT_ROOT)
    if (result.code !== 0) {
      throw new PhaseError('build', `npm run build failed:\n${result.output.split('\n').slice(-40).join('\n')}`)
    }
  })
  const target = await phase('sample', async () => selectTarget(await readRegistry(PROJECT_ROOT), config.sample))
  const preview = await startPreview(PROJECT_ROOT)
  try {
    console.log(`[verify] preview: ${preview.url} (${HOST})`)
    const steps = await phase('render', () => renderRoute(preview.url, target.slug, target.expected))
    console.log(`verify: PASS (build, sample, render: ${steps} steps of "${target.slug}")`)
  } finally {
    await preview.stop()
  }
}

main().catch((error) => {
  const name = error instanceof PhaseError ? error.phase : 'verify'
  console.error(`verify: FAIL (${name})\n  ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
