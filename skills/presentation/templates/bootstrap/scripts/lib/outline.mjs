// Static checks of the reference sample against the verification config.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Finds the registry entry for `slug` and returns { title, loadPath } (or a problem).
 * The registry is a literal array of `{ slug, title, load: () => import('./dir/Talk.tsx') }`.
 */
export function findRegistryEntry(registrySource, slug) {
  for (const match of registrySource.matchAll(/slug:\s*['"`]([^'"`]+)['"`]/g)) {
    if (match[1] !== slug) continue
    let start = match.index
    for (let depth = 0; start > 0; start--) {
      const ch = registrySource[start]
      if (ch === '}') depth++
      else if (ch === '{' && depth-- === 0) break
    }
    let end = start
    for (let depth = 0; end < registrySource.length; end++) {
      const ch = registrySource[end]
      if (ch === '{') depth++
      else if (ch === '}' && --depth === 0) break
    }
    const text = registrySource.slice(start, end + 1)
    return {
      title: text.match(/title:\s*(['"`])(.*?)\1/)?.[2],
      loadPath: text.match(/import\(\s*['"`](.+?)['"`]\s*\)/)?.[1],
    }
  }
  return null
}

/** Returns a list of problems; empty means the registered sample matches the config. */
export function checkSampleRegistration(root, config) {
  const registryFile = ['index.ts', 'index.tsx']
    .map((f) => path.join(root, 'src', 'presentations', f))
    .find((f) => existsSync(f))
  if (!registryFile) return ['presentation registry src/presentations/index.ts is missing']
  const entry = findRegistryEntry(readFileSync(registryFile, 'utf8'), config.slug)
  if (!entry) return [`sample "${config.slug}" is not registered in src/presentations/index.ts`]
  const problems = []
  if (entry.title !== config.title) {
    problems.push(`sample title is ${JSON.stringify(entry.title)}, expected ${JSON.stringify(config.title)}`)
  }
  if (!entry.loadPath) problems.push(`registry entry "${config.slug}" has no import() loader`)
  else {
    const base = path.resolve(path.dirname(registryFile), entry.loadPath)
    if (!existsSync(base)) problems.push(`sample source ${path.relative(root, base)} does not exist`)
  }
  return problems
}

/** Compare what the page rendered at one step with the expected outline row. */
export function checkRenderedStep(expected, rendered) {
  const problems = []
  for (const key of ['era', 'title', 'caption']) {
    if (rendered[key] !== expected[key]) {
      problems.push(`${key} is ${JSON.stringify(rendered[key])}, expected ${JSON.stringify(expected[key])}`)
    }
  }
  return problems
}
