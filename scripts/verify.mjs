import { command, withBrowser, projectRoot, SETTLE_MS, assertIndex, isMain } from './browser.mjs'
import { referenceSlug, referenceSteps } from './reference.mjs'
export function validateReference(actual) {
  if (JSON.stringify(actual) !== JSON.stringify(referenceSteps)) throw new Error('Reference sample must match all nine normative eras, titles and captions in order')
}
export async function verify({ root = projectRoot, route, build = true } = {}) {
  let phase = 'build'
  let index = 0
  try {
    if (build) await command('npm', ['run', 'build'], root)
    phase = 'sample'
    return await withBrowser(root, async (page, url) => {
      const errors = []
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('pageerror', error => errors.push(error.message))
      const slug = route ?? referenceSlug
      await page.goto(url)
      await page.locator('main').waitFor({ timeout: 5000 })
      if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`Missing registered presentation: ${slug}`)
      await page.goto(`${url}/${slug}`)
      phase = 'render'
      await assertIndex(page, 0)
      const rootHook = page.locator('[data-presentation-root]')
      if (await rootHook.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
      const count = Number(await rootHook.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
      if (!route && count !== referenceSteps.length) { phase = 'sample'; throw new Error('Reference sample must have nine steps') }
      const actual = []
      for (index = 0; index < count; index++) {
        if (index) { phase = 'transition'; await page.keyboard.press('ArrowRight'); await assertIndex(page, index) }
        phase = 'render'
        await page.waitForTimeout(SETTLE_MS)
        if (errors.length) throw new Error(errors.join('; '))
        actual.push({ era: await rootHook.getAttribute('data-step-era'), title: await page.locator('[data-presentation-title]').innerText(), caption: await page.locator('[data-presentation-caption]').innerText() })
        console.log(`STEP ${index} OK`)
      }
      if (!route) { phase = 'sample'; validateReference(actual) }
      console.log(`PASS verify ${slug}: ${count} steps`)
      return { count, actual }
    })
  } catch (error) { throw new Error(`FAIL ${phase} step ${index}: ${error.message}`, { cause: error }) }
}
if (isMain(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length && (args.length !== 2 || args[0] !== '--route' || !/^[a-z0-9-]+$/.test(args[1]))) { console.error('Usage: node scripts/verify.mjs [--route <slug>]'); process.exitCode = 1 }
  else await verify({ route: args[1] }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
