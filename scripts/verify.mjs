import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { parseOptions, readStepCount, run, visitSteps, watchErrors, withPreview } from './browser-runtime.mjs'
export function validateReference(actual, expected) {
  if (actual.length !== expected.length) throw new Error(`Reference sample needs ${expected.length} steps, received ${actual.length}`)
  for (let i = 0; i < expected.length; i++) {
    for (const key of ['id', 'era', 'title', 'caption']) {
      if (actual[i][key] !== expected[i][key]) throw new Error(`Reference step ${i}: ${key} differs from canonical outline`)
    }
  }
}
export const phaseFailure = (phase, error) => `FAIL ${phase}: ${error.message}`
export async function verify(options, cwd = process.cwd()) {
  let phase = 'build'
  try {
    if (options.build) await run('npm', ['run', 'build'], cwd)
    phase = 'reference'
    const canonical = options.slug === 'how-to-make-a-presentation'
    const expected = canonical ? JSON.parse(await readFile(new URL('./reference-outline.json', import.meta.url), 'utf8')) : null
    if (canonical) {
      const actual = JSON.parse(await readFile(resolve(cwd, 'src/presentations/how-to-make-a-presentation/outline.json'), 'utf8'))
      validateReference(actual, expected)
    }
    phase = 'render'
    await withPreview(cwd, async (browser, url) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      const errors = watchErrors(page)
      await page.goto(`${url}/${options.slug}`)
      let count
      try { count = await readStepCount(page) } catch (error) { throw new Error(`step 0: registered presentation ${options.slug} unavailable: ${error.message}`) }
      if (expected && count !== expected.length) throw new Error(`step 0: Reference count ${count}, expected ${expected.length}`)
      await visitSteps(page, count, async index => {
        if (errors.length) throw new Error(errors.join('; '))
        if (expected) {
          const title = await page.locator('[data-presentation-title]').textContent()
          const caption = await page.locator('[data-presentation-caption]').textContent()
          const marker = await page.locator('[data-presentation-marker]').textContent()
          if (title !== expected[index].title || caption !== expected[index].caption || !marker.endsWith(expected[index].era)) throw new Error('Reference rendered narration differs from canonical outline')
        }
        console.log(`STEP ${index} PASS`)
      }, options)
      await page.waitForTimeout(100)
      if (errors.length) throw new Error(`step ${count - 1}: ${errors.join('; ')}`)
    })
    console.log(`PASS verification: ${options.slug}`)
  } catch (error) { throw new Error(phaseFailure(phase, error), { cause: error }) }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await verify(parseOptions(process.argv.slice(2))) } catch (error) { console.error(error.message); process.exitCode = 1 }
}
