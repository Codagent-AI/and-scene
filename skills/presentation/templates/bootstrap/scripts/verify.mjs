import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import { build, withBrowser, isMain, argument } from './browser.mjs'
export const SAMPLE = 'how-to-make-a-presentation'
export async function validateReference(cwd) {
  try {
    const expected = JSON.parse(await readFile(new URL('./reference.json', import.meta.url), 'utf8'))
    const actual = JSON.parse(await readFile(path.join(cwd, 'src/presentations', SAMPLE, 'metadata.json'), 'utf8'))
    await access(path.join(cwd, 'src/presentations', SAMPLE, 'Talk.tsx'))
    const registry = await readFile(path.join(cwd, 'src/presentations/index.ts'), 'utf8')
    if (!registry.includes(`slug: '${SAMPLE}'`) && !registry.includes(`slug: "${SAMPLE}"`)) throw new Error('sample not registered')
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('sample metadata missing, malformed or out of order')
    return expected
  } catch (error) { throw new Error(`sample: ${error.message}`) }
}
export function browserFault(kind, message, step) { return new Error(`render: step ${step}: ${kind}: ${message}`) }
export async function verify({ cwd = process.cwd(), slug = SAMPLE, reference = true, skipBuild = false } = {}) {
  if (!skipBuild) build(cwd)
  const expected = reference ? await validateReference(cwd) : undefined
  await withBrowser(cwd, async (page, url) => {
    let step = 0
    let activeStep = 0
    const errors = []
    page.on('console', message => { if (message.type() === 'error') errors.push(browserFault('console', message.text(), activeStep)) })
    page.on('pageerror', error => errors.push(browserFault('pageerror', error.message, activeStep)))
    await page.goto(`${url}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    try { await root.waitFor() } catch { throw errors[0] ?? browserFault('route', 'presentation root not found', 0) }
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1 || (expected && count !== expected.length)) throw new Error('sample: invalid step count')
    for (step = 0; step < count; step++) {
      try {
        await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), step, { timeout: 3500 })
      } catch { throw errors[0] ?? browserFault('transition', 'step index did not advance', step) }
      await page.waitForTimeout(900)
      if (errors.length) throw errors[0]
      if (expected) {
        const title = await page.locator('[data-presentation-title]').textContent()
        const caption = await page.locator('[data-presentation-caption]').textContent()
        const marker = await page.locator('[data-presentation-marker]').textContent()
        if (title !== expected[step].title || caption !== expected[step].caption || !marker.includes(expected[step].era)) throw new Error(`sample: step ${step}: title, caption or era mismatch`)
      }
      console.log(`render: step ${step}/${count - 1} PASS`)
      if (step < count - 1) { activeStep = step + 1; await page.keyboard.press('ArrowRight') }
    }
    if (errors.length) throw errors[0]
  })
  console.log(`PASS: build, ${reference ? 'reference sample, ' : ''}render (${slug})`)
}
if (isMain(import.meta.url)) verify({ slug: argument('--slug', SAMPLE), reference: !process.argv.includes('--no-reference') }).catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1 })
