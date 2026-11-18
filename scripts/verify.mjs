import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { root, command, withPreview, traverse } from './browser.mjs'
import { assertReference } from './validation.mjs'
export async function validateReference() {
  const slug = 'how-to-make-a-presentation'
  const registry = await readFile(resolve(root, 'src/presentations/index.ts'), 'utf8')
  if (!registry.includes(`'${slug}'`) && !registry.includes(`"${slug}"`)) throw new Error('Reference sample is not registered')
  await access(resolve(root, `src/presentations/${slug}/Talk.tsx`))
  const source = await readFile(resolve(root, `src/presentations/${slug}/metadata.ts`), 'utf8')
  const match = source.match(/export const metadata = ([\s\S]+) as const/)
  const expected = JSON.parse(await readFile(resolve(root, 'scripts/reference.json'), 'utf8'))
  if (!match) throw new Error('Reference sample metadata is missing')
  assertReference(JSON.parse(match[1]), expected)
  return expected
}
async function main() {
  let phase = 'build'
  try {
    await command('npm', ['run', 'build'])
    phase = 'sample'
    const routeIndex = process.argv.indexOf('--route')
    const registered = process.argv.includes('--registered')
    if (registered && routeIndex >= 0) throw new Error('Use either --registered or --route')
    const slug = routeIndex < 0 ? 'how-to-make-a-presentation' : process.argv[routeIndex + 1]
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Expected a valid --route slug')
    const expected = routeIndex < 0 && !registered ? await validateReference() : undefined
    phase = 'render'
    await withPreview(async (browser, url) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      await page.goto(url)
      const slugs = registered
        ? await page.locator('[data-presentation-route]').evaluateAll(links => links.map(link => link.getAttribute('data-presentation-route')))
        : [slug]
      if (!slugs.length || new Set(slugs).size !== slugs.length || slugs.some(value => !value || !/^[a-z0-9-]+$/.test(value))) throw new Error('Expected a nonempty unique registered route list')
      for (const route of slugs) {
        if (await page.locator(`a[href="/${route}"]`).count() !== 1) throw new Error(`Registered route /${route} is missing from index`)
        try { await traverse(page, url, route, async ({ page, index, count }) => {
          if (expected) {
            if (count !== expected.length) throw new Error('Reference step count must be nine')
            const item = expected[index]
            if (await page.locator('[data-presentation-title]').textContent() !== item.title || await page.locator('[data-presentation-caption]').textContent() !== item.caption || !(await page.locator('[data-presentation-marker]').textContent()).includes(item.era)) throw new Error(`Reference content mismatch at step ${index}`)
          }
          console.log(`PASS render step ${index}/${count - 1} route=${route}`)
        }, { firstOnly: process.argv.includes('--first') }) }
        catch (error) { throw new Error(`route ${route}: ${error.message}`) }
        console.log(`PASS route ${route}`)
        await page.goto(url)
      }
    })
    console.log('PASS verification: build, registration, render')
  } catch (error) {
    console.error(`FAIL ${phase}: ${error.message}`)
    process.exitCode = 1
  }
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(root, 'scripts/verify.mjs')) await main()
