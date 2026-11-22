import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { run, withPreview, collectErrors, openPresentation, advance, SETTLE_MS } from './browser.mjs'
import { reference } from './reference.mjs'
export function assertReference(actual) {
  if (actual.length !== reference.length) throw new Error('sample must have nine steps')
  actual.forEach((step, i) => {
    for (const key of ['title', 'caption']) if (step[key] !== reference[i][key]) throw new Error(`sample step ${i}: incorrect ${key}`)
  })
}
export async function verify({ cwd = process.cwd(), build = true, slug, canonical } = {}) {
  const config = await readFile(`${cwd}/presentation.config.json`, 'utf8').then(JSON.parse).catch(() => ({}))
  slug ??= config.slug ?? 'how-to-make-a-presentation'
  canonical ??= config.reference ?? true
  let phase = 'build'
  try {
    if (build) await run('npm', ['run', 'build'], cwd)
    phase = 'sample'
    const registry = await readFile(`${cwd}/src/presentations/index.ts`, 'utf8')
    if (!registry.includes(slug)) throw new Error(`missing registered sample ${slug}`)
    await readFile(`${cwd}/src/presentations/${slug}/Talk.tsx`)
    phase = 'render'
    await withPreview(cwd, async (browser, base) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      let index = 0
      const checkErrors = collectErrors(page, () => index)
      let count
      try { count = await openPresentation(page, base, slug) } catch (e) { checkErrors(); throw new Error(`step 0: ${e.message}`) }
      const actual = []
      for (index = 0; index < count; index++) {
        try {
          if (index) await advance(page, index)
          await page.waitForTimeout(SETTLE_MS)
          checkErrors()
        } catch (error) {
          // A render crash can remove the index hook; retain its browser error
          // instead of reducing the failure to the resulting transition timeout.
          checkErrors()
          throw error
        }
        actual.push({ title: await page.locator('[data-presentation-title]').innerText(), caption: await page.locator('[data-presentation-caption]').innerText() })
        console.log(`PASS step ${index}/${count - 1}`)
      }
      phase = 'sample'
      if (canonical) assertReference(actual)
      await page.close()
    })
    console.log('PASS verification: build, sample, render')
  } catch (e) { throw new Error(`FAIL ${phase}: ${e.message}`, { cause: e }) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verify().catch(e => { console.error(e.message); process.exitCode = 1 })
}
