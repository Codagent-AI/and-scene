import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { command, options, SETTLE_MS, withBrowser } from './browser-runtime.mjs'
export function validateReference(actual, expected) {
  if (actual.length !== expected.length) throw new Error(`Reference sample requires ${expected.length} steps`)
  expected.forEach((step, index) => {
    for (const key of ['title', 'caption', 'era']) {
      if (actual[index][key] !== step[key]) throw new Error(`Reference sample step ${index}: invalid ${key}`)
    }
  })
}
export async function verify({ slug, noBuild = false, settle = SETTLE_MS } = {}) {
  let phase = 'build'; let stepIndex = 0
  const target = slug ?? 'how-to-make-a-presentation'
  try {
    if (!noBuild) await command('npm', ['run', 'build'])
    phase = 'sample'
    const expected = slug ? undefined : JSON.parse(await readFile(new URL('./reference-outline.json', import.meta.url), 'utf8'))
    await withBrowser(async (page, origin) => {
      const errors = []
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(origin)
      if (await page.locator(`a[href="/${target}"]`).count() === 0) throw new Error(`Missing registered sample: ${target}`)
      await page.goto(`${origin}/${target}`)
      const host = page.locator('[data-presentation]')
      await host.waitFor({ timeout: 5000 })
      if (await host.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
      const count = Number(await host.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
      if (expected && count !== expected.length) throw new Error(`Reference sample requires ${expected.length} steps; got ${count}`)
      phase = 'render'
      const actual = []
      for (stepIndex = 0; stepIndex < count; stepIndex++) {
        if (stepIndex) await page.keyboard.press('ArrowRight')
        await page.waitForFunction(index => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(index), stepIndex, { timeout: 3000 })
        await page.waitForTimeout(settle)
        if (errors.length) throw new Error(errors.join('; '))
        actual.push({ title: await page.locator('[data-presentation-step-title]').textContent(), caption: await page.locator('[data-presentation-caption]').textContent(), era: (await page.locator('[data-presentation-marker]').textContent()).split(' / ').slice(1).join(' / ') })
        console.log(`STEP ${stepIndex} PASS`)
      }
      phase = 'sample'
      if (expected) validateReference(actual, expected)
    })
    console.log(`PASS verification: ${target}`)
    return true
  } catch (error) {
    console.error(`FAIL ${phase} step ${stepIndex}: ${error.message}`)
    return false
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await verify(options()) ? 0 : 1
}
