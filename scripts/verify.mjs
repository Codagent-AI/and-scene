/* global document */
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { command, withPreview, visitSteps } from './browser.mjs'
import { REFERENCE_SLUG, validateReference } from './reference.mjs'

export async function verify({ cwd = process.cwd(), slug = REFERENCE_SLUG } = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('sample: invalid presentation slug')
  await command('npm', ['run', 'build'], cwd)
  const actual = []
  await withPreview(async ({ page, origin }) => {
    // A landing link proves explicit registration, not just a manually reachable file.
    await page.goto(origin)
    if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`sample: missing registered presentation ${slug}`)
    await visitSteps(page, `${origin}/${slug}`, async ({ page }) => {
      actual.push(await page.evaluate(() => [
        document.querySelector('[data-presentation-era]')?.textContent?.trim(),
        document.querySelector('[data-presentation-title]')?.textContent?.trim(),
        document.querySelector('[data-presentation-caption]')?.textContent?.trim(),
      ]))
    })
    if (slug === REFERENCE_SLUG) validateReference(actual)
  }, { cwd })
  console.log(`PASS: build, registration, ${actual.length} steps (${slug})`)
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verify({ slug: process.argv[2] ?? REFERENCE_SLUG }).catch((error) => {
    console.error(`FAIL: ${error.message}`)
    process.exitCode = 1
  })
}
