import {
  assertRegistered,
  defaultSettleMs,
  defaultViewport,
  openPresentation,
  recordPageErrors,
  validateSlug,
  waitForStep,
} from './presentation-page.mjs'
import { buildProject, withProductionPreview } from './production-preview.mjs'
import {
  referenceSlug,
  referenceTitle,
  validateOutlineCount,
  validateOutlineStep,
} from './reference-outline.mjs'

let phase = 'arguments'

try {
  if (process.argv.length > 3) throw new Error('usage: npm run verify -- [slug]')
  const slug = validateSlug(process.argv[2] ?? referenceSlug)
  const isReference = slug === referenceSlug

  phase = 'build'
  await buildProject()
  console.log('Build passed')

  phase = 'production preview'
  await withProductionPreview(async (browser, url) => {
    const page = await browser.newPage({ viewport: defaultViewport })
    const errors = recordPageErrors(page)

    phase = 'registration'
    const route = await assertRegistered(page, url, slug, isReference ? referenceTitle : undefined)
    if (errors.length) throw new Error(errors.join('\n'))
    console.log(`Registered route ${route.href}`)

    phase = 'render step 1 (index 0)'
    let presentation
    try {
      presentation = await openPresentation(page, route)
    } catch (error) {
      throw new Error(errors.length ? errors.join('\n') : error.message, { cause: error })
    }

    const { host, count } = presentation
    if (isReference) {
      phase = 'reference outline'
      validateOutlineCount(count)
    }

    for (let index = 0; index < count; index += 1) {
      phase = `render step ${index + 1} (index ${index})`
      try {
        if (index > 0) await page.keyboard.press('ArrowRight')
        await waitForStep(page, index, defaultSettleMs)
      } catch (error) {
        throw new Error(errors.length ? errors.join('\n') : error.message, { cause: error })
      }
      if (errors.length) throw new Error(errors.join('\n'))

      if (isReference) {
        let fields
        try {
          fields = await Promise.all([
            host.getAttribute('data-presentation-era'),
            host.locator('[data-presentation-step-title]').textContent({ timeout: 1_000 }),
            host.locator('[data-presentation-caption]').textContent({ timeout: 1_000 }),
          ])
        } catch (error) {
          if (errors.length) throw new Error(errors.join('\n'), { cause: error })
          phase = `reference outline step ${index + 1} (index ${index})`
          throw error
        }
        if (errors.length) throw new Error(errors.join('\n'))

        const [era, title, caption] = fields
        phase = `reference outline step ${index + 1} (index ${index})`
        validateOutlineStep(index, { era, title, caption })
      }
      console.log(`Rendered step ${index + 1}/${count} (index ${index})`)
    }
  })

  console.log(`Verification passed for ${slug}`)
} catch (error) {
  console.error(`Verification failed [${phase}]: ${error.message}`)
  process.exitCode = 1
}
