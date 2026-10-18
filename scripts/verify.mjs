#!/usr/bin/env node
// Build the whole app, check the reference sample, then render every registered presentation
// step by step in Chromium against a production preview on 127.0.0.1.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { HOST, projectRoot, readRegistrySlugs, resolvePort, runBuild, withPreview } from './lib.mjs'

const STEP_TIMEOUT_MS = 5000
const SETTLE_MS = 150

/** Normative reference sample: `scripts/reference-sample.json` -> { slug, steps: [{ era, title, caption }] }. */
export function loadReferenceSample(root) {
  const file = path.join(root, 'scripts/reference-sample.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

/** Problems found comparing the sample's step data with the normative table (empty when it matches). */
export function compareSteps(actual, expected) {
  const problems = []
  if (actual.length !== expected.length) {
    problems.push(`expected ${expected.length} steps but found ${actual.length}`)
  }
  expected.forEach((want, i) => {
    const got = actual[i]
    if (!got) return problems.push(`step ${i + 1} is missing`)
    for (const key of ['era', 'title', 'caption']) {
      if (got[key] !== want[key]) {
        problems.push(`step ${i + 1} ${key} is ${JSON.stringify(got[key])}, expected ${JSON.stringify(want[key])}`)
      }
    }
  })
  return problems
}

/** Check that the reference sample is registered, present, and matches the normative table in order. */
export async function checkSample(root) {
  const reference = loadReferenceSample(root)
  if (!reference) return []
  const { slug } = reference
  if (!readRegistrySlugs(root).includes(slug)) return [`reference sample "${slug}" is not registered in src/presentations/index.ts`]
  const meta = path.join(root, 'src/presentations', slug, 'meta.ts')
  if (!existsSync(meta)) return [`reference sample "${slug}" has no ${path.relative(root, meta)}`]
  let steps
  try {
    steps = (await import(`${pathToFileURL(meta).href}?t=${Date.now()}`)).STEP_META
  } catch (err) {
    return [`reference sample metadata could not be loaded: ${err.message}`]
  }
  if (!Array.isArray(steps)) return ['reference sample metadata does not export STEP_META']
  return compareSteps(steps, reference.steps)
}

/** Collects console errors and uncaught page errors, attributing each to the current step. */
export function createErrorCollector() {
  let step = 0
  const errors = []
  return {
    errors,
    setStep(index) {
      step = index
    },
    attach(page) {
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push({ step, message: `console.error: ${msg.text()}` })
      })
      page.on('pageerror', (err) => {
        errors.push({ step, message: `uncaught page error: ${err?.message ?? err}` })
      })
    },
  }
}

const readAttr = (page, name) => page.evaluate((n) => document.querySelector(`[${n}]`)?.getAttribute(n) ?? null, name)

/**
 * Open one presentation route and advance through every step with ArrowRight.
 * Returns failures as { step, message }; step is the zero-based index the failure belongs to.
 */
export async function verifyRoute(page, url, collector, expected) {
  collector.setStep(0)
  await page.goto(url)
  try {
    await page.waitForSelector('[data-step-count]', { timeout: STEP_TIMEOUT_MS })
  } catch {
    return [...collector.errors, { step: 0, message: 'presentation chrome ([data-step-count]) did not render' }]
  }
  const count = Number(await readAttr(page, 'data-step-count'))
  const failures = []
  if (!(count > 0)) return [{ step: 0, message: `invalid step count ${count}` }]
  if (expected && expected.length !== count) {
    failures.push({ step: 0, message: `expected ${expected.length} steps but chrome reports ${count}` })
  }
  const seen = []
  for (let i = 0; i < count; i++) {
    collector.setStep(i)
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction(
          (want) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(want),
          i,
          { timeout: STEP_TIMEOUT_MS },
        )
      } catch {
        const at = await readAttr(page, 'data-step-index')
        failures.push({ step: i, message: `transition did not advance to step index ${i} (still at ${at})` })
        break
      }
    }
    seen.push(Number(await readAttr(page, 'data-step-index')))
    const rendered = await page.evaluate(() => ({
      mode: document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode'),
      title: document.querySelector('[data-presentation-title]')?.textContent ?? '',
      caption: document.querySelector('[data-presentation-caption]')?.textContent ?? '',
    }))
    const want = expected?.[i]
    if (want && rendered.title !== want.title) {
      failures.push({ step: i, message: `rendered title ${JSON.stringify(rendered.title)}, expected ${JSON.stringify(want.title)}` })
    }
    if (rendered.mode === 'browse') {
      if (!rendered.caption.trim()) failures.push({ step: i, message: 'no caption rendered' })
      else if (want && rendered.caption !== want.caption) {
        failures.push({ step: i, message: `rendered caption ${JSON.stringify(rendered.caption)}, expected ${JSON.stringify(want.caption)}` })
      }
    }
    await page.waitForTimeout(SETTLE_MS)
  }
  if (!failures.length && seen.join() !== Array.from({ length: count }, (_, i) => i).join()) {
    failures.push({ step: 0, message: `step indices observed out of order: ${seen.join(',')}` })
  }
  return [...collector.errors, ...failures].sort((a, b) => a.step - b.step)
}

async function main() {
  const root = projectRoot()
  const log = (line) => console.log(`[verify] ${line}`)
  const fail = (phase, details) => {
    for (const line of details) console.error(`[verify] ${phase} FAILED: ${line}`)
    console.error(`VERIFY FAILED: ${phase}`)
    process.exit(1)
  }

  log('build: npm run build')
  const build = await runBuild(root)
  if (build.code !== 0) {
    fail('build', [`npm run build exited ${build.code}`, ...build.output.trim().split('\n').slice(-25)])
  }
  log('build: ok')

  const sampleProblems = await checkSample(root)
  if (sampleProblems.length) fail('sample', sampleProblems)
  const reference = loadReferenceSample(root)
  log(reference ? `sample: ${reference.slug} matches ${reference.steps.length} normative steps` : 'sample: no reference sample configured')

  const slugs = readRegistrySlugs(root)
  if (!slugs.length) fail('render', ['no presentations are registered in src/presentations/index.ts'])

  const port = await resolvePort()
  const failures = []
  try {
    await withPreview(root, port, async ({ baseUrl }) => {
      log(`preview: ${baseUrl}`)
      const browser = await chromium.launch()
      try {
        for (const slug of slugs) {
          const url = `${baseUrl}/${slug}`
          const page = await browser.newPage()
          const collector = createErrorCollector()
          collector.attach(page)
          log(`render: opening ${url}`)
          const expected = reference?.slug === slug ? reference.steps : undefined
          const found = await verifyRoute(page, url, collector, expected)
          for (const f of found) failures.push(`${url} at step index ${f.step}: ${f.message}`)
          if (!found.length) log(`render: ${slug} ok`)
          await page.close()
        }
      } finally {
        await browser.close()
      }
    })
  } catch (err) {
    failures.push(`preview/browser error: ${err.stack ?? err.message}`)
  }
  if (failures.length) fail('render', failures)
  console.log(`VERIFY PASSED: build, sample, render (${slugs.length} presentation(s) at ${HOST})`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`VERIFY FAILED: unexpected error: ${err.stack ?? err}`)
    process.exit(1)
  })
}
