import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { command, parseOptions, visitSteps, withPreview } from './browser.mjs'

export function validateReference(actual, expected, registered) {
  if (!registered) throw new Error('reference sample is not registered')
  const valid = Array.isArray(actual) && actual.length === expected.length && actual.every((step, i) => step && typeof step.id === 'string' && step.id.length > 0 && ['era', 'title', 'caption'].every(field => step[field] === expected[i][field]))
  if (!valid || new Set(actual.map(step => step.id)).size !== actual.length) throw new Error('missing or malformed reference sample: normative outline/order mismatch')
}
export async function verify(options = {}) {
  let phase = 'build'
  try {
    await command('npm', ['run', 'build'])
    const slug = options.slug ?? 'how-to-make-a-presentation'
    let expected
    // Explicit slugs verify arbitrary generated routes; bare verify enforces the reference.
    if (options.slug === undefined) {
      phase = 'reference'
      expected = JSON.parse(await readFile(new URL('./reference.json', import.meta.url), 'utf8'))
      const actual = JSON.parse(await readFile(`src/presentations/${slug}/outline.json`, 'utf8'))
      const registry = await readFile('src/presentations/index.ts', 'utf8')
      validateReference(actual, expected, new RegExp(`slug\\s*:\\s*['\"]${slug}['\"]`).test(registry))
    }
    phase = 'render'
    await withPreview((page, url) => visitSteps(page, url, slug, { ...options, expected }), options)
    console.log('PASS verification: build, registry, render')
  } catch (error) {
    throw new Error(`FAIL ${phase}: ${error.message}`, { cause: error })
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await verify(parseOptions(process.argv.slice(2))) } catch (error) { console.error(error.message); process.exitCode = 1 }
}
