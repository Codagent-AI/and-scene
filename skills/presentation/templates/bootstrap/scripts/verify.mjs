import { readFile } from 'node:fs/promises'
import { command, walkSteps, withBrowser } from './browser.mjs'
export function validateOutline(actual, expected) {
  if (actual.length !== expected.length) throw new Error(`Expected ${expected.length} steps, got ${actual.length}`)
  expected.forEach((step, i) => {
    for (const key of ['title', 'caption', 'era']) if (actual[i][key] !== step[key]) throw new Error(`Sample step ${i}: ${key} differs from normative outline`)
  })
}
export async function verify({ cwd = process.cwd(), route, first = false, build = true } = {}) {
  let phase = 'build'
  try {
    if (build) await command('npm', ['run', 'build'], cwd)
    phase = 'sample'
    const config = JSON.parse(await readFile(`${cwd}/scripts/verify-config.json`, 'utf8'))
    const selected = route ?? config.route
    let reference
    if (!route && config.reference) {
      reference = JSON.parse(await readFile(`${cwd}/scripts/${config.reference}`, 'utf8'))
      const registry = await readFile(`${cwd}/src/presentations/index.ts`, 'utf8')
      if (!registry.includes(reference.slug) || !registry.includes(reference.title)) throw new Error('Missing reference sample registration')
    }
    phase = 'render'
    await withBrowser(async (page, url) => {
      const actual = []
      await walkSteps(page, url, selected, async (page, index, count) => {
        const title = await page.locator('[data-presentation-title]').innerText()
        const caption = await page.locator('[data-presentation-caption]').innerText()
        const marker = await page.locator('[data-presentation-marker]').innerText()
        actual.push({ title, caption, era: marker.split(' / ')[1] })
        if (reference) {
          if (count !== reference.steps.length) throw new Error(`Sample count ${count} differs from ${reference.steps.length}`)
          validateOutline([actual[index]], [reference.steps[index]])
        }
      }, { first })
      if (reference && !first) validateOutline(actual, reference.steps)
    }, { cwd })
    console.log('PASS build + sample + render verification')
  } catch (error) { throw new Error(`FAIL ${phase}: ${error.message}`, { cause: error }) }
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const args = process.argv.slice(2)
  verify({ route: args.includes('--route') ? args[args.indexOf('--route') + 1] : undefined, first: args.includes('--first'), build: !args.includes('--skip-build') }).catch(error => { console.error(error.message); process.exitCode = 1 })
}
