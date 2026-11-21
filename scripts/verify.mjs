import { build, withPreview } from './preview.mjs'
import { advance, openPresentation, readRegistry, ROOT, selectBrowseMode, watchBrowserErrors } from './driver.mjs'
import { reference } from './reference.mjs'

const args = process.argv.slice(2)
const isReference = args[0] === '--reference'
const slug = args[isReference ? 1 : 0]

async function verify() {
  const cwd = process.cwd()
  await build(cwd)
  await withPreview(cwd, async ({ browser, origin }) => {
    const page = await browser.newPage()
    const registryErrors = watchBrowserErrors(page)
    const entries = await readRegistry(page, origin)
    registryErrors.assertClean()
    await page.close()

    const canonical = isReference && entries.find(entry => entry.slug === reference.slug)
    if (isReference && (!canonical || canonical.title !== reference.title || canonical.href !== `/${reference.slug}`)) {
      throw new Error(`Reference sample missing or malformed in registry: ${reference.slug}`)
    }
    const selected = slug ? entries.filter(entry => entry.slug === slug) : isReference ? [canonical] : entries
    if (!selected.length) throw new Error(slug ? `Presentation is not registered: ${slug}` : 'No registered presentations')

    for (const entry of selected) {
      const expected = isReference && entry === canonical ? reference : undefined
      const route = await browser.newPage()
      const errors = watchBrowserErrors(route)
      const count = await openPresentation(route, origin, entry, errors)
      if (expected && (count !== expected.steps.length
        || await route.locator(ROOT).getAttribute('data-presentation-name') !== expected.title)) {
        throw new Error('Reference sample has unexpected name or step count')
      }
      await selectBrowseMode(route)
      for (let index = 0; index < count; index++) {
        if (index > 0) await advance(route, index, errors)
        const era = await route.locator(ROOT).getAttribute('data-presentation-era-name')
        const title = await route.locator('[data-presentation-title]').textContent({ timeout: 3000 })
        const caption = await route.locator('[data-presentation-caption]').textContent({ timeout: 3000 })
        if (expected && (era !== expected.steps[index][0]
          || title !== expected.steps[index][1] || caption !== expected.steps[index][2])) {
          throw new Error(`Reference sample title or caption differs at step index ${index}: ${title} | ${caption}`)
        }
        // Also catch errors triggered by entry animations and the first frame of a new scene.
        await route.waitForTimeout(650)
        errors.assertClean()
        console.log(`Verified ${entry.slug} at step index ${index}: ${title}`)
      }
      await route.close()
    }
  })
  console.log('Verification passed.')
}

try {
  await verify()
} catch (error) {
  console.error(`Verification failed: ${error.message}`)
  process.exitCode = 1
}
