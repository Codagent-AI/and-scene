import { pathToFileURL } from 'node:url'
import { build, withPreview, browserErrors, visit, advance } from './browser.mjs'
import { REFERENCE_SLUG, REFERENCE_TITLE, validateReference } from './reference.mjs'

export async function verify({ cwd = process.cwd(), slug = REFERENCE_SLUG, skipBuild = false } = {}) {
  if (!skipBuild) build(cwd)
  const canonical = slug === REFERENCE_SLUG
  await withPreview(async (page, baseURL) => {
    const errors = browserErrors(page)
    const { host, count } = await visit(page, baseURL, slug, errors)
    const metadata = []
    for (let index = 0; index < count; index++) {
      if (index) await advance(page, host, index, errors)
      await page.waitForTimeout(850)
      errors.assertClean()
      const actualIndex = Number(await host.getAttribute('data-step-index'))
      if (actualIndex !== index) throw new Error(`transition: step ${index} has index ${actualIndex}`)
      metadata.push(await host.evaluate(el => ({ era: el.dataset.stepEra, title: el.dataset.stepTitle, caption: el.dataset.stepCaption })))
      console.log(`render: step ${index} / ${count} clean`)
    }
    if (canonical) validateReference(metadata, await host.getAttribute('aria-label'))
    errors.assertClean()
  }, { cwd })
  console.log(`PASS: build, ${canonical ? REFERENCE_TITLE : slug}, and every step rendered`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slugIndex = process.argv.indexOf('--presentation')
  verify({ slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : undefined }).catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1 })
}
