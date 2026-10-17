#!/usr/bin/env node
// Build and browser-render verification. Exit code 0 means PASS; any failure prints
// `FAIL [<phase>]` (phases: build, sample, render, transition) and exits non-zero.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { HOST, launchBrowser, projectRoot, registeredSlugs, runBuild, startPreview } from './lib/preview.mjs'

const root = projectRoot(import.meta.url)
const TRANSITION_TIMEOUT_MS = 5000
const SETTLE_MS = 400

class Failure extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

const text = (page, selector) => page.locator(selector).first().textContent({ timeout: 2000 }).catch(() => null)

async function expectSampleStep(page, sample, i) {
  const expected = sample.steps[i]
  const actual = {
    era: await page.locator('[data-presentation-marker]').first().getAttribute('data-presentation-era'),
    title: await text(page, '[data-presentation-step-title]'),
    caption: await text(page, '[data-presentation-caption]'),
  }
  for (const key of ['era', 'title', 'caption']) {
    if (actual[key] !== expected[key]) {
      throw new Failure('sample', `step ${i} ${key} is ${JSON.stringify(actual[key])}, expected ${JSON.stringify(expected[key])}`, i)
    }
  }
}

async function renderPresentation(browser, origin, slug, sample) {
  const page = await browser.newPage()
  let current = 0
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push({ step: current, message: m.text() }))
  page.on('pageerror', (e) => errors.push({ step: current, message: e.message }))
  const checkErrors = () => {
    if (errors.length) throw new Failure('render', `${slug}: ${errors[0].message}`, errors[0].step)
  }
  const indexOf = () => page.locator('[data-step-count]').first().getAttribute('data-step-index', { timeout: 500 }).catch(() => null)

  await page.goto(`${origin}/${slug}`)
  try {
    await page.waitForSelector('[data-step-count]', { timeout: 10000 })
  } catch {
    checkErrors()
    throw new Failure('render', `${slug}: presentation chrome did not render`, 0)
  }
  const count = Number(await page.locator('[data-step-count]').first().getAttribute('data-step-count'))
  if (!(count >= 1)) throw new Failure('render', `${slug}: invalid data-step-count`, 0)
  if (sample) {
    if (count !== sample.steps.length) throw new Failure('sample', `${slug}: ${count} steps, expected ${sample.steps.length}`, 0)
    if ((await page.locator('[data-presentation-mode]').first().getAttribute('data-presentation-mode')) !== 'browse') {
      await page.keyboard.press('p')
    }
  }
  for (let i = 0; i < count; i++) {
    current = i
    await page.waitForTimeout(SETTLE_MS)
    checkErrors()
    if (sample) await expectSampleStep(page, sample, i)
    if (i === count - 1) break
    current = i + 1
    await page.keyboard.press('ArrowRight')
    const deadline = Date.now() + TRANSITION_TIMEOUT_MS
    while ((await indexOf()) !== String(i + 1)) {
      if (Date.now() > deadline) {
        checkErrors()
        throw new Failure('transition', `${slug}: step index did not advance to ${i + 1}`, i + 1)
      }
      await page.waitForTimeout(50)
    }
  }
  console.log(`ok   ${slug}: rendered ${count} steps`)
  await page.close()
}

async function main() {
  const config = JSON.parse(readFileSync(path.join(root, 'scripts/verify.config.json'), 'utf8'))
  const sample = config.referenceSample ?? null

  const build = await runBuild(root)
  if (!build.ok) throw new Failure('build', `npm run build failed\n${build.output}`)
  console.log('ok   build')

  const slugs = registeredSlugs(root)
  if (sample && !slugs.includes(sample.slug)) {
    throw new Failure('sample', `reference sample "${sample.slug}" is not registered in src/presentations/index.ts`)
  }
  if (slugs.length === 0) throw new Failure('sample', 'no presentations are registered')
  console.log(`ok   registry: ${slugs.join(', ')}`)

  const preview = await startPreview(root)
  console.log(`ok   preview on ${preview.origin} (${HOST})`)
  let browser
  try {
    browser = await launchBrowser(root)
    for (const slug of slugs) {
      await renderPresentation(browser, preview.origin, slug, sample && slug === sample.slug ? sample : null)
    }
  } finally {
    await browser?.close()
    preview.stop()
  }
}

main().then(
  () => {
    console.log('PASS')
    process.exit(0)
  },
  (error) => {
    if (error instanceof Failure) {
      const where = error.step === undefined ? '' : ` step ${error.step}:`
      console.error(`FAIL [${error.phase}]${where} ${error.message}`)
    } else {
      console.error(`FAIL [render] ${error.stack ?? error}`)
    }
    process.exit(1)
  },
)
