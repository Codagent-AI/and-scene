import { readFile } from 'node:fs/promises'
import { command, withPreview, monitorErrors, stepCount, advance, validateReference, SETTLE_MS } from './browser.mjs'
let phase = 'build'
try {
 await command('npm', ['run', 'build'])
 phase = 'sample'
 const config = JSON.parse(await readFile('scripts/presentation.json', 'utf8'))
 const slugArg = process.argv.indexOf('--slug')
 const slug = slugArg >= 0 ? process.argv[slugArg + 1] : config.slug
 if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('invalid presentation slug')
 const expected = config.reference && slug === config.slug ? JSON.parse(await readFile(new URL(config.reference, import.meta.url), 'utf8')) : null
 phase = 'preview'
 await withPreview(async (browser, base) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = monitorErrors(page)
  phase = 'render'
  console.log(`ROUTE ${base}/${slug}`)
  await page.goto(`${base}/${slug}`)
  try { await page.locator('[data-presentation-root]').waitFor({ timeout: 5000 }) }
  catch { errors.check(); throw new Error('sample: missing registered presentation') }
  const count = await stepCount(page)
  if (expected && (count !== expected.steps.length || await page.locator('main').getAttribute('aria-label') !== expected.title)) throw new Error('sample: incorrect title or step count')
  const actual = []
  for (let i = 0; i < count; i++) {
   errors.setStep(i)
   if (i) { try { await advance(page, i) } catch (error) { errors.check(); throw error } }
   await page.waitForTimeout(SETTLE_MS)
   errors.check()
   const state = await page.locator('[data-presentation-root]').evaluate(root => ({
    id: root.getAttribute('data-step-id'), era: root.getAttribute('data-step-era'),
    title: root.querySelector('[data-presentation-title]')?.textContent,
    caption: root.querySelector('[data-presentation-caption]')?.textContent,
   }))
   actual.push(state)
   if (expected) validateReference(actual, expected.steps.slice(0, i + 1))
   if (!state.caption || !state.title) throw new Error(`sample: missing narration at step ${i}`)
   console.log(`STEP ${i} PASS ${JSON.stringify(state)}`)
  }
  errors.check()
 })
 console.log('PASS verification: build, sample, render, transitions')
} catch (error) {
 console.error(`FAIL ${phase}: ${error.message}`)
 process.exitCode = 1
}
