import { mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { advance, build, collectErrors, DESKTOP, openPresentation, scene, SETTLE_MS, withPage, withPreview } from './browser.mjs'
import { visualWarnings } from './visual-warnings.mjs'

try {
  const { positionals: [slug, ...extra], values } = parseArgs({
    allowPositionals: true,
    options: { viewport: { type: 'string' }, settle: { type: 'string' } },
  })
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || extra.length) {
    throw new Error('Usage: npm run inspect -- <presentation-slug> [--viewport=1440x900] [--settle=720]')
  }
  const dimensions = values.viewport?.match(/^([1-9]\d{0,3})x([1-9]\d{0,3})$/)
  if (values.viewport && !dimensions) throw new Error('Viewport must be WIDTHxHEIGHT in pixels')
  const viewport = dimensions ? { width: Number(dimensions[1]), height: Number(dimensions[2]) } : DESKTOP
  const settle = values.settle === undefined ? SETTLE_MS : Number(values.settle)
  if (!/^\d+$/.test(String(values.settle ?? settle)) || settle < 0 || settle > 30000) {
    throw new Error('Settle time must be an integer between 0 and 30000 milliseconds')
  }
  const directory = join('artifacts', 'presentation-inspection', slug, `${viewport.width}x${viewport.height}`)

  build()
  await withPreview(url => withPage(viewport, async page => {
    const errors = collectErrors(page)
    const count = await openPresentation(page, url, slug)
    await mkdir(directory, { recursive: true })
    const captures = new Set()
    for (let index = 0; index < count; index++) {
      if (index) await advance(page, index)
      await page.waitForTimeout(settle)
      if (errors.length) throw new Error(`step ${index + 1}: ${errors.join('\n')}`)
      const filename = `step-${String(index + 1).padStart(2, '0')}.png`
      const path = join(directory, filename)
      const warnings = await scene(page).evaluate(visualWarnings)
      await page.screenshot({ path })
      captures.add(filename)
      console.log(`Captured step ${index + 1}: ${path}`)
      for (const warning of warnings) console.warn(`Warning at step ${index + 1}: ${warning}`)
    }
    for (const filename of await readdir(directory)) {
      if (/^step-\d{2,}\.png$/.test(filename) && !captures.has(filename)) {
        await rm(join(directory, filename))
      }
    }
  }))
} catch (error) {
  console.error(`Inspection failed: ${error.message}`)
  process.exitCode = 1
}
