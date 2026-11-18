import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build, collectErrors, parseOptions, sleep, stepCount, waitForStep, withBrowser } from './browser-runtime.mjs'
import { REFERENCE_SLUG, REFERENCE_TITLE, validateReference } from './reference.mjs'

export async function verify(options = {}, cwd = process.cwd()) {
  let phase = 'build'
  try {
    await build(cwd)
    const slug = options.slug ?? REFERENCE_SLUG
    if (!options.slug) {
      phase = 'sample'
      const registry = await readFile(resolve(cwd, 'src/presentations/index.ts'), 'utf8')
      if (!registry.includes(REFERENCE_SLUG) || !registry.includes(REFERENCE_TITLE)) throw new Error('sample: reference presentation missing from registry')
    }
    phase = 'render'
    const metadata = await withBrowser(cwd, async (page, base) => {
      const errors = collectErrors(page)
      console.log(`browser URL: ${base}/${slug}`)
      await page.goto(`${base}/${slug}`)
      let index = 0
      try {
        const count = await stepCount(page)
        const metadata = []
        for (; index < count; index++) {
          await waitForStep(page, index)
          await sleep(options.settle ?? 1000)
          if (errors.length) throw new Error(errors.join('; '))
          metadata.push(await Promise.all(['era', 'title', 'caption'].map(async (hook) => (await page.locator(`[data-presentation-${hook}]`).first().textContent())?.trim())))
          console.log(`render step ${index}/${count - 1}: clean`)
          if (index < count - 1) await page.keyboard.press('ArrowRight')
        }
        return metadata
      } catch (error) {
        throw new Error(`render step ${index}: ${error.message}`, { cause: error })
      }
    })
    if (!options.slug) { phase = 'sample'; validateReference(metadata) }
    console.log(`PASS: build + ${slug} every-step render verification`)
  } catch (error) {
    throw new Error(`FAIL [${phase}]: ${error.message}`, { cause: error })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  verify(parseOptions(process.argv.slice(2))).catch((error) => { console.error(error.message); process.exitCode = 1 })
}
