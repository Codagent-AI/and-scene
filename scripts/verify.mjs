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
    const slug = routeIndex < 0 ? 'how-to-make-a-presentation' : process.argv[routeIndex + 1]
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Expected a valid --route slug')
    const expected = routeIndex < 0 ? await validateReference() : undefined
    phase = 'render'
    await withPreview(async (browser, url) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      await page.goto(url)
      if (await page.locator(`a[href="/${slug}"]`).count() !== 1) throw new Error(`Registered route /${slug} is missing from index`)
      await traverse(page, url, slug, async ({ page, index, count }) => {
        if (expected) {
          if (count !== expected.length) throw new Error('Reference step count must be nine')
          const item = expected[index]
          if (await page.locator('[data-presentation-title]').textContent() !== item.title || await page.locator('[data-presentation-caption]').textContent() !== item.caption || !(await page.locator('[data-presentation-marker]').textContent()).includes(item.era)) throw new Error(`Reference content mismatch at step ${index}`)
        }
        console.log(`PASS render step ${index}/${count - 1}`)
      }, { firstOnly: process.argv.includes('--first') })
    })
    console.log('PASS verification: build, registration, render')
  } catch (error) {
    console.error(`FAIL ${phase}: ${error.message}`)
    process.exitCode = 1
  }
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(root, 'scripts/verify.mjs')) await main()
