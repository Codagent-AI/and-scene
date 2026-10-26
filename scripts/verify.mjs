import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build, isMain, projectRoot, readStepCount, settleStep, watchErrors, withBrowser } from './browser-runtime.mjs'

export function validateOutline(actual, expected) {
  if (actual.length !== expected.length) throw new Error(`sample: expected ${expected.length} steps; got ${actual.length}`)
  for (let i = 0; i < expected.length; i++) {
    for (const field of ['era', 'title', 'caption']) {
      if (actual[i][field] !== expected[i][field]) throw new Error(`sample step ${i}: ${field} does not match canonical outline`)
    }
  }
}
export async function verify({ root = projectRoot, route, skipBuild = false } = {}) {
  let phase = 'build'
  let index = 0
  try {
    if (!skipBuild) await build(root)
    phase = 'sample'
    const config = JSON.parse(await readFile(resolve(root, 'verification.config.json'), 'utf8'))
    const reference = config.reference
    const routes = reference ? [...new Set([reference, ...(route ? [route] : [])])] : route ? [route] : config.routes
    if (!Array.isArray(routes) || !routes.length) throw new Error('no registered verification routes configured')
    const expected = reference ? JSON.parse(await readFile(resolve(root, 'scripts/reference-outline.json'), 'utf8')) : null
    await withBrowser(async (page, url) => {
      const checkErrors = watchErrors(page)
      for (const slug of routes) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`invalid route slug: ${slug}`)
        index = 0
        console.log(`PHASE sample: route ${url}/${slug}`)
        await page.goto(`${url}/${slug}`)
        const count = await readStepCount(page)
        if (slug === reference && await page.locator('[data-presentation-document-title]').textContent() !== 'How to Use This Skill to Make a Presentation') throw new Error('sample: incorrect presentation title')
        if (slug === reference && expected && count !== expected.length) throw new Error(`sample: expected ${expected.length} steps; got ${count}`)
        const actual = []
        phase = 'render'
        for (index = 0; index < count; index++) {
          await settleStep(page, index)
          checkErrors()
          actual.push(await page.evaluate(() => ({
            era: document.querySelector('[data-presentation-marker]').textContent.split(' / ').slice(1).join(' / '),
            title: document.querySelector('[data-presentation-title]').textContent,
            caption: document.querySelector('[data-presentation-caption]')?.textContent,
          })))
          console.log(`PASS render step ${index}`)
          if (index < count - 1) await page.keyboard.press('ArrowRight')
        }
        if (slug === reference && expected) { phase = 'sample'; validateOutline(actual, expected) }
      }
    }, { root })
    console.log('PASS verification: build, sample, render')
  } catch (error) {
    throw new Error(`FAIL ${phase}${phase === 'render' || phase === 'sample' ? ` step ${index}` : ''}: ${error.message}`, { cause: error })
  }
}
if (isMain(import.meta.url)) {
  const routeIndex = process.argv.indexOf('--route')
  verify({ route: routeIndex >= 0 ? process.argv[routeIndex + 1] : undefined }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
