#!/usr/bin/env node
// Deterministic build + browser-render verification.
//   node scripts/verify.mjs [--require-sample <slug>] [--step-timeout-ms N] [--settle-ms N]
// Phases: [build] -> [sample] (static registration) -> [render] (Chromium over `vite preview`).
// Exits 0 only when every phase passes; otherwise prints the failed phase (and step) and exits 1.
/* global document */
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { parseArgs, parsePositiveInt } from './lib/args.mjs'
import { SAMPLE_OUTLINE, validateOutline } from './lib/outline.mjs'
import { HOST, runBuild, startPreview } from './lib/preview.mjs'
import { parseRegistrySlugs, selectRoutes } from './lib/registry.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const log = (line) => console.log(line)

class VerifyError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

async function build() {
  log('[build] npm run build')
  try {
    await runBuild(ROOT)
  } catch (error) {
    const tail = String(error.output ?? '').trim().split('\n').slice(-25).join('\n')
    throw new VerifyError('build', `${error.message}\n${tail}`)
  }
  log('[build] ok')
}

async function readSlugs(requireSample) {
  let source
  try {
    source = await readFile(join(ROOT, 'src/presentations/index.ts'), 'utf8')
  } catch {
    throw new VerifyError('sample', 'src/presentations/index.ts is missing')
  }
  let slugs
  try {
    slugs = selectRoutes(parseRegistrySlugs(source), requireSample)
  } catch (error) {
    throw new VerifyError('sample', error.message)
  }
  log(`[sample] registered: ${slugs.join(', ')}`)
  return slugs
}

async function renderRoute(browser, base, slug, { requireSample, stepTimeoutMs, settleMs }) {
  const url = `${base}/${slug}`
  const page = await browser.newPage()
  let current = 0
  const errors = []
  // Attach listeners before navigating so errors during the first render are seen.
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ step: current, text: message.text() })
  })
  page.on('pageerror', (error) => errors.push({ step: current, text: `uncaught: ${error.message}` }))
  const checkErrors = () => {
    if (errors.length > 0) {
      const { step, text } = errors[0]
      throw new VerifyError('render', `${slug}: error at step ${step}: ${text}`, step)
    }
  }
  try {
    log(`[render] open ${url}`)
    await page.goto(url, { waitUntil: 'load' })
    try {
      await page.waitForSelector('[data-step-count]', { timeout: stepTimeoutMs })
    } catch {
      checkErrors()
      throw new VerifyError('render', `${slug}: no [data-step-count] hook rendered`, 0)
    }
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new VerifyError('render', `${slug}: invalid step count`, 0)
    const rendered = []
    for (let i = 0; i < count; i++) {
      current = i
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i, { timeout: stepTimeoutMs })
        } catch {
          checkErrors()
          const actual = await page.getAttribute('[data-step-index]', 'data-step-index').catch(() => null)
          throw new VerifyError('render', `${slug}: transition to step ${i} did not advance (data-step-index is ${actual})`, i)
        }
      }
      await page.waitForTimeout(settleMs)
      checkErrors()
      rendered.push({
        title: await page.textContent('[data-presentation-title]').catch(() => null),
        caption: await page.textContent('[data-presentation-caption]').catch(() => null),
      })
      log(`[render] ${slug} step ${i + 1}/${count} ok`)
    }
    if (slug === requireSample) {
      const problems = validateOutline(rendered, SAMPLE_OUTLINE)
      if (problems.length > 0) {
        const [first] = problems
        throw new VerifyError('sample', `${slug}: step ${first.index}: ${first.message}`, first.index)
      }
      log(`[sample] ${slug} matches the ${SAMPLE_OUTLINE.length}-step outline`)
    }
    checkErrors()
  } finally {
    await page.close()
  }
}

async function render(slugs, options) {
  const preview = await startPreview(ROOT, { log: (line) => log(`[render] ${line}`) })
  log(`[render] preview ${preview.url}/ (host ${HOST})`)
  let browser
  try {
    try {
      browser = await chromium.launch()
    } catch (error) {
      throw new VerifyError('render', `could not launch Chromium: ${error.message.split('\n')[0]}`)
    }
    for (const slug of slugs) await renderRoute(browser, preview.url, slug, options)
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { values: ['require-sample', 'step-timeout-ms', 'settle-ms'] })
  const options = {
    requireSample: args.values['require-sample'],
    stepTimeoutMs: parsePositiveInt(args.values['step-timeout-ms'] ?? 5000, '--step-timeout-ms'),
    settleMs: parsePositiveInt(args.values['settle-ms'] ?? 300, '--settle-ms'),
  }
  await build()
  const slugs = await readSlugs(options.requireSample)
  await render(slugs, options)
  log('[verify] PASS: build, sample, and render checks passed')
}

main().catch((error) => {
  if (error instanceof VerifyError) {
    console.error(`[verify] FAIL [${error.phase}] ${error.message}`)
  } else {
    console.error(`[verify] FAIL [usage] ${error.message}`)
  }
  process.exitCode = 1
})
