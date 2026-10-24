// Build the whole app, then render every registered presentation in Chromium against a
// production preview, stepping through each step via the public data-step-* hooks.
// Exits non-zero with `FAIL [phase] ...` on the first failure.
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { HOST, PhaseError, readFlag, readRegistrySlugs, reportFailure, runBuild, startPreview } from './lib/preview.mjs'

const root = resolve(readFlag(process.argv, '--root') ?? process.cwd())
const STEP_TIMEOUT_MS = 4000
const SETTLE_MS = 500

function readConfig() {
  const file = join(root, 'verify.config.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { required: [] }
}

function compareOutline(slug, expected, observed) {
  if (observed.length !== expected.length) {
    throw new PhaseError('sample', `${slug}: expected ${expected.length} steps but rendered ${observed.length}`)
  }
  expected.forEach((want, i) => {
    for (const field of ['era', 'title', 'caption']) {
      if (observed[i][field] !== want[field]) {
        throw new PhaseError(
          'sample',
          `${slug} step ${i + 1}: expected ${field} ${JSON.stringify(want[field])} but found ${JSON.stringify(observed[i][field])}`,
        )
      }
    }
  })
}

async function renderPresentation(browser, baseUrl, slug) {
  const page = await browser.newPage()
  let current = 1
  const errors = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`console.error: ${msg.text()}`))
  page.on('pageerror', (err) => errors.push(`uncaught exception: ${err.message}`))
  const failIfErrors = () => {
    if (errors.length) throw new PhaseError('render', `${slug} step ${current}: ${errors[0]}`)
  }
  try {
    const url = `${baseUrl}/${slug}`
    await page.goto(url, { waitUntil: 'load' })
    if (!page.url().startsWith(`http://${HOST}:`)) throw new PhaseError('render', `unexpected browser URL ${page.url()}`)
    try {
      await page.waitForSelector('[data-step-count]', { timeout: 15000 })
    } catch {
      failIfErrors()
      throw new PhaseError('render', `${slug}: presentation did not render (no [data-step-count] at ${url})`)
    }
    const hook = (name) => page.locator('[data-presentation-root]').getAttribute(name)
    const count = Number(await hook('data-step-count'))
    if (!(count > 0)) throw new PhaseError('render', `${slug}: step count hook reported ${count}`)
    const observed = []
    for (let i = 0; i < count; i++) {
      current = i + 1
      if (Number(await hook('data-step-index')) !== i) {
        throw new PhaseError('transition', `${slug} step ${current}: data-step-index is not ${i}`)
      }
      await page.waitForTimeout(SETTLE_MS)
      observed.push({
        era: await hook('data-step-era'),
        title: await hook('data-presentation-title'),
        caption: await hook('data-presentation-caption'),
      })
      failIfErrors()
      if (i < count - 1) {
        current = i + 2
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (want) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === want,
            String(i + 1),
            { timeout: STEP_TIMEOUT_MS },
          )
        } catch {
          failIfErrors()
          throw new PhaseError('transition', `${slug} step ${i + 1}: ArrowRight did not advance data-step-index to ${i + 1}`)
        }
      }
    }
    return { count, observed }
  } finally {
    await page.close()
  }
}

async function main() {
  runBuild(root)
  console.log('verify: build ok')

  const slugs = readRegistrySlugs(root)
  const { required = [] } = readConfig()
  for (const sample of required) {
    if (!slugs.includes(sample.slug)) {
      throw new PhaseError('sample', `required presentation "${sample.slug}" is not registered in src/presentations/index.ts`)
    }
  }
  if (slugs.length === 0) throw new PhaseError('registry', 'no presentations are registered')

  const preview = await startPreview(root)
  console.log(`verify: preview ${preview.url}`)
  let browser
  try {
    browser = await chromium.launch()
    let steps = 0
    for (const slug of slugs) {
      const { count, observed } = await renderPresentation(browser, preview.url, slug)
      const sample = required.find((r) => r.slug === slug)
      if (sample) compareOutline(slug, sample.steps, observed)
      steps += count
      console.log(`verify: ${slug} rendered ${count} steps`)
    }
    console.log(`PASS verify: build ok, ${slugs.length} presentation(s), ${steps} step(s) rendered without errors`)
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

main().catch((error) => {
  reportFailure(error)
  process.exit(1)
})
