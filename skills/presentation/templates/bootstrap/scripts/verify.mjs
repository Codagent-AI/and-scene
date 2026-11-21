import { readFile } from 'node:fs/promises'
import { advance, build, collectErrors, DESKTOP, openPresentation, scene, SETTLE_MS, withPage, withPreview } from './browser.mjs'

let phase = 'build'
try {
  build()

  phase = 'reference configuration'
  const [slug, ...extra] = process.argv.slice(2)
  if (extra.length || slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Usage: npm run verify -- [presentation-slug]')
  }
  const target = slug
    ? { slug }
    : JSON.parse(await readFile(new URL('./verification-target.json', import.meta.url), 'utf8'))

  phase = 'preview'
  await withPreview(url => withPage(DESKTOP, async page => {
    const errors = collectErrors(page)
    phase = 'route and render at step 1 (index 0)'
    let count
    try {
      count = await openPresentation(page, url, target.slug)
    } catch (error) {
      throw new Error([...errors, error.message].join('\n'), { cause: error })
    }
    if (target.steps && target.steps.length !== count) {
      phase = 'reference outline'
      throw new Error(`Expected ${target.steps.length} steps, got ${count}`)
    }

    for (let index = 0; index < count; index++) {
      const position = `step ${index + 1} (index ${index})`
      if (index > 0) {
        phase = `transition to ${position}`
        try {
          await advance(page, index)
        } catch (error) {
          throw new Error([...errors, error.message].join('\n'), { cause: error })
        }
      }
      phase = `render at ${position}`
      await page.waitForTimeout(SETTLE_MS)
      if (errors.length) throw new Error(errors.join('\n'))
      const chrome = scene(page)
      if (Number(await chrome.getAttribute('data-step-index')) !== index) {
        throw new Error('Active step index does not match expected index')
      }
      if (target.steps) {
        phase = `reference outline at ${position}`
        const actual = await Promise.all(['era', 'step-title', 'caption'].map(
          hook => chrome.locator(`[data-presentation-${hook}]`).textContent(),
        ))
        if (actual.some((value, field) => value !== target.steps[index][field])) {
          throw new Error(`Expected ${JSON.stringify(target.steps[index])}, got ${JSON.stringify(actual)}`)
        }
      }
      console.log(`Verified ${position}`)
    }
    phase = 'browser and preview cleanup'
  }))
  console.log(`PASS: build and browser render for /${target.slug}`)
} catch (error) {
  console.error(`FAIL: ${phase}: ${error.message}`)
  process.exitCode = 1
}
