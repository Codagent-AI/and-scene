import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { visitSteps, watchErrors, withPreview } from './browser.mjs'
import { referenceSlug, referenceTitle, validateReference } from './reference.mjs'
export async function verify({ cwd = process.cwd(), slug = referenceSlug, build = true } = {}) {
  if (build) {
    const result = spawnSync('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
    if (result.error || result.status !== 0) {
      const detail = result.error?.message ?? result.signal ?? `exit ${result.status}`
      throw new Error(`build: npm run build failed (${detail})`, { cause: result.error })
    }
  }
  await withPreview(async ({ page, origin }) => {
    const errors = watchErrors(page)
    await page.goto(origin)
    const link = page.locator(`a[href="/${slug}"]`)
    if (await link.count() !== 1) throw new Error(`sample: missing registered route ${slug}`)
    if (slug === referenceSlug && await link.textContent().then(s => s.trim().replace(/\s*↗$/, '').trim()) !== referenceTitle) throw new Error('sample: reference title mismatch')
    const metadata = []
    await visitSteps(page, slug, origin, { errors, expectedCount: slug === referenceSlug ? 9 : undefined, capture: async () => {
      metadata.push(await page.locator('[data-presentation]').evaluate(root => [root.getAttribute('data-step-era'), root.querySelector('[data-presentation-title]')?.textContent, root.querySelector('[data-presentation-caption]')?.textContent]))
    } })
    if (slug === referenceSlug) validateReference(metadata)
  }, { cwd })
  console.log(`PASS verify ${slug}: build, registration, outline, all steps`)
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verify({ slug: process.argv.slice(2).at(-1) ?? referenceSlug }).catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1 })
}
