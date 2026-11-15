import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { build, visitSteps, withPreview } from './browser-session.mjs'

export function validateStep(actual, expected, index) {
  for (const field of ['title', 'caption', 'era']) {
    if (actual[field] !== expected[field]) throw new Error(`sample: step ${index} ${field} does not match reference`)
  }
}
export async function verify({ cwd = process.cwd(), slug = process.argv[2] ?? 'how-to-make-a-presentation', reference = slug === 'how-to-make-a-presentation' } = {}) {
  await build(cwd)
  const outline = reference ? JSON.parse(await readFile(new URL('./reference-outline.json', import.meta.url))) : undefined
  await withPreview(async (browser, base) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await visitSteps(page, `${base}/${slug}`, async (i, root) => {
      if (outline && await root.getAttribute('aria-label') !== 'How to Use This Skill to Make a Presentation') throw new Error('sample: reference presentation title does not match')
      if (outline) validateStep({
        title: await root.locator('[data-presentation-title]').innerText(),
        caption: await root.locator('[data-presentation-caption]').innerText(),
        era: await root.getAttribute('data-presentation-era'),
      }, outline[i], i)
    }, { expectedCount: outline?.length })
  }, { cwd })
  console.log(`PASS: build, sample, render (${slug})`)
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verify().catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1 })
}
