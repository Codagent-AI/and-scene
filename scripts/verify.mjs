import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { validateCount, validateStep } from './validation.mjs'
import { build, withPreview, openPresentation, waitStep, assertClean, SETTLE_MS } from './browser.mjs'
export async function verify({ cwd = process.cwd(), slug, firstOnly = false } = {}) {
  await build(cwd)
  const config = JSON.parse(await readFile(resolve(cwd, 'presentation.config.json'), 'utf8'))
  const target = slug ?? config.slug
  const reference = config.reference && target === config.slug ? JSON.parse(await readFile(resolve(cwd, 'scripts/reference.json'), 'utf8')) : null
  await withPreview(cwd, async (browser, url) => {
    const { page, count, errors } = await openPresentation(browser, url, target).catch(error => { throw new Error(`sample/route phase step 0: ${error.message}`) })
    if (reference) validateCount(count, reference)
    for (let index = 0; index < (firstOnly ? 1 : count); index++) {
      try { await waitStep(page, index) } catch (error) { assertClean(errors, index); throw error }
      await page.waitForTimeout(SETTLE_MS)
      assertClean(errors, index)
      if (reference) {
        const title = await page.locator('[data-presentation-title]').textContent()
        const caption = await page.locator('[data-presentation-caption]').textContent()
        const marker = await page.locator('[data-presentation-marker]').textContent()
        validateStep({ title, caption, era: marker.slice(marker.indexOf(' / ') + 3) }, reference[index], index)
      }
      console.log(`render PASS step ${index}/${count - 1}`)
      if (index + 1 < (firstOnly ? 1 : count)) await page.keyboard.press('ArrowRight')
    }
    await page.close()
  })
  console.log('PASS build + sample + render verification')
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  verify({ slug: process.argv.slice(2).find(arg => !arg.startsWith('--')), firstOnly: process.argv.includes('--first') }).catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1 })
}
