import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { build, withPreview, settle, assertIndex, collectErrors, SETTLE_MS } from './browser.mjs'
import { inspectDocument } from './diagnostics.mjs'
export async function inspectPresentation({ cwd = resolve(dirname(fileURLToPath(import.meta.url)), '..'), slug, skipBuild = false, settleMs = SETTLE_MS } = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error('Specify a registered presentation slug')
  if (!Number.isFinite(settleMs) || settleMs < SETTLE_MS) throw new Error(`Settle interval must be at least ${SETTLE_MS}ms`)
  if (!skipBuild) await build(cwd)
  const out = resolve(cwd, 'artifacts/inspection', slug)
  await mkdir(out, { recursive: true })
  return withPreview(cwd, async (browser, base) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const assertClean = collectErrors(page)
    await page.goto(base)
    if (!await page.locator(`a[href="/${slug}"]`).count()) throw new Error(`Unregistered presentation ${slug}`)
    await page.goto(`${base}/${slug}`)
    await page.locator('[data-step-count]').waitFor()
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    const result = []
    for (let index = 0; index < count; index++) {
      await assertIndex(page, index)
      await settle(page, settleMs)
      assertClean()
      const warnings = await page.evaluate(inspectDocument)
      warnings.forEach(warning => console.warn(`WARN ${warning}`))
      const path = resolve(out, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path })
      console.log(`CAPTURE step ${index} after ${settleMs}ms ${path}`)
      result.push({ index, path, warnings })
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    return result
  })
}
if (process.argv[1] === fileURLToPath(import.meta.url)) inspectPresentation({ slug: process.argv[2] }).catch(error => { console.error(error.message); process.exitCode = 1 })
