import { command, withBrowser, options, stepIndex, SETTLE_MS } from './browser-tools.mjs'
import { REFERENCE, REFERENCE_SLUG, REFERENCE_TITLE, validateReference } from './reference.mjs'
const args = options(process.argv.slice(2))
let phase = 'build'; let index = 0
try {
  await command('npm', ['run', 'build'])
  phase = 'sample'
  const slug = args.slug || REFERENCE_SLUG
  const reference = slug === REFERENCE_SLUG
  await withBrowser(process.cwd(), async (browser, base) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
    await page.goto(base)
    const link = page.locator(`a[href="/${slug}"]`)
    await link.waitFor({ timeout: 5000 })
    if (reference && await link.innerText() !== REFERENCE_TITLE) throw new Error('Reference sample registration title is incorrect')
    phase = 'render'
    await page.goto(`${base}/${slug}`)
    await stepIndex(page, 0)
    const host = page.locator('[data-presentation]')
    const count = Number(await host.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid data-step-count')
    if (reference && count !== REFERENCE.length) throw new Error(`Reference sample expected 9 steps, received ${count}`)
    const actual = []
    for (index = 0; index < count; index++) {
      phase = 'transition'
      await stepIndex(page, index)
      phase = 'render'
      await page.waitForTimeout(SETTLE_MS)
      if (errors.length) throw new Error(errors.join('; '))
      actual.push({ title: await page.locator('[data-presentation-title]').innerText(), caption: await page.locator('[data-presentation-caption]').innerText(), era: await host.getAttribute('data-step-era') })
      console.log(`PASS step ${index} ${base}/${slug} data-step-count=${count}`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    phase = 'sample'
    if (reference) validateReference(actual)
  })
  console.log('PASS verification: build, registration, metadata, all steps rendered')
} catch (error) {
  console.error(`FAIL verification phase=${phase} step=${index}: ${error.message}`)
  process.exitCode = 1
}
