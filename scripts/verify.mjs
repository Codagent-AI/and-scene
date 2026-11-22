import { pathToFileURL } from 'node:url'
import { run, withBrowser, watchErrors, stepTo } from './browser.mjs'
import { referenceSlug, referenceTitle, validateReference } from './reference.mjs'

export async function verify({ cwd = process.cwd(), slug = referenceSlug } = {}) {
  const canonical = slug === referenceSlug
  try { await run('npm', ['run', 'build'], cwd) }
  catch (error) { throw new Error(`build: ${error.message}`) }
  await withBrowser(async (page, url) => {
    const checkErrors = watchErrors(page)
    await page.goto(url)
    const link = page.locator(`a[href="/${slug}"]`)
    if (await link.count() !== 1) throw new Error(`sample: missing registered presentation ${slug}`)
    if (canonical && (await link.locator('span').first().innerText()) !== referenceTitle) throw new Error('sample: reference title differs')
    await page.goto(`${url}/${slug}`)
    await stepTo(page, 0, checkErrors)
    const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('sample: invalid step count')
    const actual = []
    for (let index = 0; index < count; index++) {
      if (index) { await page.keyboard.press('ArrowRight'); await stepTo(page, index, checkErrors) }
      const meta = await page.evaluate(() => ({
        title: document.querySelector('[data-presentation-title]')?.textContent,
        caption: document.querySelector('[data-presentation-caption]')?.textContent,
        era: document.querySelector('[data-presentation-toc-entry][data-active="true"]')?.textContent,
      }))
      actual.push(meta)
      console.log(`render PASS step ${index}`)
    }
    if (canonical) validateReference(actual)
  }, { cwd })
  console.log('PASS build, sample, render')
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slug = process.argv[2]
  verify(slug ? { slug } : {}).catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1 })
}
