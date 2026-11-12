/* global document */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { command, readStepCount, SETTLE_MS, waitForStep, withBrowser } from './browser.mjs'
import { REFERENCE_SLUG, REFERENCE_TITLE, validateReference } from './reference.mjs'

export async function verify({ root = process.cwd(), slug = REFERENCE_SLUG, build = true } = {}) {
  let phase = 'build'
  let index = 0
  try {
    if (build) await command('npm', ['run', 'build'], root)
    phase = 'sample'
    const registry = await readFile(resolve(root, 'src/presentations/index.ts'), 'utf8')
    if (!registry.includes(slug)) throw new Error(`presentation ${slug} is not registered`)
    if (slug === REFERENCE_SLUG && !registry.includes(REFERENCE_TITLE)) throw new Error('canonical sample title is missing from registry')
    await withBrowser(root, async (page, baseURL) => {
      const errors = []
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
      await page.goto(`${baseURL}/${slug}`)
      const count = await readStepCount(page)
      if (slug === REFERENCE_SLUG && count !== 9) throw new Error(`expected nine sample steps, found ${count}`)
      phase = 'render'
      const metadata = []
      for (index = 0; index < count; index += 1) {
        if (index > 0) {
          phase = 'transition'
          await page.keyboard.press('ArrowRight')
          await waitForStep(page, index)
        }
        phase = 'render'
        await page.waitForTimeout(SETTLE_MS)
        if (errors.length) throw new Error(errors.join('\n'))
        metadata.push(await page.evaluate(() => ({
          title: document.querySelector('[data-presentation-title]')?.textContent?.trim(),
          caption: document.querySelector('[data-presentation-caption]')?.textContent?.trim(),
          era: document.querySelector('[data-step-index]')?.getAttribute('data-step-era'),
        })))
        console.log(`Rendered step ${index}/${count - 1}`)
      }
      if (slug === REFERENCE_SLUG) { phase = 'sample'; validateReference(metadata) }
    })
    console.log(`PASS verification ${slug}`)
  } catch (error) {
    throw new Error(`FAIL ${phase} step ${index}: ${error.message}`, { cause: error })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const option = process.argv.find((arg) => arg.startsWith('--slug='))
  const slug = option?.slice(7) ?? (process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : undefined)
  verify({ slug }).catch((error) => { console.error(error.message); process.exitCode = 1 })
}
