import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildApp, withPreview, openPresentation, advanceTo, delay, DEFAULT_SETTLE_MS } from './browser.mjs'
import { REFERENCE_SLUG, REFERENCE_TITLE, validateReferenceStep, validateStepCount } from './reference.mjs'

export async function verifyPresentation({ cwd = process.cwd(), slug = REFERENCE_SLUG, build = true, settleMs = DEFAULT_SETTLE_MS } = {}) {
  let phase = 'build'
  let step = 0
  try {
    if (build) await buildApp(cwd)
    phase = 'sample'
    const registry = await readFile(resolve(cwd, 'src/presentations/index.ts'), 'utf8')
    if (!registry.includes(slug)) throw new Error(`sample: ${slug} is not registered`)
    if (slug === REFERENCE_SLUG && !registry.includes(REFERENCE_TITLE)) throw new Error('sample: reference title is missing from registry')
    await withPreview(cwd, async ({ browser, origin }) => {
      phase = 'render'
      const { page, errors } = await openPresentation(browser, origin, slug)
      const count = validateStepCount(await page.locator('[data-presentation]').getAttribute('data-step-count'), slug === REFERENCE_SLUG)
      for (step = 0; step < count; step++) {
        phase = 'transition'
        await advanceTo(page, step)
        phase = 'render'
        await delay(settleMs)
        if (errors.length) throw new Error(errors.join('; '))
        if (slug === REFERENCE_SLUG) {
          phase = 'sample'
          validateReferenceStep(step, {
            title: await page.locator('[data-presentation-title]').textContent(),
            caption: await page.locator('[data-presentation-caption]').textContent(),
          })
        }
        console.log(`PASS step ${step}/${count - 1}`)
      }
      await page.close()
    })
    console.log(`PASS verify ${slug}`)
  } catch (error) {
    throw new Error(`FAIL ${phase} step ${step}: ${error.message}`, { cause: error })
  }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] || '')).href) {
  verifyPresentation({ slug: process.argv[2] || REFERENCE_SLUG }).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
