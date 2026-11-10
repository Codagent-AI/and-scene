import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  withPreview,
  runBuild,
  readStep,
  expectIndex,
  sleep,
  SETTLE_MS,
} from './browser.mjs'
import { collectDiagnostics, diagnose } from './diagnostics.mjs'
import { settleInterval } from './validation.mjs'

const slug = process.argv[2]
try {
  const settle = settleInterval(process.env.PRESENTATION_SETTLE_MS ?? SETTLE_MS)
  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    throw new Error('Supply a registered presentation slug')
  await runBuild()
  const directory = resolve('artifacts/inspection', slug)
  await mkdir(directory, { recursive: true })
  const report = []
  await withPreview(process.cwd(), async (browser, url) => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(`${url}/${slug}`)
    const { count } = await readStep(page)
    for (let index = 0; index < count; index++) {
      if (index) await page.keyboard.press('ArrowRight')
      await expectIndex(page, index)
      const transitioned = Date.now()
      await sleep(settle)
      const warnings = diagnose(await page.evaluate(collectDiagnostics), index)
      warnings.forEach((warning) => console.warn(`ADVISORY ${warning}`))
      const file = `step-${String(index + 1).padStart(2, '0')}.png`
      await page.screenshot({ path: resolve(directory, file), fullPage: true })
      report.push({
        index,
        file,
        settle,
        elapsed: Date.now() - transitioned,
        warnings,
      })
      console.log(`captured step ${index}: ${file}`)
    }
    await page.close()
  })
  await writeFile(
    resolve(directory, 'report.json'),
    JSON.stringify(report, null, 2) + '\n',
  )
  console.log(`Inspection artifacts: ${directory}`)
} catch (error) {
  console.error(`Inspection failed: ${error.message}`)
  process.exitCode = 1
}
