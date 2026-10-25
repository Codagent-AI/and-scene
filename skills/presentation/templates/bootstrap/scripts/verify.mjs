import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { build, withPreview, collectErrors, settle, assertIndex } from './browser.mjs'
import { REFERENCE, REFERENCE_SLUG, REFERENCE_TITLE } from './reference.mjs'
export async function verify({ cwd = resolve(dirname(fileURLToPath(import.meta.url)), '..'), slug = REFERENCE_SLUG, skipBuild = false } = {}) {
  let phase = 'build', index = 0
  try {
    if (!skipBuild) await build(cwd)
    phase = 'sample/registry'
    await withPreview(cwd, async (browser, base) => {
      const page = await browser.newPage()
      const assertClean = collectErrors(page)
      await page.goto(base)
      const link = page.locator(`a[href="/${slug}"]`)
      if (await link.count() !== 1) throw new Error(`Missing registered presentation ${slug}`)
      if (slug === REFERENCE_SLUG && await link.textContent().then(s => !s.includes(REFERENCE_TITLE))) throw new Error('Reference sample registry title differs')
      phase = 'render'
      await page.goto(`${base}/${slug}`)
      try { await page.locator('[data-step-count]').waitFor({ timeout: 5000 }) }
      catch (error) { assertClean(); throw error }
      const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1 || (slug === REFERENCE_SLUG && count !== REFERENCE.length)) throw new Error(`Malformed step count ${count}`)
      for (index = 0; index < count; index++) {
        try {
          await assertIndex(page, index)
          await settle(page)
          assertClean()
          if (slug === REFERENCE_SLUG) {
            const [era, title, caption] = REFERENCE[index]
            const actualTitle = await page.locator('[data-presentation-title]').textContent()
            const actualCaption = await page.locator('[data-presentation-caption]').textContent()
            const marker = await page.locator('[data-presentation-marker]').textContent()
            if (actualTitle !== title || actualCaption !== caption || !marker.endsWith(era)) throw new Error('Reference outline differs (era/title/caption/order)')
          }
          console.log(`STEP ${index} PASS`)
          if (index < count - 1) await page.keyboard.press('ArrowRight')
        } catch (error) { throw new Error(`step ${index}: ${error.message}`) }
      }
      assertClean()
    })
    console.log(`PASS verify ${slug}`)
  } catch (error) { throw new Error(`FAIL ${phase}${phase === 'render' ? ` step ${index}` : ''}: ${error.message}`) }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf('--slug')
  verify({ slug: at < 0 ? REFERENCE_SLUG : process.argv[at + 1], skipBuild: process.argv.includes('--no-build') }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
