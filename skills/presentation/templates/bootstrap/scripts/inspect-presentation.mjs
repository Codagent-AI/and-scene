import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { withBrowser, watchErrors, stepTo } from './browser.mjs'
import { collectDiagnostics, diagnose } from './diagnostics.mjs'
import { referenceSlug } from './reference.mjs'

export async function inspectPresentation(slug = referenceSlug, { cwd = process.cwd(), settle = 800, viewport = { width: 1440, height: 900 } } = {}) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid presentation slug')
  if (!Number.isFinite(settle) || settle < 700) throw new Error('Settle interval must be at least 700ms')
  const directory = resolve(cwd, 'artifacts/inspections', slug, `${viewport.width}x${viewport.height}`)
  await mkdir(directory, { recursive: true })
  return withBrowser(async (page, url) => {
    const checkErrors = watchErrors(page)
    await page.goto(url)
    if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`Unregistered presentation ${slug}`)
    await page.goto(`${url}/${slug}`)
    await stepTo(page, 0, checkErrors, settle)
    const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
    const results = []
    for (let index = 0; index < count; index++) {
      if (index) { await page.keyboard.press('ArrowRight'); await stepTo(page, index, checkErrors, settle) }
      const warnings = diagnose(await page.evaluate(collectDiagnostics), index)
      warnings.forEach(warning => console.warn(`ADVISORY ${warning}`))
      const path = resolve(directory, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path })
      console.log(`capture step ${index} settled=${settle}ms ${path}`)
      results.push({ index, path, warnings })
    }
    return results
  }, { cwd, viewport })
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [slug = referenceSlug, width = '1440', height = '900'] = process.argv.slice(2)
  inspectPresentation(slug, { viewport: { width: Number(width), height: Number(height) } })
    .catch(error => { console.error(error.message); process.exitCode = 1 })
}
