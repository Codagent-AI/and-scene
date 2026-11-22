import { build, visitSteps, withBrowser } from './browser.mjs'
import { REFERENCE_SLUG, validateReference } from './reference.mjs'
const args = process.argv.slice(2)
const slug = args.find(arg => !arg.startsWith('--')) || REFERENCE_SLUG
try {
  if (!args.includes('--built')) build()
  const actual = []
  await withBrowser(async (page, base) => {
    await visitSteps(page, `${base}/${slug}`, async ({ page, index }) => {
      const marker = await page.locator('[data-presentation-marker]').textContent()
      actual.push({ era: (marker || '').split(' / ').slice(1).join(' / '), title: await page.locator('[data-presentation-title]').innerText(), caption: await page.locator('[data-presentation-caption]').innerText() })
      if (slug === REFERENCE_SLUG && index === 0 && actual[0].title !== 'You have a topic') throw new Error('reference sample missing')
    }, { mode: 'browse' })
    if (slug === REFERENCE_SLUG) validateReference(actual)
  })
  console.log(`PASS verify ${slug}: ${actual.length} steps`)
} catch (error) {
  console.error(`FAIL verify ${slug}: ${error.message}`)
  process.exitCode = 1
}
