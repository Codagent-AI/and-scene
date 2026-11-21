import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { advance, openPresentation, readRegistry, selectBrowseMode, watchBrowserErrors } from './driver.mjs'
import { build, withPreview } from './preview.mjs'
import { inspectStep } from './visual-diagnostics.mjs'

function integer(value, option, minimum) {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < minimum) throw new Error(`Invalid --${option}: ${value}`)
  return number
}

async function inspect() {
  const { positionals: [slug], values } = parseArgs({
    allowPositionals: true,
    options: {
      width: { type: 'string', default: '1440' },
      height: { type: 'string', default: '900' },
      'settle-ms': { type: 'string', default: '700' },
    },
  })
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Usage: npm run inspect -- <presentation-slug> [--width 1440] [--height 900] [--settle-ms 700]')
  }
  const viewport = { width: integer(values.width, 'width', 1), height: integer(values.height, 'height', 1) }
  const settle = integer(values['settle-ms'], 'settle-ms', 0)
  const cwd = process.cwd()
  const directory = path.join(cwd, '.presentation-inspection', slug, `${viewport.width}x${viewport.height}`)

  await build(cwd)
  await withPreview(cwd, async ({ browser, origin }) => {
    const page = await browser.newPage({ viewport })
    const errors = watchBrowserErrors(page)
    const entry = (await readRegistry(page, origin)).find(item => item.slug === slug)
    if (!entry) throw new Error(`Presentation is not registered: ${slug}`)

    const count = await openPresentation(page, origin, entry, errors)
    await selectBrowseMode(page)
    await mkdir(directory, { recursive: true })
    for (let index = 0; index < count; index++) {
      if (index > 0) await advance(page, index, errors)
      await page.waitForTimeout(settle)
      errors.assertClean()

      const warnings = await page.evaluate(inspectStep)
      for (const warning of warnings) console.warn(`Advisory at step ${index + 1} (index ${index}): ${warning}`)
      const screenshot = path.join(directory, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: screenshot })
      console.log(`Captured step ${index + 1}: ${path.relative(cwd, screenshot)}`)
    }
    errors.assertClean()
  })
}

try {
  await inspect()
} catch (error) {
  console.error(`Inspection failed: ${error.message}`)
  process.exitCode = 1
}
