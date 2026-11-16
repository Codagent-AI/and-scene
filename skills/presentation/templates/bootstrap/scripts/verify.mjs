import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { command, withPreview } from './browser-session.mjs'
import { OUTLINE, SAMPLE_SLUG, validateOutline, isRegistered } from './reference.mjs'

export function collectBrowserErrors(page, getStep) {
  const errors = []
  const consoleError = (message) => { if (message.type() === 'error') errors.push(`step ${getStep()}: console error: ${message.text()}`) }
  const pageError = (error) => errors.push(`step ${getStep()}: page error: ${error.message}`)
  page.on('console', consoleError)
  page.on('pageerror', pageError)
  return { assertClean() { if (errors.length) throw new Error(errors.join('\n')) }, dispose() { page.off('console', consoleError); page.off('pageerror', pageError) } }
}

export async function renderSteps(page, origin, slug, { canonical = false, settle = 700, onStep } = {}) {
  let index = 0
  let requestedStep = 0
  const errors = collectBrowserErrors(page, () => requestedStep)
  try {
    await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-step-count][data-step-index]').first()
    await chrome.waitFor({ state: 'attached', timeout: 8000 })
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1 || (canonical && count !== 9)) throw new Error(`step count invalid: ${count}`)
    for (index = 0; index < count; index++) {
      try {
        await page.waitForFunction((expected) => Number(document.querySelector('[data-step-count][data-step-index]')?.getAttribute('data-step-index')) === expected, index, { timeout: 4000 })
        await page.waitForTimeout(settle)
        errors.assertClean()
        if (canonical) {
          const text = await page.locator('body').innerText()
          if (!text.includes(OUTLINE[index][1]) || !text.includes(OUTLINE[index][2])) throw new Error('normative title/caption missing')
        }
        await onStep?.(page, index)
        console.log(`render step ${index} PASS`)
        if (index < count - 1) { requestedStep = index + 1; await page.keyboard.press('ArrowRight') }
      } catch (error) { errors.assertClean(); throw new Error(`render step ${index}: ${error.message}`, { cause: error }) }
    }
    errors.assertClean()
  } catch (error) { errors.assertClean(); throw new Error(`render step ${index}: ${error.message}`, { cause: error }) } finally { errors.dispose() }
}

export async function verify({ cwd = process.cwd(), slug = SAMPLE_SLUG, canonical = slug === SAMPLE_SLUG } = {}) {
  let phase = 'build'
  try {
    await command('npm', ['run', 'build'], cwd)
    phase = 'sample'
    const registry = await readFile(resolve(cwd, 'src/presentations/index.ts'), 'utf8')
    if (!isRegistered(registry, slug)) throw new Error(`presentation ${slug} not registered`)
    if (canonical) validateOutline(JSON.parse(await readFile(resolve(cwd, `src/presentations/${slug}/outline.json`), 'utf8')))
    phase = 'render'
    await withPreview((page, origin) => renderSteps(page, origin, slug, { canonical }), { cwd })
    console.log(`PASS verification ${slug}`)
  } catch (error) { throw new Error(`FAIL ${phase}: ${error.message}`, { cause: error }) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const slug = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : SAMPLE_SLUG
  verify({ slug }).catch((error) => { console.error(error.message); process.exitCode = 1 })
}
