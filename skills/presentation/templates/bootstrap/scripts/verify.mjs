import { fileURLToPath } from 'node:url'
import { command, withBrowser, watchErrors, settleStep, browserFailure } from './browser.mjs'
import { checkReference, SAMPLE_SLUG, projectRoot } from './reference.mjs'
export async function verify({ cwd = projectRoot, slug = SAMPLE_SLUG, build = true } = {}) {
  let phase = 'build'
  try {
    if (build) await command('npm', ['run', 'build'], cwd)
    phase = 'sample'
    const expected = slug === SAMPLE_SLUG ? await checkReference(cwd) : null
    phase = 'render'
    await withBrowser(cwd, async (page, origin) => {
      const errors = watchErrors(page)
      let index = 0
      try {
        await page.goto(`${origin}/${slug}`)
        await settleStep(page, 0)
        const root = page.locator('[data-presentation-root]')
        const count = Number(await root.getAttribute('data-step-count'))
        if (!Number.isInteger(count) || count < 1 || (expected && count !== expected.length)) throw new Error('invalid step count')
        for (index = 0; index < count; index++) {
          if (index > 0) { await page.keyboard.press('ArrowRight'); await settleStep(page, index) }
          if (errors.length) throw browserFailure(index, errors)
          if (expected) for (const key of ['era', 'title', 'caption']) {
            if (await root.getAttribute(`data-step-${key}`) !== expected[index][key]) throw new Error(`incorrect rendered ${key}`)
          }
          console.log(`PASS step ${index} / ${count - 1}`)
        }
      } catch (error) { throw new Error(`render step ${index}: ${errors.length ? errors.join('; ') : error.message}`, { cause: error }) }
    })
    console.log(`PASS verification: ${slug}`)
  } catch (error) { throw new Error(`FAIL ${phase}: ${error.message}`, { cause: error }) }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv.findLast(arg => arg.startsWith('--slug='))?.slice(7)
  verify({ slug }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
