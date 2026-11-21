import { mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import {
  assertRegistered,
  defaultSettleMs,
  defaultViewport,
  openPresentation,
  recordPageErrors,
  validateSlug,
  waitForStep,
} from './presentation-page.mjs'
import { buildProject, withProductionPreview } from './production-preview.mjs'
import { collectVisualEvidence, diagnoseVisualEvidence } from './visual-diagnostics.mjs'

function readOptions(args) {
  const [slug, ...options] = args
  if (!slug) {
    throw new Error('usage: npm run inspect -- <slug> [--width N] [--height N] [--settle-ms N]')
  }

  const settings = { '--width': defaultViewport.width, '--height': defaultViewport.height, '--settle-ms': defaultSettleMs }
  for (let index = 0; index < options.length; index += 2) {
    const flag = options[index]
    const value = options[index + 1]
    if (!Object.hasOwn(settings, flag) || !/^\d+$/.test(value ?? '') || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
      throw new Error(`invalid option ${flag} ${value ?? ''}`.trim())
    }
    settings[flag] = Number(value)
  }
  return {
    slug: validateSlug(slug),
    viewport: { width: settings['--width'], height: settings['--height'] },
    settleMs: settings['--settle-ms'],
  }
}

let phase = 'arguments'

try {
  const { slug, viewport, settleMs } = readOptions(process.argv.slice(2))
  const output = join('artifacts', 'presentations', slug, `${viewport.width}x${viewport.height}`)

  phase = 'build'
  await buildProject()

  phase = 'production preview'
  await withProductionPreview(async (browser, url) => {
    const page = await browser.newPage({ viewport })
    const errors = recordPageErrors(page)
    phase = 'registration'
    const route = await assertRegistered(page, url, slug)

    phase = 'render step 1'
    const { count } = await openPresentation(page, route)
    await mkdir(output, { recursive: true })

    const files = await readdir(output, { withFileTypes: true })
    await Promise.all(files.filter((entry) => entry.isFile() && /^step-\d+\.png$/.test(entry.name))
      .map((entry) => rm(join(output, entry.name))))

    const digits = Math.max(2, String(count).length)
    for (let index = 0; index < count; index += 1) {
      phase = `render step ${index + 1}`
      if (index > 0) await page.keyboard.press('ArrowRight')
      await waitForStep(page, index, settleMs)
      if (errors.length) throw new Error(errors.join('\n'))

      const warnings = diagnoseVisualEvidence(await page.evaluate(collectVisualEvidence))
      for (const warning of warnings) console.warn(`Step ${index + 1} warning: ${warning}`)
      const screenshot = join(output, `step-${String(index + 1).padStart(digits, '0')}.png`)
      await page.screenshot({ path: screenshot })
      if (errors.length) throw new Error(errors.join('\n'))
      console.log(`Captured step ${index + 1} after ${settleMs}ms: ${screenshot}`)
    }
  })
  console.log(`Inspection artifacts are in ${output}`)
} catch (error) {
  console.error(`Inspection failed [${phase}]: ${error.message}`)
  process.exitCode = 1
}
