// Deterministic verification: build the whole app, then render every step of every
// registered presentation (or the slugs passed as arguments) in Chromium against a
// production preview. Exits non-zero and names the failing check and step on failure.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { HOST, ROOT, readRegisteredSlugs, runBuild, sleep, startPreview } from './lib.mjs'

const SETTLE_MS = 1200

/**
 * Optional required reference sample: `scripts/reference-sample.json` = { slug, steps: [{ title, caption }] }.
 * When present, that presentation must be registered and show exactly these steps, in order.
 */
function readReferenceSample() {
  const file = join(ROOT, 'scripts', 'reference-sample.json')
  if (!existsSync(file)) return null
  try {
    const sample = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof sample.slug !== 'string' || !Array.isArray(sample.steps)) throw new Error('expected { slug, steps[] }')
    return sample
  } catch (err) {
    throw new CheckFailure('sample', `scripts/reference-sample.json is malformed: ${err.message}`)
  }
}

const stepLabel = (i) => `step ${i + 1} (index ${i})`

class CheckFailure extends Error {
  constructor(check, detail) {
    super(`${check}: ${detail}`)
    this.check = check
  }
}

async function renderPresentation(browser, origin, slug, expected) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`console.error: ${msg.text()}`))
  page.on('pageerror', (err) => errors.push(`uncaught: ${err.message}`))
  try {
    const url = `${origin}/${slug}`
    if (!url.startsWith(`http://${HOST}:`)) throw new CheckFailure('render', `non-IPv4 URL ${url}`)
    await page.goto(url)
    const root = page.locator('[data-presentation-root]')
    try {
      await root.waitFor({ timeout: 15_000 })
    } catch {
      throw new CheckFailure('render', `${slug}: first step did not render (${errors.join('; ') || 'no presentation root'})`)
    }
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new CheckFailure('render', `${slug}: invalid data-step-count`)
    if (expected && count !== expected.length) {
      throw new CheckFailure('sample', `${slug}: expected ${expected.length} steps, found ${count}`)
    }
    for (let i = 0; i < count; i++) {
      const index = Number(await root.getAttribute('data-step-index'))
      if (index !== i) throw new CheckFailure('render', `${slug} ${stepLabel(i)}: found step index ${index}`)
      if (expected) {
        const title = (await page.locator('[data-presentation-title]').first().textContent({ timeout: 2_000 }).catch(() => null))?.trim()
        const caption = (await page.locator('[data-presentation-caption]').first().textContent({ timeout: 2_000 }).catch(() => null))?.trim()
        if (title !== expected[i].title || caption !== expected[i].caption) {
          throw new CheckFailure('sample', `${slug} ${stepLabel(i)}: expected "${expected[i].title}" / "${expected[i].caption}", found "${title}" / "${caption}"`)
        }
      }
      await sleep(SETTLE_MS)
      if (errors.length) throw new CheckFailure('render', `${slug} ${stepLabel(i)}: ${errors[0]}`)
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (next) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(next),
            i + 1,
            { timeout: 5_000 },
          )
        } catch {
          throw new CheckFailure('render', `${slug} ${stepLabel(i)}: transition to ${stepLabel(i + 1)} failed`)
        }
      }
    }
    if (errors.length) throw new CheckFailure('render', `${slug} ${stepLabel(count - 1)}: ${errors[0]}`)
    return count
  } finally {
    await page.close()
  }
}

async function main() {
  const registered = await readRegisteredSlugs()
  const sample = readReferenceSample()
  if (sample && !registered.includes(sample.slug)) {
    throw new CheckFailure('sample', `reference sample "${sample.slug}" is not registered in src/presentations/index.ts`)
  }
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : registered
  if (sample && !slugs.includes(sample.slug)) slugs.push(sample.slug)
  if (slugs.length === 0) throw new CheckFailure('registry', 'no presentations registered in src/presentations/index.ts')
  for (const slug of slugs) {
    if (!registered.includes(slug)) throw new CheckFailure('registry', `${slug} is not registered`)
  }
  if (!runBuild()) throw new CheckFailure('build', 'npm run build failed')
  console.log('verify: build ok')

  const preview = await startPreview()
  console.log(`verify: preview ready at ${preview.origin}`)
  let browser
  try {
    browser = await chromium.launch()
    for (const slug of slugs) {
      const count = await renderPresentation(browser, preview.origin, slug, sample?.slug === slug ? sample.steps : null)
      console.log(`verify: ${slug} rendered ${count} steps ok`)
    }
  } finally {
    await browser?.close()
    preview.stop()
  }
}

main().then(
  () => {
    console.log('VERIFY PASS')
    process.exit(0)
  },
  (err) => {
    console.error(`VERIFY FAIL [${err.check ?? 'error'}] ${err.message}`)
    process.exit(1)
  },
)
