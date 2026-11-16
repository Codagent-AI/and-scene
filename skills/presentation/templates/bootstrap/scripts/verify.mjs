import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { ROOT, command, withPreview, settle, stepTo, browseRoot } from './browser.mjs'
export function validateReference(actual, expected) {
  if (actual.length !== expected.length) throw new Error(`sample: expected ${expected.length} steps, got ${actual.length}`)
  expected.forEach((step, index) => {
    for (const key of ['title', 'caption', 'era']) if (actual[index][key] !== step[key]) throw new Error(`sample step ${index}: ${key} differs from canonical outline`)
  })
}
export function failure(phase, index, message) { return `FAIL ${phase}${index === undefined ? '' : ` step ${index}`}: ${message}` }
export async function verify({ route = 'how-to-make-a-presentation', first = false, build = true, root = ROOT } = {}) {
  let phase = 'build', index, activeStep = 0
  const errors = []
  const assertNoErrors = () => {
    if (!errors.length) return
    phase = 'render'
    index = errors[0].step
    throw new Error(errors.map(error => error.message).join('; '))
  }
  try {
    if (build) await command('npm', ['run', 'build'], root)
    phase = 'sample'
    const isReference = route === 'how-to-make-a-presentation'
    const expected = isReference ? JSON.parse(await readFile(resolve(root, 'scripts/reference.json'), 'utf8')) : null
    if (isReference && !(await readFile(resolve(root, 'src/presentations/index.ts'), 'utf8')).includes(route)) throw new Error('reference sample is not registered')
    phase = 'render'; index = 0
    await withPreview(async (page, base) => {
      page.on('console', message => { if (message.type() === 'error') errors.push({ step: activeStep, message: message.text() }) })
      page.on('pageerror', error => errors.push({ step: activeStep, message: error.message }))
      await page.goto(`${base}/${route}`)
      const rootHook = await browseRoot(page)
      const count = Number(await rootHook.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error('invalid step count')
      if (expected && count !== expected.length) throw new Error(`sample count expected ${expected.length}, got ${count}`)
      const actual = []
      for (index = 0; index < (first ? 1 : count); index++) {
        activeStep = index
        await stepTo(page, index)
        await settle(page)
        assertNoErrors()
        const title = await page.locator('[data-presentation-title]').textContent() ?? ''
        const caption = await page.locator('[data-presentation-caption]').textContent() ?? ''
        const marker = await page.locator('[data-presentation-marker]').textContent() ?? ''
        assertNoErrors()
        const era = marker.split(' · ')[1]
        actual.push({ title, caption, era })
        if (expected) { phase = 'sample'; validateReference([actual[index]], [expected[index]]); phase = 'render' }
        console.log(`PASS step ${index}: ${title}`)
      }
    }, { root })
    // withPreview has closed Chromium: no later page event can escape this gate.
    assertNoErrors()
    console.log(`PASS verification ${route}`)
    return true
  } catch (error) { console.error(failure(phase, index, error.message)); return false }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const route = args.find(arg => !arg.startsWith('--'))
  if (!await verify({ route, first: args.includes('--first') })) process.exitCode = 1
}
