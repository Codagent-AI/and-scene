import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { command, withPreview } from './browser.mjs'
export function validateSample(actual, expected, registered) {
  if (!registered || actual.length !== expected.length || actual.some((s, i) => ['id', 'era', 'title', 'caption'].some(key => s[key] !== expected[i][key]))) throw new Error('reference sample missing or malformed/out of order')
}
export async function verify() {
  let phase = 'build'
  let index = 0
  try {
    await command('npm', ['run', 'build'])
    phase = 'sample'
    const expected = JSON.parse(await readFile(new URL('./reference.json', import.meta.url), 'utf8'))
    const actual = JSON.parse(await readFile('src/presentations/how-to-make-a-presentation/metadata.json', 'utf8'))
    const registry = await readFile('src/presentations/index.ts', 'utf8')
    validateSample(actual, expected, /slug\s*:\s*['"]how-to-make-a-presentation['"]/.test(registry))
    phase = 'render'
    await withPreview(async (browser, url) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
      const errors = []
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${url}/how-to-make-a-presentation`)
      const root = page.locator('[data-step-count]')
      await root.waitFor()
      if (Number(await root.getAttribute('data-step-count')) !== expected.length) throw new Error('incorrect step count')
      for (index = 0; index < expected.length; index++) {
        await page.waitForFunction(i => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i), index, { timeout: 4000 })
        await page.waitForTimeout(900)
        if (await page.locator('[data-presentation-title]').innerText() !== expected[index].title || await page.locator('[data-presentation-caption]').innerText() !== expected[index].caption) throw new Error('rendered sample metadata differs')
        if (errors.length) throw new Error(errors.join('; '))
        console.log(`PASS step ${index}: ${expected[index].title}`)
        if (index < expected.length - 1) await page.keyboard.press('ArrowRight')
      }
    })
    console.log('PASS verification')
    return true
  } catch (error) {
    console.error(`FAIL ${phase}${phase === 'render' ? ` step ${index}` : ''}: ${error.message}`)
    return false
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await verify() ? 0 : 1
