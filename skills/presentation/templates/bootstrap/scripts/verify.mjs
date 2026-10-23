#!/usr/bin/env node
// Deterministic verification: build the whole app, check the reference sample,
// then render every step of every registered presentation in Chromium against a
// production preview on 127.0.0.1. Exits non-zero, naming the phase, on failure.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { runBuild, tail } from './lib/build.mjs'
import { compareOutline, checkRegistration } from './lib/outline.mjs'
import { freePort, HOST, startPreview, waitForReady } from './lib/preview.mjs'

export class PhaseFailure extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

async function build(root) {
  let result
  try {
    result = await runBuild(root)
  } catch (err) {
    throw new PhaseFailure('build', `could not run npm run build: ${err.message}`)
  }
  if (result.code !== 0) throw new PhaseFailure('build', `npm run build exited with code ${result.code}\n${tail(result.output)}`)
}

function readConfig(root) {
  const file = path.join(root, 'verify.config.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
}

async function checkSample(root, log) {
  const { createServer } = await import('vite')
  const server = await createServer({ root, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true, hmr: false, ws: false } })
  try {
    let registry
    try {
      registry = (await server.ssrLoadModule('/src/presentations/index.ts')).presentations
    } catch (err) {
      throw new PhaseFailure('sample', `could not load the presentation registry: ${err.message}`)
    }
    if (!Array.isArray(registry) || registry.length === 0) {
      throw new PhaseFailure('sample', 'no presentations are registered in src/presentations/index.ts')
    }
    const { reference } = readConfig(root)
    if (reference) {
      const problems = checkRegistration(registry, reference)
      if (problems.length === 0) {
        try {
          const { STEPS } = await server.ssrLoadModule(`/src/presentations/${reference.slug}/steps/index.ts`)
          problems.push(...compareOutline(STEPS, reference.steps))
        } catch (err) {
          problems.push(`could not load the reference steps: ${err.message}`)
        }
      }
      if (problems.length > 0) {
        throw new PhaseFailure('sample', `reference presentation "${reference.slug}" does not match the outline:\n  - ${problems.join('\n  - ')}`)
      }
      log(`sample: "${reference.slug}" is registered and matches its ${reference.steps.length}-step outline`)
    }
    return { slugs: registry.map((e) => e.slug), reference }
  } finally {
    await server.close()
  }
}

async function renderPresentation(browser, origin, slug, reference, { settleMs, log }) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`uncaught page error: ${e.message}`))
  const url = `${origin}/${slug}`
  const fail = (i, count, detail) => {
    throw new PhaseFailure('render', `"${slug}" step index ${i}${count ? ` (step ${i + 1} of ${count})` : ''}: ${detail}`)
  }
  try {
    log(`render: opening ${url}`)
    await page.goto(url, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 10000 })
    } catch {
      fail(0, 0, `route did not render a presentation${errors.length ? `: ${errors.join('; ')}` : ''}`)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (!(count > 0)) fail(0, count, 'data-step-count is not a positive number')
    const seen = []
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i, { timeout: 4000 })
        } catch {
          if (errors.length) fail(i, count, errors.join('; '))
          fail(i, count, `ArrowRight from index ${i - 1} did not advance data-step-index to ${i}`)
        }
      }
      await page.waitForTimeout(settleMs)
      if (errors.length) fail(i, count, errors.join('; '))
      const actual = await page.getAttribute('[data-step-index]', 'data-step-index')
      if (actual !== String(i)) fail(i, count, `data-step-index is ${actual}`)
      if (reference && reference.slug === slug) {
        const want = reference.steps[i]
        const got = {
          era: await page.textContent('[data-presentation-era]'),
          title: await page.textContent('[data-presentation-title]'),
          caption: await page.textContent('[data-presentation-caption]'),
        }
        for (const k of ['era', 'title', 'caption']) {
          if (want && got[k] !== want[k]) fail(i, count, `visible ${k} ${JSON.stringify(got[k])} should be ${JSON.stringify(want[k])}`)
        }
      }
      seen.push(i)
    }
    log(`render: "${slug}" observed step indices ${seen.join(',')} with no console or page errors`)
    return count
  } finally {
    await page.close()
  }
}

export async function verify({ root = process.cwd(), port, settleMs = 700, log = console.log } = {}) {
  log('verify: build')
  await build(root)
  log('build: ok')
  const { slugs, reference } = await checkSample(root, log)

  let preview
  let browser
  try {
    const p = port ?? (await freePort())
    try {
      preview = await startPreview(root, p)
      await waitForReady(`${preview.origin}/`)
    } catch (err) {
      throw new PhaseFailure('render', `could not start the production preview on ${HOST}:${p}: ${err.message}`)
    }
    log(`render: preview host ${HOST} port ${p}; readiness probe ${preview.origin}/`)
    try {
      const { chromium } = await import('playwright')
      browser = await chromium.launch()
    } catch (err) {
      throw new PhaseFailure('render', `could not launch Chromium: ${err.message}`)
    }
    let steps = 0
    for (const slug of slugs) steps += await renderPresentation(browser, preview.origin, slug, reference, { settleMs, log })
    return { presentations: slugs.length, steps }
  } finally {
    await browser?.close().catch(() => {})
    await preview?.close().catch(() => {})
  }
}

async function main() {
  const args = process.argv.slice(2)
  const portArg = args.indexOf('--port')
  try {
    const result = await verify({ port: portArg >= 0 ? Number(args[portArg + 1]) : undefined })
    console.log(`PASS verify: build, sample and render checks passed (${result.presentations} presentation(s), ${result.steps} step(s))`)
    process.exit(0)
  } catch (err) {
    const phase = err instanceof PhaseFailure ? err.phase : 'verify'
    console.error(`FAIL [${phase}] ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
