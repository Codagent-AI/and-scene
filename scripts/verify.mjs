import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { ROOT, command, traverse, withPreview } from './browser.mjs'
import { validateSample } from './sample-validation.mjs'
export async function verify({ cwd = ROOT, slug, build = true } = {}) {
  let phase = 'build'
  try {
    if (build) await command('npm', ['run', 'build'], cwd)
    phase = 'sample'
    const expected = slug ? undefined : JSON.parse(await readFile(resolve(cwd, 'scripts/reference.json'), 'utf8'))
    const route = slug ?? 'how-to-make-a-presentation'
    phase = 'render'
    await withPreview(cwd, async (browser, url) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      const actual = []
      await traverse(page, `${url}/${route}`, { expectedCount: expected?.length, onStep: async (index, root) => {
        if (expected && await root.getAttribute('aria-label') !== 'How to Use This Skill to Make a Presentation') throw new Error('sample: incorrect presentation title')
        actual.push({ id: await root.getAttribute('data-step-id'), era: await root.getAttribute('data-step-era'), title: await page.locator('[data-presentation-title]').innerText(), caption: await page.locator('[data-presentation-caption]').innerText() })
        if (expected) validateSample(actual, expected.slice(0, index + 1))
      } })
      if (expected) validateSample(actual, expected)
    })
    console.log('PASS: build + sample + render')
  } catch (error) { throw new Error(`FAIL [${phase}]: ${error.message}`, { cause: error }) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  verify({ slug: process.argv[2] }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
