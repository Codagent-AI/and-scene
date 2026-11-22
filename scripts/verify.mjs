import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, withPreview, captureErrors, assertClean, stepIndex, SETTLE_MS } from './browser.mjs'
export function validateOutline(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) throw new Error('sample: missing or malformed step count')
  expected.forEach((step, index) => {
    for (const field of ['id', 'era', 'title', 'caption']) {
      if (actual[index]?.[field] !== step[field]) throw new Error(`sample step ${index}: ${field} differs from reference outline`)
    }
  })
}
export async function verify({ cwd = process.cwd(), slug = 'how-to-make-a-presentation', firstOnly = false } = {}) {
  await build(cwd)
  const canonical = slug === 'how-to-make-a-presentation'
  let expected
  if (canonical) {
    try {
      expected = JSON.parse(await readFile(resolve(cwd, 'scripts/reference-outline.json'), 'utf8'))
      validateOutline(JSON.parse(await readFile(resolve(cwd, `src/presentations/${slug}/outline.json`), 'utf8')), expected)
    } catch (error) { throw new Error(`sample: ${error.message}`) }
  }
  await withPreview(cwd, async (browser, url) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = captureErrors(page)
    console.log(`browser URL: ${url}/${slug}`)
    await page.goto(`${url}/${slug}`)
    try { await page.locator('[data-step-count]').waitFor({ timeout: 5000 }) }
    catch { assertClean(errors, 0); throw new Error('sample: registered route did not render presentation hooks at step 0') }
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1 || (canonical && count !== expected.length)) throw new Error('sample: invalid rendered step count')
    for (let index = 0; index < (firstOnly ? 1 : count); index++) {
      if (index) await page.keyboard.press('ArrowRight')
      await stepIndex(page, index)
      await page.waitForTimeout(SETTLE_MS)
      assertClean(errors, index)
      if (canonical) {
        for (const [hook, field] of [['title', 'title'], ['caption', 'caption']]) {
          if (await page.locator(`[data-presentation-${hook}]`).textContent() !== expected[index][field]) throw new Error(`sample step ${index}: rendered ${field} mismatch`)
        }
        if (!(await page.locator('[data-presentation-marker]').textContent()).endsWith(expected[index].era)) throw new Error(`sample step ${index}: rendered era mismatch`)
      }
      console.log(`PASS render step ${index}/${count - 1}`)
    }
  })
  console.log('PASS verification: build, sample and render')
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const slugIndex = process.argv.indexOf('--slug')
  verify({ slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : undefined, firstOnly: process.argv.includes('--first') }).catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1 })
}
