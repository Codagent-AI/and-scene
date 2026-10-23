#!/usr/bin/env node
// `npm run verify`: build the whole app, check the reference sample, then render every
// registered presentation step by step in Chromium over a production preview.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { previewUrl, startPreview } from './lib/preview.mjs'
import { checkAdvance, compareSample, describeErrors, findRegistryFile, formatFailure, isBottomRight, parseRegistry, VerifyError } from './lib/verify-core.mjs'

const root = path.resolve(import.meta.dirname, '..')
const log = (line) => console.log(`[verify] ${line}`)
const SETTLE_MS = 500
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function buildPhase() {
  log('build: npm run build')
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    const tail = `${result.stdout}\n${result.stderr}`.trim().split('\n').slice(-40).join('\n')
    throw new VerifyError('build', `npm run build failed (exit ${result.status})\n${tail}`)
  }
  log('build: ok')
}

function readReference() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  const slug = pkg.andScene?.referenceSample
  if (!slug) return null
  const file = path.join(root, 'scripts', 'reference-sample.json')
  if (!fs.existsSync(file)) throw new VerifyError('sample', `package.json names reference sample "${slug}" but ${file} is missing`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function readRegistry() {
  const folder = path.join(root, 'src', 'presentations')
  const names = fs.existsSync(folder) ? fs.readdirSync(folder) : []
  const name = findRegistryFile(names, (f) => fs.readFileSync(path.join(folder, f), 'utf8'))
  if (!name) throw new VerifyError('sample', `no presentation index found in ${folder}`)
  return parseRegistry(fs.readFileSync(path.join(folder, name), 'utf8'))
}

function samplePhase(reference, registry) {
  if (!reference) {
    log('sample: no reference sample configured, skipping')
    return
  }
  const dir = path.join(root, 'src', 'presentations', reference.dir ?? reference.slug)
  if (!registry.some((e) => e.slug === reference.slug)) {
    throw new VerifyError('sample', `reference sample "${reference.slug}" is not registered in src/presentations/index.ts`)
  }
  if (!fs.existsSync(path.join(dir, 'Talk.tsx'))) throw new VerifyError('sample', `reference sample folder ${dir} has no Talk.tsx`)
  log(`sample: "${reference.slug}" is registered`)
}

async function readStep(page) {
  const text = async (selector) => (await page.locator(selector).first().textContent({ timeout: 2000 }).catch(() => null))?.trim() ?? null
  const era = await text('[data-presentation-era]')
  let title = await text('[data-presentation-title]')
  let caption = await text('[data-presentation-caption]')
  if (caption === null) {
    // present mode hides captions: peek at browse mode and come back
    await page.keyboard.press('p')
    await sleep(100)
    caption = await text('[data-presentation-caption]')
    title ??= await text('[data-presentation-title]')
    await page.keyboard.press('p')
    await sleep(100)
  }
  return { era, title, caption }
}

async function renderPresentation(browser, port, slug, reference) {
  const url = previewUrl(port, `/${slug}`)
  log(`render: ${url}`)
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  let currentStep = 0
  const errors = []
  page.on('console', (message) => message.type() === 'error' && errors.push({ step: currentStep, kind: 'console.error', text: message.text() }))
  page.on('pageerror', (error) => errors.push({ step: currentStep, kind: 'pageerror', text: String(error) }))
  const fail = (message, step = currentStep) => {
    throw new VerifyError('render', `${slug}: ${message}`, step)
  }
  const failOnErrors = () => {
    const found = describeErrors(errors)
    if (found) fail(found.message, found.step)
  }

  try {
    await page.goto(url, { waitUntil: 'load' })
    const root = page.locator('[data-step-count]')
    try {
      await root.waitFor({ timeout: 10_000 })
    } catch {
      failOnErrors()
      fail('first step did not render (no [data-step-count] hook)')
    }
    const count = Number(await root.getAttribute('data-step-count'))
    if (!(count > 0)) fail(`step count is ${count}`)
    // read without waiting: a scene that throws removes the hook, and the recorded error must win
    const readIndex = () => page.evaluate(() => Number(document.querySelector('[data-step-count]')?.getAttribute('data-step-index') ?? NaN))
    const steps = []

    for (let i = 0; i < count; i++) {
      currentStep = i
      const index = await readIndex()
      failOnErrors()
      if (index !== i) fail(`expected step index ${i}, observed ${index}`)
      await sleep(SETTLE_MS)
      failOnErrors()
      if (i === 0) {
        const attribution = await page.locator('[data-presentation-attribution]').first().boundingBox().catch(() => null)
        if (!attribution) log(`render: ${slug} shows no attribution link (expected unless the presentation passes attribution={null})`)
        else if (!isBottomRight(attribution, page.viewportSize())) fail('attribution is not in the bottom-right corner')
      }
      if (reference && slug === reference.slug) steps.push(await readStep(page))
      if (i < count - 1) {
        currentStep = i + 1
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((want) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(want), i + 1, { timeout: 3000 }).catch(() => {})
        failOnErrors()
        const observed = await readIndex()
        if (Number.isNaN(observed)) fail('the step hook disappeared after advancing (the scene stopped rendering)', i + 1)
        const problem = checkAdvance(i, observed)
        if (problem) fail(`transition did not advance: ${problem}`, i + 1)
      }
    }
    failOnErrors()
    return { count, steps }
  } finally {
    await page.close()
  }
}

async function renderPhase(reference, registry) {
  if (registry.length === 0) throw new VerifyError('render', 'no presentations are registered')
  const preview = await startPreview(root, log).catch((error) => {
    throw new VerifyError('render', error.message)
  })
  let browser
  try {
    browser = await chromium.launch()
    let total = 0
    for (const { slug } of registry) {
      const { count, steps } = await renderPresentation(browser, preview.port, slug, reference)
      total += count
      if (reference && slug === reference.slug) {
        const problems = compareSample(reference, { registry, steps })
        if (problems.length > 0) throw new VerifyError('sample', `${problems.join('; ')}`)
        log(`sample: ${steps.length} steps match the normative outline`)
      }
    }
    return total
  } finally {
    await browser?.close()
    await preview.stop()
    log('preview: stopped')
  }
}

try {
  buildPhase()
  const reference = readReference()
  const registry = readRegistry()
  samplePhase(reference, registry)
  const steps = await renderPhase(reference, registry)
  console.log(`VERIFY PASS: build, sample, render (${registry.length} presentation(s), ${steps} step(s))`)
} catch (error) {
  if (error instanceof VerifyError) console.error(formatFailure(error))
  else console.error(`VERIFY FAIL [internal]: ${error?.stack ?? error}`)
  process.exitCode = 1
}
