import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { withPreview, sleep } from './browser.mjs'
export function validateSample(actual, expected) {
  if (actual.length !== expected.length) throw new Error(`sample: expected ${expected.length} steps, got ${actual.length}`)
  for (let index = 0; index < expected.length; index++) {
    for (const key of ['id', 'era', 'title', 'caption']) {
      if (actual[index][key] !== expected[index][key]) throw new Error(`sample step ${index}: ${key} differs from canonical outline`)
    }
  }
}
export function browserFailure(errors, index) {
  if (errors.length) throw new Error(`render step ${index}: ${errors.join('; ')}`)
}
export async function verify({ slug, cwd = process.cwd(), build = true } = {}) {
  let phase = 'build'
  try {
    if (build) {
      const result = spawnSync('npm', ['run', 'build'], { cwd, stdio: 'inherit', timeout: 180000 })
      if (result.status !== 0) throw new Error(`build exited ${result.status ?? result.error}`)
    }
    phase = 'sample'
    const reference = !slug
    slug ??= 'how-to-make-a-presentation'
    const expected = JSON.parse(readFileSync(new URL('./reference.json', import.meta.url), 'utf8'))
    phase = 'render'
    await withPreview(async ({ browser, url }) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      const errors = []
      let index = 0
      page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
      page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
      await page.goto(`${url}/${slug}`)
      try { await page.locator('[data-step-count]').waitFor({ timeout: 5000 }) } catch { browserFailure(errors, index); throw new Error('sample: registered presentation missing or unreachable') }
      const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error('sample: invalid step count')
      if (reference && count !== expected.length) throw new Error(`sample: expected ${expected.length} steps, got ${count}`)
      const actual = []
      for (index = 0; index < count; index++) {
        if (index) await page.keyboard.press('ArrowRight')
        try { await page.waitForFunction(i => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3500 }) }
        catch { browserFailure(errors, index); throw new Error(`transition step ${index}: public index did not advance`) }
        await sleep(850)
        browserFailure(errors, index)
        actual.push(await page.locator('[data-step-index]').evaluate(root => ({
          id: root.getAttribute('data-step-id'), era: root.getAttribute('data-step-era'),
          title: root.querySelector('[data-presentation-title]')?.textContent,
          caption: root.querySelector('[data-presentation-caption]')?.textContent,
        })))
        console.log(`render step ${index}: PASS`)
      }
      if (reference) validateSample(actual, expected)
    }, { cwd })
    console.log(`PASS verify ${slug}`)
    return true
  } catch (error) {
    console.error(`FAIL ${phase}: ${error.message}`)
    return false
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const position = process.argv.indexOf('--slug')
  if (position >= 0 && !process.argv[position + 1]) { console.error('FAIL arguments: --slug requires a registered slug'); process.exitCode = 1 }
  else process.exitCode = await verify({ slug: position >= 0 ? process.argv[position + 1] : undefined }) ? 0 : 1
}
