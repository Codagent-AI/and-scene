// Deterministic verification: build the whole app, then render every step of every
// registered presentation (or the slugs passed as arguments) in Chromium against a
// production preview. Exits non-zero and names the failing check and step on failure.
import { chromium } from 'playwright'
import { HOST, readRegisteredSlugs, runBuild, sleep, startPreview } from './lib.mjs'

const SETTLE_MS = 1200

class CheckFailure extends Error {
  constructor(check, detail) {
    super(`${check}: ${detail}`)
    this.check = check
  }
}

async function renderPresentation(browser, origin, slug) {
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
    for (let i = 0; i < count; i++) {
      const index = Number(await root.getAttribute('data-step-index'))
      if (index !== i) throw new CheckFailure('render', `${slug}: expected step ${i}, found step ${index}`)
      await sleep(SETTLE_MS)
      if (errors.length) throw new CheckFailure('render', `${slug} step ${i}: ${errors[0]}`)
      if (i < count - 1) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction(
            (next) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(next),
            i + 1,
            { timeout: 5_000 },
          )
        } catch {
          throw new CheckFailure('render', `${slug} step ${i}: transition to step ${i + 1} failed`)
        }
      }
    }
    return count
  } finally {
    await page.close()
  }
}

async function main() {
  const registered = await readRegisteredSlugs()
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : registered
  if (slugs.length === 0) throw new CheckFailure('registry', 'no presentations registered in src/presentations/index.ts')
  for (const slug of slugs) {
    if (!registered.includes(slug)) throw new CheckFailure('registry', `${slug} is not registered`)
  }
  if (!runBuild()) throw new CheckFailure('build', 'npm run build failed')
  console.log('verify: build ok')

  const preview = await startPreview()
  let browser
  try {
    browser = await chromium.launch()
    for (const slug of slugs) {
      const count = await renderPresentation(browser, preview.origin, slug)
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
