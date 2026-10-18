#!/usr/bin/env node
// `npm run verify`: build the whole app, check the required presentations are registered, then
// open every registered route in Chromium against a production preview and step through it.
// App-owned expectations live in verify.config.json, so this script is identical in every app.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { HOST, PhaseError, runBuild, startPreview } from './lib/preview.mjs'

export const STEP_TIMEOUT_MS = 5000
export const SETTLE_MS = 400
const CONFIG_FILE = 'verify.config.json'

/** @param {unknown} config @returns {{ presentations: { slug: string, title?: string, steps?: { era: string, title: string, caption: string }[] }[] }} */
export function validateConfig(config) {
  const bad = (m) => new PhaseError('sample', `${CONFIG_FILE}: ${m}`)
  if (!config || typeof config !== 'object' || !Array.isArray(config.presentations) || config.presentations.length === 0) {
    throw bad('"presentations" must list at least one required presentation')
  }
  config.presentations.forEach((p, i) => {
    if (!p || typeof p.slug !== 'string' || !p.slug) throw bad(`presentations[${i}].slug must be a non-empty string`)
    if (p.title !== undefined && typeof p.title !== 'string') throw bad(`${p.slug}: title must be a string`)
    if (p.steps !== undefined) {
      if (!Array.isArray(p.steps) || p.steps.length === 0) throw bad(`${p.slug}: steps must be a non-empty array`)
      p.steps.forEach((s, n) => {
        for (const k of ['era', 'title', 'caption']) {
          if (typeof s?.[k] !== 'string' || !s[k]) throw bad(`${p.slug}: steps[${n}].${k} must be a non-empty string`)
        }
      })
    }
  })
  return config
}

/** Read `{ slug, title }` pairs out of the explicit registry source. */
export function parseRegistry(source) {
  const entries = []
  const re = /slug:\s*(['"])(.+?)\1[\s\S]*?title:\s*(['"])(.+?)\3/g
  for (const m of source.matchAll(re)) entries.push({ slug: m[2], title: m[4] })
  return entries
}

/** Every required presentation must be registered (with its title). Throws the first failure. */
export function checkRequired(config, registry) {
  const slugs = registry.map((e) => e.slug)
  const dup = slugs.find((s, i) => slugs.indexOf(s) !== i)
  if (dup) throw new PhaseError('sample', `duplicate registry slug "${dup}"`)
  for (const req of config.presentations) {
    const entry = registry.find((e) => e.slug === req.slug)
    if (!entry) throw new PhaseError('sample', `required presentation "${req.slug}" is not registered in the presentation index`)
    if (req.title !== undefined && entry.title !== req.title) {
      throw new PhaseError('sample', `"${req.slug}" is registered as "${entry.title}", expected "${req.title}"`)
    }
  }
}

/** Compare observed per-step narration with the required steps; returns the first mismatch or null. */
export function compareStep(expected, observed, index) {
  if (!expected) return null
  for (const k of ['era', 'title', 'caption']) {
    if (observed[k] !== expected[k]) {
      return `step ${index + 1} ${k}: expected ${JSON.stringify(expected[k])}, saw ${JSON.stringify(observed[k])}`
    }
  }
  return null
}

/** Collect console errors and uncaught page errors from before navigation onwards. */
export function trackErrors(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`uncaught error: ${err.message ?? err}`))
  return errors
}

const readStep = (page) =>
  page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent ?? null
    return {
      index: Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')),
      era: document.querySelector('[data-presentation-marker]')?.getAttribute('data-presentation-era') ?? null,
      title: text('[data-presentation-title]'),
      caption: text('[data-presentation-caption]'),
    }
  })

const settle = (page) => page.waitForTimeout(SETTLE_MS)

/** Step through one route; throws a PhaseError('render') naming the offending step. */
export async function renderRoute(page, url, slug, expectedSteps, errors) {
  const fail = (message, step) => new PhaseError('render', `${slug}: ${message}`, step)
  const reported = () => (errors.length ? errors[0] : null)
  await page.goto(url, { waitUntil: 'load' })
  if (new URL(page.url()).hostname !== HOST) throw fail(`browser left ${HOST}: ${page.url()}`)
  try {
    await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
  } catch {
    throw fail(reported() ?? 'no [data-step-count] hook rendered', 0)
  }
  const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw fail(`invalid step count ${count}`)
  if (expectedSteps && expectedSteps.length !== count) throw fail(`expected ${expectedSteps.length} steps, found ${count}`)
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          (n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n),
          i,
          { timeout: STEP_TIMEOUT_MS },
        )
      } catch {
        throw fail(`transition failed: step index did not advance to ${i + 1} of ${count}${reported() ? ` (${reported()})` : ''}`, i)
      }
    }
    await settle(page)
    if (errors.length) throw fail(errors[0], i)
    const mismatch = compareStep(expectedSteps?.[i], await readStep(page), i)
    if (mismatch) throw fail(mismatch, i)
  }
  return count
}

export async function main(root) {
  const log = (phase, message) => console.log(`[${phase}] ${message}`)
  let preview
  let browser
  try {
    log('build', 'npm run build')
    await runBuild(root)
    log('build', 'ok')

    let config
    try {
      config = validateConfig(JSON.parse(await readFile(path.join(root, CONFIG_FILE), 'utf8')))
    } catch (e) {
      if (e instanceof PhaseError) throw e
      throw new PhaseError('sample', `${CONFIG_FILE} could not be read: ${e.message}`)
    }
    let source
    try {
      source = await readFile(path.join(root, 'src/presentations/index.ts'), 'utf8')
    } catch (e) {
      throw new PhaseError('sample', `presentation index missing: ${e.message}`)
    }
    const registry = parseRegistry(source)
    checkRequired(config, registry)
    log('sample', `${config.presentations.map((p) => p.slug).join(', ')} registered`)

    preview = await startPreview(root)
    log('render', `preview ${preview.origin}`)
    const { chromium } = await import('playwright')
    browser = await chromium.launch()
    for (const entry of registry) {
      const page = await browser.newPage()
      const errors = trackErrors(page)
      const url = `${preview.origin}/${entry.slug}`
      const required = config.presentations.find((p) => p.slug === entry.slug)
      const count = await renderRoute(page, url, entry.slug, required?.steps, errors)
      log('render', `${url} ${count} steps ok`)
      await page.close()
    }
    console.log(`PASS verify: build, sample, render (${registry.length} presentation${registry.length === 1 ? '' : 's'})`)
    return 0
  } catch (e) {
    if (e instanceof PhaseError) {
      const where = e.step === undefined ? '' : ` (step ${e.step + 1})`
      console.error(`FAIL verify [${e.phase}]${where}: ${e.message}`)
    } else {
      console.error(`FAIL verify [internal]: ${e?.stack ?? e}`)
    }
    return 1
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const stop = () => process.exit(130)
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  process.exitCode = await main(root)
}
