import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  runBuild,
  withPreview,
  readStep,
  expectIndex,
  sleep,
  SETTLE_MS,
} from './browser.mjs'
import { validateOutline, assertNoErrors } from './validation.mjs'

const slug = process.argv[2] ?? 'how-to-make-a-presentation'
let phase = 'build'
let step = 0
try {
  await runBuild()
  phase = 'sample'
  const expected =
    slug === 'how-to-make-a-presentation'
      ? JSON.parse(
          await readFile(
            fileURLToPath(new URL('./reference-outline.json', import.meta.url)),
            'utf8',
          ),
        )
      : null
  await withPreview(process.cwd(), async (browser, url) => {
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${url}/${encodeURIComponent(slug)}`)
    const seen = []
    let first
    try {
      first = await readStep(page)
    } catch (error) {
      if (errors.length) {
        phase = 'render'
        assertNoErrors(errors, 0)
      }
      throw error
    }
    if (!Number.isInteger(first.count) || first.count < 1)
      throw new Error('sample has invalid step count')
    if (expected && first.count !== expected.length)
      throw new Error('sample has incorrect step count')
    phase = 'render'
    for (step = 0; step < first.count; step++) {
      if (step) await page.keyboard.press('ArrowRight')
      try {
        await expectIndex(page, step)
      } catch (error) {
        assertNoErrors(errors, step)
        throw error
      }
      await sleep(SETTLE_MS)
      assertNoErrors(errors, step)
      seen.push(await readStep(page))
      console.log(`render step ${step} PASS`)
    }
    phase = 'sample'
    if (expected) validateOutline(seen, expected)
    await page.close()
  })
  console.log(`PASS build + ${slug} all steps`)
} catch (error) {
  console.error(`FAIL ${phase} step ${step}: ${error.message}`)
  process.exitCode = 1
}
