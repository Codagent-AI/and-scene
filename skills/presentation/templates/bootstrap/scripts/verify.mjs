import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { command, withBrowser, walkSteps } from './lib/browser.mjs'
import { REFERENCE_SLUG, validateSample } from './lib/validation.mjs'

export async function verify({ root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), slug = REFERENCE_SLUG } = {}) {
  let phase = 'build'
  try {
    await command('npm', ['run', 'build'], root)
    phase = 'sample'
    if (slug === REFERENCE_SLUG) {
      if (!existsSync(join(root, 'src/presentations', slug, 'Talk.tsx')) || !readFileSync(join(root, 'src/presentations/index.ts'), 'utf8').includes(slug)) throw new Error('reference sample missing or unregistered')
    }
    phase = 'render'
    await withBrowser(root, async (page, base) => {
      const steps = []
      await walkSteps(page, `${base}/${slug}`, async (page, index) => {
        const title = await page.locator('[data-presentation-step-title]').innerText()
        const caption = await page.locator('[data-presentation-caption]').innerText()
        const marker = await page.locator('[data-presentation-marker]').textContent() ?? ''
        const era = marker.split(' / ').slice(1).join(' / ')
        steps.push({ title, caption, era })
        if (slug === REFERENCE_SLUG) {
          try { validateSample([...steps, ...Array(9 - steps.length).fill(null).map((_, j) => referenceStep(index + j + 1))]) }
          catch (error) { throw new Error(`sample: ${error.message}`) }
        }
      })
      if (slug === REFERENCE_SLUG) validateSample(steps)
    })
    console.log(`PASS: build, ${slug}, all steps rendered`)
  } catch (error) { throw new Error(`FAIL [${phase}]: ${error.message}`, { cause: error }) }
}
// Validate each observed reference step as soon as it is reached so diagnostics retain its index.
import reference from './lib/reference.json' with { type: 'json' }
const referenceStep = index => { const [era, title, caption] = reference[index] ?? []; return { era, title, caption } }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--slug')
  verify({ slug: index >= 0 ? process.argv[index + 1] : undefined }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
